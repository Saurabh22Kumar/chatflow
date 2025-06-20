import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import Peer from 'simple-peer';
import axios from 'axios';
import { FiPhone, FiPhoneOff, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMaximize2, FiMinimize2, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { saveCallRoute, updateCallStatusRoute } from '../utils/APIRoutes';

const VideoCallModal = ({ 
  isOpen, 
  onClose, 
  socket, 
  currentUser, 
  contact, 
  isIncoming = false, 
  incomingSignal = null,
  callType = 'video' // 'video' or 'audio'
}) => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callTimer, setCallTimer] = useState(0);
  const [callStarted, setCallStarted] = useState(false);
  
  // Call history tracking
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callStartTime, setCallStartTime] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const myAudio = useRef();
  const userAudio = useRef();
  const connectionRef = useRef();
  const callTimerRef = useRef();
  const mountedRef = useRef(true);
  const streamRef = useRef(null);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Save call to history
  const saveCallToHistory = async (status, duration = 0) => {
    if (!currentUser || !contact) return null;
    
    try {
      const callData = {
        callerId: currentUser._id,
        receiverId: contact._id,
        callType,
        status,
        duration,
        startedAt: callStartTime || new Date().toISOString(),
        endedAt: status === 'ended' || status === 'rejected' || status === 'missed' ? new Date().toISOString() : null,
      };

      const response = await axios.post(saveCallRoute, callData);
      if (response.data.status) {
        console.log('Call saved to history:', response.data.call);
        return response.data.call._id;
      }
    } catch (error) {
      console.error('Error saving call to history:', error);
    }
    return null;
  };

  // Update call status in history
  const updateCallInHistory = async (callId, status, duration = 0) => {
    if (!callId) return;
    
    try {
      const updateData = {
        status,
        duration,
        endedAt: new Date().toISOString(),
      };

      await axios.put(`${updateCallStatusRoute}/${callId}`, updateData);
      console.log('Call history updated:', { callId, status, duration });
    } catch (error) {
      console.error('Error updating call history:', error);
    }
  };

  // Get user media on component mount
  useEffect(() => {
    if (!isOpen || !mountedRef.current) return;
    
    const constraints = {
      video: callType === 'video',
      audio: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((currentStream) => {
        if (!mountedRef.current) return;
        
        console.log("Got local stream:", currentStream);
        setStream(currentStream);
        streamRef.current = currentStream;
        
        const videoElement = callType === 'audio' ? myAudio.current : myVideo.current;
        if (videoElement) {
          videoElement.srcObject = currentStream;
          videoElement.play().catch(error => {
            console.error("Error playing local stream:", error);
          });
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    return () => {
      // Cleanup on unmount
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
  }, [isOpen, callType]);

  // Handle incoming call setup
  useEffect(() => {
    if (isIncoming && incomingSignal && streamRef.current) {
      setReceivingCall(true);
      setCaller(contact._id);
      setName(contact.username);
      setCallerSignal(incomingSignal);
    }
  }, [isIncoming, incomingSignal, contact, stream]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !socket.current) return;

    const socketInstance = socket.current;

    const handleCallEnded = () => {
      console.log("Received callEnded event from backend");
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      // Update call history when call ends
      if (currentCallId) {
        updateCallInHistory(currentCallId, 'ended', callTimer);
      }
      onClose();
    };

    const handleCallRejected = () => {
      console.log("Call was rejected");
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
      // Update call history when call is rejected
      if (currentCallId) {
        updateCallInHistory(currentCallId, 'rejected', 0);
      }
      onClose();
    };

    socketInstance.on("callEnded", handleCallEnded);
    socketInstance.on("callRejected", handleCallRejected);

    return () => {
      socketInstance.off("callEnded", handleCallEnded);
      socketInstance.off("callRejected", handleCallRejected);
    };
  }, [socket, onClose, currentCallId, callTimer]);

  const callUser = useCallback((id) => {
    const currentStream = streamRef.current;
    console.log("callUser function called with id:", id, "stream:", !!currentStream, "socket:", !!socket?.current);
    if (!currentStream || !socket?.current) {
      console.log("Cannot call user - missing requirements");
      return;
    }

    // Save call to history when initiating
    const startTime = new Date().toISOString();
    setCallStartTime(startTime);
    saveCallToHistory('outgoing', 0).then(callId => {
      if (callId) {
        setCurrentCallId(callId);
      }
    });

    // Clean up any existing connection first
    if (connectionRef.current) {
      console.log("Cleaning up existing connection before creating new one");
      try {
        connectionRef.current.destroy();
      } catch (error) {
        console.error("Error destroying existing connection:", error);
      }
      connectionRef.current = null;
    }

    console.log("Creating peer and emitting callUser event");
    
    const peer = new Peer({
      initiator: true,
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
      console.log("Peer signal generated, emitting callUser to backend");
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: currentUser._id,
        name: currentUser.username,
        callType: callType
      });
    });

    peer.on("stream", (currentStream) => {
      console.log("Received remote stream:", currentStream);
      
      const videoElement = callType === 'audio' ? userAudio.current : userVideo.current;
      if (videoElement) {
        videoElement.srcObject = currentStream;
        videoElement.play().catch(error => {
          console.error("Error playing remote stream:", error);
        });
      }
    });

    peer.on("connect", () => {
      console.log("Peer connection established successfully");
    });

    peer.on("error", (error) => {
      console.error("Peer connection error:", error);
    });

    const handleCallAccepted = (signal) => {
      console.log("Call accepted, signaling peer");
      try {
        if (peer && !peer.destroyed) {
          setCallAccepted(true);
          peer.signal(signal);
          // Update call status to answered
          if (currentCallId) {
            updateCallInHistory(currentCallId, 'answered', 0);
          }
        }
      } catch (error) {
        console.error("Error handling call accepted:", error);
      }
    };

    socket.current.on("callAccepted", handleCallAccepted);
    connectionRef.current = peer;

    return () => {
      if (socket.current) {
        socket.current.off("callAccepted", handleCallAccepted);
      }
    };
  }, [socket, currentUser, callType, currentCallId]);

  const answerCall = useCallback(() => {
    const currentStream = streamRef.current;
    console.log("Answering call with stream:", !!currentStream);
    
    if (!currentStream || !socket?.current) {
      console.log("Cannot answer call - missing requirements");
      return;
    }

    // Save incoming call to history
    const startTime = new Date().toISOString();
    setCallStartTime(startTime);
    saveCallToHistory('answered', 0).then(callId => {
      if (callId) {
        setCurrentCallId(callId);
      }
    });

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
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
      console.log("Answering call, sending signal back");
      socket.current.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (currentStream) => {
      console.log("Received remote stream in answer:", currentStream);
      
      const videoElement = callType === 'audio' ? userAudio.current : userVideo.current;
      if (videoElement) {
        videoElement.srcObject = currentStream;
        videoElement.play().catch(error => {
          console.error("Error playing remote stream in answer:", error);
        });
      }
    });

    try {
      if (callerSignal && !peer.destroyed) {
        peer.signal(callerSignal);
      }
    } catch (error) {
      console.error("Error signaling in answerCall:", error);
    }

    connectionRef.current = peer;
  }, [socket, caller, callerSignal, callType]);

  const leaveCall = useCallback(() => {
    console.log("Leaving call, cleaning up connections");
    setCallEnded(true);
    
    // Calculate call duration
    const duration = callTimer;
    
    // Update call history
    if (currentCallId) {
      updateCallInHistory(currentCallId, 'ended', duration);
    }
    
    // Stop call timer directly
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallTimer(0);
    
    // Clean up peer connection
    if (connectionRef.current) {
      try {
        connectionRef.current.destroy();
      } catch (error) {
        console.error("Error destroying peer connection:", error);
      }
      connectionRef.current = null;
    }

    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (error) {
          console.error("Error stopping track:", error);
        }
      });
      streamRef.current = null;
    }

    // Reset states
    setCallAccepted(false);
    setReceivingCall(false);
    setCaller("");
    setCallerSignal(null);
    setName("");
    setCurrentCallId(null);
    setCallStartTime(null);

    // Emit call ended event
    if (socket?.current) {
      socket.current.emit("endCall", { to: contact._id });
    }

    onClose();
  }, [socket, contact, onClose, callTimer, currentCallId]);

  const rejectCall = useCallback(() => {
    console.log("Rejecting call");
    
    // Save missed/rejected call to history
    saveCallToHistory('rejected', 0);
    
    if (socket?.current && caller) {
      socket.current.emit("rejectCall", { to: caller });
    }
    
    setCallEnded(true);
    onClose();
  }, [socket, caller, onClose]);

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

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Call timer functions
  const startCallTimer = useCallback(() => {
    setCallTimer(0);
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1);
    }, 1000);
  }, []);

  // Format timer display
  const formatCallTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto-call when opening for outgoing calls
  useEffect(() => {
    if (isOpen && !isIncoming && contact && streamRef.current && !callAccepted && !connectionRef.current) {
      console.log("Triggering auto-call to:", contact._id);
      const timeoutId = setTimeout(() => {
        callUser(contact._id);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isIncoming, contact, stream, callAccepted, callUser]);

  // Start timer when call is accepted
  useEffect(() => {
    if (callAccepted && !callEnded) {
      console.log("Call accepted - starting timer");
      startCallTimer();
    }
    
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callAccepted, callEnded, startCallTimer]);

  if (!isOpen) return null;

  return (
    <VideoCallContainer isFullscreen={isFullscreen}>
      <VideoCallHeader>
        <CallInfo>
          <ContactName>{contact?.username || name}</ContactName>
          <CallStatus>
            {!callAccepted && !receivingCall ? "Calling..." : 
             receivingCall && !callAccepted ? "Incoming call..." : 
             "Connected"}
          </CallStatus>
          {callAccepted && !callEnded && (
            <CallTimer>{formatCallTime(callTimer)}</CallTimer>
          )}
        </CallInfo>
        <HeaderControls>
          <ControlButton onClick={toggleFullscreen}>
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </ControlButton>
        </HeaderControls>
      </VideoCallHeader>

      <VideoContainer>
        {/* Local video/audio element */}
        <MyVideoContainer style={{ display: callType === 'audio' ? 'none' : 'block' }}>
          <MyVideo
            playsInline
            muted
            ref={myVideo}
            autoPlay
            style={{ display: isVideoOff || callType === 'audio' ? 'none' : 'block' }}
          />
          {(isVideoOff || callType === 'audio') && callType === 'video' && <VideoOffPlaceholder>Camera Off</VideoOffPlaceholder>}
        </MyVideoContainer>

        {/* Remote video/audio element */}
        {callAccepted && !callEnded && (
          <UserVideoContainer style={{ display: callType === 'audio' ? 'none' : 'block' }}>
            <UserVideo
              playsInline
              ref={userVideo}
              autoPlay
              controls={false}
            />
          </UserVideoContainer>
        )}

        {/* Hidden audio elements for audio-only calls */}
        {callType === 'audio' && (
          <>
            <audio ref={myAudio} autoPlay muted playsInline style={{ display: 'none' }} />
            {callAccepted && !callEnded && (
              <audio ref={userAudio} autoPlay playsInline style={{ display: 'none' }} />
            )}
          </>
        )}

        {callType === 'audio' && (
          <AudioCallContainer>
            <ContactAvatar>
              {contact?.username?.charAt(0).toUpperCase() || name?.charAt(0).toUpperCase()}
            </ContactAvatar>
            <ContactName>{contact?.username || name}</ContactName>
          </AudioCallContainer>
        )}

        {receivingCall && !callAccepted && (
          <IncomingCallOverlay>
            <IncomingCallInfo>
              <ContactName>{name} is calling...</ContactName>
              <CallType>{callType === 'video' ? 'Video Call' : 'Voice Call'}</CallType>
            </IncomingCallInfo>
            <IncomingCallButtons>
              <AcceptButton onClick={answerCall}>
                <FiPhone />
              </AcceptButton>
              <DeclineButton onClick={rejectCall}>
                <FiPhoneOff />
              </DeclineButton>
            </IncomingCallButtons>
          </IncomingCallOverlay>
        )}
      </VideoContainer>

      <CallControls>
        <ControlButton onClick={toggleMute} isActive={isMuted}>
          {isMuted ? <FiMicOff /> : <FiMic />}
        </ControlButton>
        
        {callType === 'video' && (
          <ControlButton onClick={toggleVideo} isActive={isVideoOff}>
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </ControlButton>
        )}
        
        <ControlButton onClick={toggleSpeaker} isActive={isSpeakerOn} title={isSpeakerOn ? "Turn off speaker" : "Turn on speaker"}>
          {isSpeakerOn ? <FiVolume2 /> : <FiVolumeX />}
        </ControlButton>
        
        <EndCallButton onClick={leaveCall}>
          <FiPhoneOff />
        </EndCallButton>
      </CallControls>
    </VideoCallContainer>
  );
};

// Styled Components (same as before but keeping it clean)
const VideoCallContainer = styled.div`
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

const VideoCallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`;

const CallInfo = styled.div`
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
  font-family: 'Courier New', monospace;
`;

const CallType = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
`;

const VideoContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const MyVideoContainer = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  background: #333;
  z-index: 2;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const MyVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const UserVideoContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
`;

const UserVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoOffPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const AudioCallContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ContactAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 20px;
`;

const IncomingCallOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const IncomingCallInfo = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const IncomingCallButtons = styled.div`
  display: flex;
  gap: 40px;
`;

const CallControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`;

const ControlButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isActive ? '#ff4757' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;

  &:hover {
    background: ${props => props.isActive ? '#ff3838' : 'rgba(255, 255, 255, 0.3)'};
    transform: scale(1.1);
  }
`;

const AcceptButton = styled(ControlButton)`
  width: 60px;
  height: 60px;
  background: #00d084;
  font-size: 1.5rem;

  &:hover {
    background: #00b771;
  }
`;

const DeclineButton = styled(ControlButton)`
  width: 60px;
  height: 60px;
  background: #ff4757;
  font-size: 1.5rem;

  &:hover {
    background: #ff3838;
  }
`;

const EndCallButton = styled(ControlButton)`
  background: #ff4757;
  
  &:hover {
    background: #ff3838;
  }
`;

export default VideoCallModal;
