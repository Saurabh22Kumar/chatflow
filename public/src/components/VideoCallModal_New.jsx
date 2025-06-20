import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import Peer from 'simple-peer';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

// Global guard to prevent duplicate peer connections across all instances
const globalActiveConnections = new Map(); // callId -> { peerRef, componentId }
// Global guard to ensure only one instance processes signals per callId
const globalSignalProcessors = new Map(); // callId -> componentId

const VideoCallModal_New = ({ 
  isOpen, 
  onClose, 
  socket, 
  currentUser, 
  contact, 
  callType = 'video',
  isIncoming = false, 
  callId = null,
  onCallEnd = null
}) => {
  // States
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [connectionEstablished, setConnectionEstablished] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  // Buffer for pending signals (for race condition fix)
  const [pendingSignals, setPendingSignals] = useState([]);

  // Refs
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  const callTimerRef = useRef();

  // Guard: Only allow one peer connection per callId
  const peerCreatedRef = useRef(false);
  // Guard: Only process the first offer signal per callId
  const offerProcessedRef = useRef(false);
  
  // Unique component instance ID
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      
      // Cleanup global connection if it belongs to this component
      const existing = globalActiveConnections.get(callId);
      if (existing && existing.componentId === componentIdRef.current) {
        globalActiveConnections.delete(callId);
        console.log(`[GLOBAL CLEANUP] Removed connection for callId ${callId} from component ${componentIdRef.current}`);
      }
      
      // Cleanup signal processor if it belongs to this component
      const existingProcessor = globalSignalProcessors.get(callId);
      if (existingProcessor === componentIdRef.current) {
        globalSignalProcessors.delete(callId);
        console.log(`[GLOBAL CLEANUP] Removed signal processor for callId ${callId} from component ${componentIdRef.current}`);
      }
    };
  }, [callId]);

  // Start call timer
  const startTimer = useCallback(() => {
    setCallTimer(0);
    callTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        setCallTimer(prev => prev + 1);
      }
    }, 1000);
  }, []);

  // Format timer
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Create peer connection - MOVED HERE to fix hoisting issue
  const createPeerConnection = useCallback((currentStream, initiator) => {
    // Global guard: Check if this callId already has an active connection
    if (globalActiveConnections.has(callId)) {
      const existing = globalActiveConnections.get(callId);
      console.warn(`[GLOBAL GUARD] Peer connection already exists for callId ${callId} (component: ${existing.componentId}), skipping creation from component: ${componentIdRef.current}`);
      return;
    }
    
    if (peerCreatedRef.current) {
      console.warn("[LOCAL GUARD] Peer connection already created for this callId, skipping.");
      return;
    }
    
    peerCreatedRef.current = true;
    globalActiveConnections.set(callId, { 
      componentId: componentIdRef.current,
      peerRef: connectionRef 
    });
    
    console.log("🔗 CREATING PEER CONNECTION:");
    console.log("🔗 Initiator:", initiator);
    console.log("🔗 Stream:", !!currentStream);
    console.log("🔗 CallId:", callId);
    console.log("🔗 Component ID:", componentIdRef.current);
    
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: currentStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      }
    });

    peer.on("signal", (data) => {
      console.log("🔄 PEER SIGNAL GENERATED:");
      console.log("🔄 Signal type:", data.type);
      console.log("🔄 Sending to:", contact._id);
      console.log("🔄 From:", currentUser._id);
      console.log("🔄 Using CallId:", callId);
      
      if (socket?.current) {
        socket.current.emit("sendSignal", {
          signal: data,
          from: currentUser._id,
          to: contact._id,
          callId: callId // This MUST be the final callId
        });
        console.log("✅ Signal sent via socket with callId:", callId);
      } else {
        console.error("❌ No socket connection!");
      }
    });

    peer.on("stream", (remoteStream) => {
      console.log("Received remote stream");
      console.log("Remote stream tracks:", remoteStream.getTracks().map(t => t.kind));
      
      // Store remote stream in state - will be assigned to video element in useEffect
      setRemoteStream(remoteStream);
      
      if (!connectionEstablished) {
        console.log("Setting callAccepted and connectionEstablished to true");
        setConnectionEstablished(true);
        setCallAccepted(true);
        startTimer();
      } else {
        console.log("Connection already established, not updating states");
      }
    });

    peer.on("connect", () => {
      console.log("Peer connection established");
    });

    peer.on("error", (error) => {
      console.error("Peer connection error:", error);
    });

    connectionRef.current = peer;
  }, [socket, currentUser, contact, callId, connectionEstablished, startTimer]);

  // Get user media when modal opens OR when callId changes (for caller)
  useEffect(() => {
    if (!isOpen || !mountedRef.current) return;
    
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("❌ getUserMedia is not supported in this browser");
      alert("Your browser doesn't support video calls. Please use a modern browser like Chrome, Firefox, or Safari.");
      return;
    }
    
    const constraints = {
      video: callType === 'video',
      audio: true
    };

    console.log("🎥 Requesting media permissions with constraints:", constraints);
    console.log("🎥 CallId:", callId, "IsIncoming:", isIncoming);
    
    navigator.mediaDevices.getUserMedia(constraints)
      .then((currentStream) => {
        if (!mountedRef.current) return;
        
        console.log("✅ Got user media:", currentStream);
        console.log("Local stream tracks:", currentStream.getTracks().map(t => t.kind));
        setStream(currentStream);
        streamRef.current = currentStream;
        
        // Show local video
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
          console.log("Assigned local stream to myVideo element");
        } else {
          console.error("myVideo ref is null!");
        }

        // Start WebRTC connection after getting media
        if (isIncoming) {
          // For incoming calls, we're the receiver - wait for signal
          console.log("📞 INCOMING CALL: Waiting for caller's signal. CallId:", callId);
          console.log("📞 INCOMING CALL: Stream ready:", !!currentStream);
          console.log("📞 INCOMING CALL: Socket ready:", !!socket?.current);
          
          // Process any buffered signals now that stream is ready
          if (pendingSignals.length > 0) {
            console.log("📡 🚀 Processing", pendingSignals.length, "buffered signals");
            pendingSignals.forEach(signalData => {
              console.log("📡 PROCESSING buffered signal:", signalData.signal?.type);
              // Create connection for incoming call
              if (!connectionRef.current) {
                createPeerConnection(currentStream, false);
              }
              // Signal after creation
              setTimeout(() => {
                if (connectionRef.current) {
                  connectionRef.current.signal(signalData.signal);
                }
              }, 100);
            });
            setPendingSignals([]); // Clear buffer
          }
        } else {
          // For outgoing calls, we're the initiator - but WAIT for call acceptance
          console.log("📞 OUTGOING CALL: Stream ready, waiting for call acceptance. CallId:", callId);
          console.log("📞 OUTGOING CALL: Stream ready:", !!currentStream);
          // DO NOT create peer connection here - wait for call acceptance
        }
      })
      .catch((error) => {
        console.error("❌ Error accessing media:", error);
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        
        // Show specific error messages
        if (error.name === 'NotAllowedError') {
          console.error("🚫 User denied permission for camera/microphone");
          alert("Please allow camera and microphone access to join the call");
        } else if (error.name === 'NotFoundError') {
          console.error("📹 No camera/microphone found");
          alert("No camera or microphone found on your device");
        } else if (error.name === 'NotReadableError') {
          console.error("🔒 Camera/microphone is being used by another application");
          alert("Camera or microphone is being used by another application");
        } else {
          console.error("❓ Unknown media error");
          alert("Unable to access camera/microphone: " + error.message);
        }
      });

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isOpen, callType, isIncoming, callId]); // Added callId as dependency!

  // Separate effect to handle callId updates for outgoing calls
  useEffect(() => {
    if (!isOpen || isIncoming || !streamRef.current || !callId) return;
    
    // For outgoing calls: if callId changed and we have stream but no peer connection
    if (!connectionRef.current && callId && !callId.includes('undefined')) {
      console.log("🔄 CallId updated for outgoing call, creating peer connection:", callId);
      createPeerConnection(streamRef.current, true);
    }
  }, [callId, isOpen, isIncoming, createPeerConnection]);

  // Socket event listeners
  useEffect(() => {
    if (!socket?.current) {
      console.error("❌ No socket connection in VideoCallModal");
      return;
    }

    console.log("🔌 Setting up socket listeners in VideoCallModal for callId:", callId);

    const handleReceiveSignal = (data) => {
      console.log("📡 RECEIVED SIGNAL in VideoCallModal:");
      console.log("📡 Signal type:", data.signal?.type);
      console.log("📡 From:", data.from);
      console.log("📡 CallId:", data.callId);
      console.log("📡 My CallId:", callId);
      console.log("📡 Connection exists:", !!connectionRef.current);
      console.log("📡 Stream exists:", !!streamRef.current);
      console.log("📡 Is incoming:", isIncoming);
      console.log("📡 Component ID:", componentIdRef.current);
      
      if (data.callId !== callId) {
        console.log("📡 IGNORING: CallId mismatch");
        return; // Ignore signals for other calls
      }
      
      // Global guard: Only allow one instance to process signals per callId
      const existingProcessor = globalSignalProcessors.get(callId);
      if (existingProcessor && existingProcessor !== componentIdRef.current) {
        console.warn(`[GLOBAL SIGNAL GUARD] Another instance (${existingProcessor}) is already processing signals for callId ${callId}, ignoring in component ${componentIdRef.current}`);
        return;
      }
      
      // Register this instance as the signal processor
      if (!existingProcessor) {
        globalSignalProcessors.set(callId, componentIdRef.current);
        console.log(`[GLOBAL SIGNAL GUARD] Component ${componentIdRef.current} is now the signal processor for callId ${callId}`);
      }
      
      // Only process the first offer for incoming
      if (isIncoming && data.signal?.type === 'offer') {
        if (offerProcessedRef.current) {
          console.warn('[GUARD] Offer already processed for this callId, ignoring duplicate offer.');
          return;
        }
        // DON'T set offerProcessedRef.current = true here - only set it when actually processing
      }
      if (connectionRef.current) {
        // Signal existing connection
        console.log("📡 SIGNALING existing connection");
        connectionRef.current.signal(data.signal);
      } else if (streamRef.current && isIncoming) {
        // Create connection for incoming call
        console.log("📡 CREATING connection for incoming call");
        // Mark offer as processed since we're processing it immediately
        if (data.signal?.type === 'offer') {
          offerProcessedRef.current = true;
        }
        createPeerConnection(streamRef.current, false);
        // Signal after creation
        setTimeout(() => {
          if (connectionRef.current) {
            console.log("📡 SIGNALING after creation");
            connectionRef.current.signal(data.signal);
          } else {
            console.error("📡 ❌ No connection after creation!");
          }
        }, 100);
      } else if (!streamRef.current && isIncoming) {
        // Stream not ready yet - buffer the signal
        console.log("📡 🕐 BUFFERING signal - stream not ready yet");
        setPendingSignals(prev => [...prev, data]);
      } else {
        console.error("📡 ❌ Cannot handle signal - missing connection or stream");
        console.error("📡 Connection:", !!connectionRef.current, "Stream:", !!streamRef.current, "Incoming:", isIncoming);
      }
    };

    const handleCallEnded = (data) => {
      if (data.callId === callId) {
        console.log("Call ended by other user");
        setCallEnded(true);
        onClose();
      }
    };

    const handleCallAccepted = (data) => {
      if (data.callId === callId && !isIncoming) {
        console.log("🎉 CALL ACCEPTED! Starting peer connection for caller");
        // Now create the peer connection for the caller
        if (streamRef.current && !connectionRef.current) {
          createPeerConnection(streamRef.current, true);
        }
      }
    };

    socket.current.on("receiveSignal", handleReceiveSignal);
    socket.current.on("callEnded", handleCallEnded);
    socket.current.on("callAccepted", handleCallAccepted);

    return () => {
      if (socket.current) {
        socket.current.off("receiveSignal", handleReceiveSignal);
        socket.current.off("callEnded", handleCallEnded);
        socket.current.off("callAccepted", handleCallAccepted);
      }
    };
  }, [socket, callId, isIncoming, createPeerConnection, onClose]);

  // Reset guards on new call/modal open
  useEffect(() => {
    peerCreatedRef.current = false;
    offerProcessedRef.current = false;
    
    // Cleanup previous global connection for this callId if it exists and belongs to this component
    const existing = globalActiveConnections.get(callId);
    if (existing && existing.componentId === componentIdRef.current) {
      globalActiveConnections.delete(callId);
    }
    
    // Cleanup previous signal processor for this callId if it belongs to this component
    const existingProcessor = globalSignalProcessors.get(callId);
    if (existingProcessor === componentIdRef.current) {
      globalSignalProcessors.delete(callId);
    }
  }, [callId, isOpen]);

  // Ensure buffered signals are always processed as soon as stream is ready (for incoming calls)
  useEffect(() => {
    console.log("📡 [Effect] Checking buffered signals:", {
      isIncoming,
      streamReady: !!stream,
      pendingSignalsCount: pendingSignals.length,
      offerProcessed: offerProcessedRef.current
    });
    
    if (isIncoming && stream && pendingSignals.length > 0) {
      console.log("📡 🚀 [Effect] Processing", pendingSignals.length, "buffered signals after stream ready");
      // Only process the first offer
      const firstOffer = pendingSignals.find(sig => sig.signal?.type === 'offer');
      if (firstOffer && !offerProcessedRef.current) {
        console.log("📡 [Effect] Found first offer to process");
        offerProcessedRef.current = true;
        if (!connectionRef.current) {
          createPeerConnection(stream, false);
        }
        setTimeout(() => {
          if (connectionRef.current) {
            connectionRef.current.signal(firstOffer.signal);
            console.log("📡 [Effect] Buffered signal processed:", firstOffer.signal?.type);
          } else {
            console.error("📡 [Effect] No connection after creation!");
          }
        }, 100);
      } else {
        console.log("📡 [Effect] No valid offer found or already processed");
      }
      setPendingSignals([]); // Clear buffer
    }
  }, [isIncoming, stream, pendingSignals, createPeerConnection]);

  // Assign remote stream to video element after it's rendered
  useEffect(() => {
    if (remoteStream && callAccepted && userVideo.current) {
      console.log("Assigning remote stream to userVideo element (delayed)");
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, callAccepted]);

  // Control functions
  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const endCall = () => {
    console.log("Ending call");
    
    // Emit end call event
    if (socket?.current) {
      socket.current.emit("endCall", {
        callId: callId,
        from: currentUser._id,
        to: contact._id
      });
    }
    
    // Stop timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    // Clean up
    setCallEnded(true);
    
    // Call the onCallEnd callback
    if (onCallEnd) {
      onCallEnd(callTimer);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <CallContainer isFullscreen={isFullscreen}>
      <CallHeader>
        <ContactInfo>
          <ContactName>{contact?.username || 'Unknown'}</ContactName>
          <CallStatus>
            {!callAccepted ? (isIncoming ? "Connecting..." : "Calling...") : "Connected"}
          </CallStatus>
          {callAccepted && <CallTimer>{formatTime(callTimer)}</CallTimer>}
        </ContactInfo>
        <HeaderControls>
          <ControlBtn onClick={toggleFullscreen}>
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </ControlBtn>
        </HeaderControls>
      </CallHeader>

      <VideoArea>
        {/* Main video - remote user */}
        <MainVideo>
          {callAccepted ? (
            <RemoteVideo ref={userVideo} autoPlay playsInline />
          ) : (
            <VideoPlaceholder>
              <Avatar>{contact?.username?.charAt(0).toUpperCase()}</Avatar>
              <StatusText>{isIncoming ? "Connecting..." : "Calling..."}</StatusText>
            </VideoPlaceholder>
          )}
        </MainVideo>

        {/* Local video overlay */}
        {callType === 'video' && (
          <LocalVideoOverlay>
            <LocalVideo
              ref={myVideo}
              autoPlay
              muted
              playsInline
              style={{ display: isVideoOff ? 'none' : 'block' }}
            />
            {isVideoOff && <VideoOffText>Camera Off</VideoOffText>}
          </LocalVideoOverlay>
        )}

        {/* Audio only mode */}
        {callType === 'audio' && (
          <AudioMode>
            <Avatar large>{contact?.username?.charAt(0).toUpperCase()}</Avatar>
            <ContactName>{contact?.username}</ContactName>
          </AudioMode>
        )}
      </VideoArea>

      <CallControls>
        <ControlBtn onClick={toggleMute} active={isMuted}>
          {isMuted ? <FiMicOff /> : <FiMic />}
        </ControlBtn>
        
        {callType === 'video' && (
          <ControlBtn onClick={toggleVideo} active={isVideoOff}>
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </ControlBtn>
        )}
        
        <EndCallBtn onClick={endCall}>
          <FiPhoneOff />
        </EndCallBtn>
      </CallControls>
    </CallContainer>
  );
};

// Styled Components
const CallContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  color: white;
  
  ${props => !props.isFullscreen && `
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    height: 80vh;
    max-width: 1200px;
    max-height: 800px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  `}
`;

const CallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ContactName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const CallStatus = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const CallTimer = styled.p`
  margin: 5px 0 0 0;
  font-size: 1rem;
  color: #00d084;
  font-weight: 600;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
`;

const VideoArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const MainVideo = styled.div`
  width: 100%;
  height: 100%;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Avatar = styled.div`
  width: ${props => props.large ? '120px' : '80px'};
  height: ${props => props.large ? '120px' : '80px'};
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: ${props => props.large ? '3rem' : '2rem'};
  margin-bottom: 20px;
`;

const StatusText = styled.p`
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
`;

const LocalVideoOverlay = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    width: 150px;
    height: 112px;
  }
`;

const LocalVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoOffText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const AudioMode = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const CallControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
`;

const ControlBtn = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${props => props.active ? '#ff4757' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;

  &:hover {
    background: ${props => props.active ? '#ff3838' : 'rgba(255, 255, 255, 0.3)'};
    transform: scale(1.1);
  }
`;

const EndCallBtn = styled(ControlBtn)`
  background: #ff4757;
  
  &:hover {
    background: #ff3838;
  }
`;

export default VideoCallModal_New;
