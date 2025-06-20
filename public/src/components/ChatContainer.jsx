import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import ChatInput from "./ChatInput";
import MessageStatus from "./MessageStatus";
import VideoCallModal from "./VideoCallModal_New";
import MessageDeleteDialog from "./MessageDeleteDialog";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, updateMessageReadRoute, logoutRoute, blockUserRoute, unfriendUserRoute, deleteMessageForMeRoute, deleteMessageForEveryoneRoute, deleteCallHistoryForMeRoute, deleteCallHistoryForEveryoneRoute } from "../utils/APIRoutes";
import { useTheme } from '../contexts/ThemeContext';
import { FiMoreVertical, FiLogOut, FiMoon, FiSun, FiSettings, FiUserX, FiSlash, FiPhone, FiVideo, FiTrash2, FiX } from "react-icons/fi";

export default function ChatContainer({ 
  currentChat, 
  socket, 
  onBack, 
  isMobile = false, 
  onlineUsers = new Set(), 
  currentUser, 
  onOpenSettings,
  activeCallData = null,
  onInitiateCall = null,
  onEndCall = null,
  onMessagesRead = null
}) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFriendshipModal, setShowFriendshipModal] = useState(false);
  const [friendshipAction, setFriendshipAction] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [callType, setCallType] = useState('video'); // 'video' or 'audio'
  const isMountedRef = useRef(true);
  
  // Message deletion states
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectedCallHistory, setSelectedCallHistory] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [undoTimeout, setUndoTimeout] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoAction, setUndoAction] = useState(null);
  
  // Add deduplication for call history messages
  const processedCallEventsRef = useRef(new Set());
  
  // Guard against duplicate video call modals
  const activeCallIdRef = useRef(null);
  
  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Handle active call data - start video call when call is accepted
  useEffect(() => {
    if (activeCallData && currentChat && activeCallData.contact?._id === currentChat._id) {
      // Only show video call if it's a new callId or no call is currently active
      if (!activeCallIdRef.current || activeCallIdRef.current !== activeCallData.callId) {
        console.log("Starting video call for active call:", activeCallData);
        activeCallIdRef.current = activeCallData.callId;
        setCallType(activeCallData.callType || 'video');
        setShowVideoCall(true);
      } else {
        console.log("Video call modal already active for callId:", activeCallData.callId);
      }
    }
  }, [activeCallData, currentChat]);
  
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Get current user data (fallback if not passed as prop)
  const userData = currentUser || JSON.parse(
    localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
  );

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (from, to) => {
    try {
      await axios.post(updateMessageReadRoute, {
        from: from,
        to: to,
      });
      
      // Emit read status to socket
      if (socket.current) {
        socket.current.emit("messages-read", {
          from: from,
          to: to,
        });
      }
      
      // Notify parent to update unread counts
      if (onMessagesRead) {
        onMessagesRead(to);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [socket, onMessagesRead]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isMountedRef.current) return;
      
      const data = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
      
      if (!isMountedRef.current) return;
      setMessages(response.data);
      
      // Mark messages as read when chat is opened
      await markMessagesAsRead(currentChat._id, data._id);
    };
    
    if (currentChat) {
      fetchMessages();
    }
  }, [currentChat, markMessagesAsRead]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to render message content based on type
  const renderMessageContent = (message) => {
    switch (message.messageType || 'text') {
      case 'image':
        return (
          <div className="image-message">
            <img 
              src={message.fileUrl} 
              alt={message.fileName || 'Shared image'} 
              className="message-image"
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
            <div className="file-info">
              <span className="file-name">{message.fileName}</span>
              {message.fileSize && (
                <span className="file-size">{formatFileSize(message.fileSize)}</span>
              )}
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="file-message">
            <div className="file-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="file-details">
              <span className="file-name">{message.fileName}</span>
              {message.fileSize && (
                <span className="file-size">{formatFileSize(message.fileSize)}</span>
              )}
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="download-link"
              >
                Download
              </a>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="voice-message">
            <div className="voice-player">
              <div className="voice-icon">
                🎵
              </div>
              <audio 
                controls 
                className="audio-control"
                preload="metadata"
              >
                <source src={message.fileUrl} type="audio/webm" />
                <source src={message.fileUrl} type="audio/wav" />
                <source src={message.fileUrl} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
              {message.duration && (
                <span className="voice-duration">{message.duration}s</span>
              )}
            </div>
            {message.fileSize && (
              <div className="voice-info">
                <span className="file-size">{formatFileSize(message.fileSize)}</span>
              </div>
            )}
          </div>
        );
      case 'call':
        return (
          <div className="call-message">
            <div className="call-icon">
              {message.callType === 'video' ? '📹' : '📞'}
            </div>
            <div className="call-details">
              <span className="call-text">{message.message}</span>
              {message.callStatus === 'completed' && message.callDuration && (
                <span className="call-duration">
                  Duration: {Math.floor(message.callDuration / 60)}m {message.callDuration % 60}s
                </span>
              )}
            </div>
          </div>
        );
      case 'call-system':
        return (
          <div className="call-system-message">
            <div className="call-system-content">
              {message.message.split('\n').map((line, index) => (
                <div key={index} className={index === 0 ? 'caller-name' : 'call-details'}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <p>{message.message}</p>;
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      const userData = currentUser || JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      
      if (userData?._id) {
        await axios.get(`${logoutRoute}/${userData._id}`);
      }
      
      // Emit logout event to socket before disconnecting
      if (socket.current && userData) {
        socket.current.emit("user-logout", userData._id);
        socket.current.disconnect();
      }
      
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      if (socket.current) {
        socket.current.disconnect();
      }
      localStorage.clear();
      navigate("/login");
    }
  };

  // Theme toggle handler
  const handleThemeToggle = () => {
    toggleTheme();
    setShowDropdown(false); // Close dropdown after action
  };

  // Dropdown toggle handler
  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  // Friendship management handlers
  const handleManageFriendship = () => {
    setShowFriendshipModal(true);
    setShowDropdown(false);
  };

  const handleUnfriend = async () => {
    if (!window.confirm(`Are you sure you want to unfriend ${currentChat.username}? This will delete all chat history permanently!`)) {
      return;
    }

    if (!isMountedRef.current) return;
    setFriendshipAction('unfriend');
    
    try {
      const response = await axios.post(unfriendUserRoute, {
        userId: userData._id,
        friendId: currentChat._id
      });
      
      if (!isMountedRef.current) return;
      
      if (response.data.status) {
        // Clear messages immediately
        setMessages([]);
        setShowFriendshipModal(false);
        alert(`You have unfriended ${currentChat.username}. All chat history has been deleted.`);
        
        // Navigate back to main chat list
        if (onBack) {
          onBack();
        }
      } else {
        alert(response.data.msg || "Failed to unfriend user. Please try again.");
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error unfriending user:", error);
      alert("Error unfriending user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setFriendshipAction(null);
      }
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Are you sure you want to block ${currentChat.username}? This will delete all chat history permanently!`)) {
      return;
    }

    if (!isMountedRef.current) return;
    setFriendshipAction('block');
    
    try {
      const response = await axios.post(blockUserRoute, {
        userId: userData._id,
        targetUserId: currentChat._id
      });
      
      if (!isMountedRef.current) return;
      
      if (response.data.status) {
        // Clear messages immediately
        setMessages([]);
        setShowFriendshipModal(false);
        alert(`You have blocked ${currentChat.username}. All chat history has been deleted.`);
        
        // Navigate back to main chat list
        if (onBack) {
          onBack();
        }
      } else {
        alert(response.data.msg || "Failed to block user. Please try again.");
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error blocking user:", error);
      alert("Error blocking user. Please try again.");
    } finally {
      if (isMountedRef.current) {
        setFriendshipAction(null);
      }
    }
  };

  // Clean Call Handlers - Rewritten from scratch
  const handleVideoCall = () => {
    if (!currentChat || !onInitiateCall) return;
    console.log("Initiating video call to:", currentChat.username);
    onInitiateCall(currentChat._id, 'video');
  };

  const handleAudioCall = () => {
    if (!currentChat || !onInitiateCall) return;
    console.log("Initiating audio call to:", currentChat.username);
    onInitiateCall(currentChat._id, 'audio');
  };

  const handleEndVideoCall = () => {
    if (!activeCallData || !onEndCall) return;
    console.log("Ending call:", activeCallData.callId);
    
    // Emit end call to server
    if (socket.current) {
      socket.current.emit("endCall", {
        callId: activeCallData.callId,
        from: userData._id,
        to: activeCallData.contact._id
      });
    }
    
    // Close video call modal
    setShowVideoCall(false);
    
    // Clear active call ID ref
    activeCallIdRef.current = null;
    
    // Clear active call data
    onEndCall();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSendMsg = async (msg, fileData = null) => {
    if (!isMountedRef.current) return;
    
    const data = userData || JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    
    // Create temporary message with sending status
    const tempMessageId = uuidv4();
    const tempMessage = {
      _id: tempMessageId,
      fromSelf: true,
      message: msg,
      messageType: fileData?.messageType || 'text',
      fileUrl: fileData?.fileUrl,
      fileName: fileData?.fileName,
      fileSize: fileData?.fileSize,
      status: "sending",
      createdAt: new Date().toISOString(),
    };
    
    // Add temporary message to state
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      let realMessageId;
      
      if (fileData && fileData.messageId) {
        // File was already uploaded, use the existing message ID
        realMessageId = fileData.messageId;
        
        if (!isMountedRef.current) return;
        
        // Update message with real ID and sent status
        setMessages(prev => 
          prev.map(message => 
            message._id === tempMessageId 
              ? { 
                  ...message, 
                  _id: realMessageId,
                  status: "sent"
                }
              : message
          )
        );
      } else {
        // Regular text message - send to backend
        const response = await axios.post(sendMessageRoute, {
          from: data._id,
          to: currentChat._id,
          message: msg,
        });
        
        if (!isMountedRef.current) return;
        
        // Update message with real ID and sent status
        realMessageId = response.data.messageId;
        setMessages(prev => 
          prev.map(message => 
            message._id === tempMessageId 
              ? { 
                  ...message, 
                  _id: realMessageId,
                  status: "sent"
                }
              : message
          )
        );
      }
      
      // Emit message via socket with real message ID
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: data._id,
        msg,
        messageId: realMessageId,
        messageType: fileData?.messageType || 'text',
        fileUrl: fileData?.fileUrl,
        fileName: fileData?.fileName,
        fileSize: fileData?.fileSize,
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      
      if (!isMountedRef.current) return;
      
      // Update message status to failed
      setMessages(prev => 
        prev.map(message => 
          message._id === tempMessageId 
            ? { ...message, status: "failed" }
            : message
        )
      );
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (data) => {
        if (!isMountedRef.current) return;
        
        // Handle call system messages specially
        const isCallSystemMessage = data.messageType === 'call-system' || data.msg?.type === 'call-system';
        
        if (isCallSystemMessage) {
          console.log('Received call system message:', {
            data,
            messageType: data.msg?.type || data.messageType,
            callStatus: data.msg?.callStatus,
            callerName: data.msg?.callerName,
            callEventType: data.callEventType
          });
          
          // For call system messages, directly save to local state (like rejected calls)
          if (data.callEventType && data.callEventData) {
            const localCallMessage = {
              _id: data.messageId || uuidv4(),
              fromSelf: false,
              message: data.callEventData.messageText,
              messageType: 'call-system',
              callType: data.callEventData.callType,
              callDuration: data.callEventData.duration,
              callStatus: data.callEventData.status,
              callerName: data.callEventData.callerName,
              isSystemMessage: true,
              status: "delivered",
              createdAt: new Date().toISOString()
            };
            
            console.log('Adding call message directly to local state:', localCallMessage);
            setMessages(prev => [...prev, localCallMessage]);
            return; // Don't process as regular arrival message
          }
        }
        
        setArrivalMessage({ 
          fromSelf: false, 
          message: data.msg?.text || data.msg || data,
          messageType: data.msg?.type || data.messageType || 'text',
          fileUrl: data.msg?.fileUrl || data.fileUrl,
          fileName: data.msg?.fileName || data.fileName,
          fileSize: data.msg?.fileSize || data.fileSize,
          callType: data.msg?.callType || data.callType,
          callDuration: data.msg?.callDuration || data.callDuration,
          callStatus: data.msg?.callStatus || data.callStatus,
          callerName: data.msg?.callerName || data.callerName,
          isSystemMessage: isCallSystemMessage,
          status: "delivered",
          _id: data.messageId || uuidv4(),
          createdAt: new Date().toISOString()
        });
      });
      
      // Listen for message delivery confirmation
      socket.current.on("message-delivered", ({ messageId }) => {
        if (!isMountedRef.current) return;
        console.log("Message delivered:", messageId);
        setMessages(prev => 
          prev.map(message => 
            message._id === messageId && message.status === "sent"
              ? { ...message, status: "delivered" }
              : message
          )
        );
      });
      
      // Listen for message read confirmation
      socket.current.on("message-read", ({ from, to }) => {
        if (!isMountedRef.current) return;
        console.log("Messages read from:", from, "to:", to);
        // Update all sent/delivered messages to read
        if (currentUser && from === currentChat._id && to === currentUser._id) {
          setMessages(prev => 
            prev.map(message => 
              message.fromSelf && ["sent", "delivered"].includes(message.status)
                ? { ...message, status: "read" }
                : message
            )
          );
        }
      });

      // Listen for chat deletion (when user is blocked/unfriended)
      socket.current.on("chat-deleted", ({ targetUserId, reason }) => {
        if (!isMountedRef.current) return;
        console.log("Chat deleted with user:", targetUserId, "reason:", reason);
        if (currentChat._id === targetUserId) {
          // Clear messages immediately
          setMessages([]);
          
          // Show appropriate message based on reason
          const message = reason === "blocked" 
            ? "This chat has been deleted because you were blocked by the user."
            : "This chat has been deleted because you were unfriended.";
          
          alert(message);
          
          // Navigate back to main chat list
          if (onBack) {
            onBack();
          }
        }
      });

      // Listen for messages deleted for everyone
      socket.current.on("messages-deleted-for-everyone", ({ messageIds }) => {
        if (!isMountedRef.current) return;
        console.log("Messages deleted for everyone:", messageIds);
        
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg._id) 
            ? { ...msg, deletedForEveryone: true, message: "🚫 This message was deleted" }
            : msg
        ));
      });

      // Listen for message restoration (undo delete for everyone)
      socket.current.on("messages-restored", ({ messages: restoredMessages }) => {
        if (!isMountedRef.current) return;
        console.log("Messages restored:", restoredMessages);
        
        setMessages(prev => prev.map(msg => {
          const restoredMsg = restoredMessages.find(restored => restored._id === msg._id);
          return restoredMsg ? restoredMsg : msg;
        }));
      });

      // Listen for call history deleted for everyone
      socket.current.on("call-history-deleted-for-everyone", ({ callHistoryIds }) => {
        if (!isMountedRef.current) return;
        console.log("Call history deleted for everyone:", callHistoryIds);
        
        setMessages(prev => prev.map(msg => 
          (msg.messageType === 'call-system' && callHistoryIds.includes(msg._id))
            ? { ...msg, deletedForEveryone: true, message: "🚫 This call record was deleted" }
            : msg
        ));
      });

      // Video Call Events - handle call state changes only
      socket.current.on("callRejected", () => {
        if (!isMountedRef.current) return;
        console.log("Call was rejected");
        setShowVideoCall(false);
        activeCallIdRef.current = null;
      });

      socket.current.on("callEnded", async (data) => {
        if (!isMountedRef.current) return;
        console.log("Call ended - received from socket", data);
        setShowVideoCall(false);
        activeCallIdRef.current = null;
        // DO NOT save message here - only UI updates (like callRejected)
      });
      
      // Add handlers for other call events  
      socket.current.on("callMissed", async (data) => {
        if (!isMountedRef.current) return;
        console.log("Call missed - received from socket", data);
        // DO NOT save message here - only UI updates (like callRejected)
      });
      
      socket.current.on("callCancelled", async (data) => {
        if (!isMountedRef.current) return;
        console.log("Call cancelled - received from socket", data);
        // DO NOT save message here - only UI updates (like callRejected)
      });
    }
    
    return () => {
      const socketRef = socket.current;
      if (socketRef) {
        socketRef.off("msg-recieve");
        socketRef.off("message-delivered");
        socketRef.off("message-read");
        socketRef.off("chat-deleted");
        socketRef.off("messages-deleted-for-everyone");
        socketRef.off("messages-restored");
        socketRef.off("call-history-deleted-for-everyone");
        socketRef.off("callUser");
        socketRef.off("callRejected");
        socketRef.off("callEnded");
        socketRef.off("callMissed");
        socketRef.off("callCancelled");
      }
    };
  }, [currentUser, currentChat, socket]);

  useEffect(() => {
    if (arrivalMessage && isMountedRef.current) {
      setMessages((prev) => [...prev, arrivalMessage]);
      
      // Emit delivery confirmation for received message
      if (socket.current && arrivalMessage._id) {
        socket.current.emit("message-delivered", {
          to: currentUser?._id,
          messageId: arrivalMessage._id,
        });
      }
    }
  }, [arrivalMessage, currentUser, socket]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Shared function to save call history messages (replicates rejected call logic)
  const saveCallHistoryMessage = async (status, duration = 0) => {
    try {
      const userData = currentUser || JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      
      // Create unique key for deduplication
      const callEventKey = `${status}-${Date.now()}-${currentChat?._id || 'unknown'}`;
      
      // Initialize the ref if it's somehow undefined (fallback safety)
      if (!processedCallEventsRef.current) {
        processedCallEventsRef.current = new Set();
      }
      
      // Check if we've already processed this type of call event recently
      if (processedCallEventsRef.current.has(callEventKey)) {
        console.log(`Duplicate ${status} call event detected, skipping`);
        return;
      }
      
      // Add to processed events (with cleanup after 5 seconds)
      processedCallEventsRef.current.add(callEventKey);
      setTimeout(() => {
        if (processedCallEventsRef.current) {
          processedCallEventsRef.current.delete(callEventKey);
        }
      }, 5000);
      
      // CRITICAL: Determine who should save the message based on call event type
      let shouldSaveMessage = false;
      let callerInfo;
      
      if (status === 'rejected') {
        // For rejected calls: only save if we have an active call data
        if (activeCallData) {
          shouldSaveMessage = true;
          callerInfo = {
            from: activeCallData.contact._id,
            callerName: activeCallData.contact.username || 'Unknown caller',
            callType: activeCallData.callType || 'audio'
          };
        }
      } else {
        // For other call events: save if we have currentChat (active conversation)
        if (currentChat) {
          shouldSaveMessage = true;
          callerInfo = {
            from: currentChat._id,
            callerName: currentChat.username || 'Unknown caller',
            callType: callType || 'audio'
          };
        }
      }
      
      if (!shouldSaveMessage || !callerInfo) {
        console.log(`Not saving ${status} call message - missing required data`);
        return;
      }
      
      if (userData && callerInfo) {
        const callIcon = callerInfo.callType === 'video' ? '📹' : '📞';
        const callTypeText = callerInfo.callType === 'video' ? 'Video' : 'Audio';
        
        let statusText;
        switch (status) {
          case 'ended':
            const formatDuration = (seconds) => {
              if (seconds < 60) return `${seconds}s`;
              const minutes = Math.floor(seconds / 60);
              const remainingSeconds = seconds % 60;
              return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
            };
            statusText = formatDuration(duration);
            break;
          case 'missed':
            statusText = 'No answer';
            break;
          case 'cancelled':
            statusText = 'Cancelled';
            break;
          case 'rejected':
            statusText = 'Declined';
            break;
          default:
            statusText = '';
        }
        
        const callMessageText = `${callerInfo.callerName} called\n${callIcon} ${callTypeText} call${statusText ? ' - ' + statusText : ''}`;
        
        // Create system message (same structure as rejected calls)
        const callMessageData = {
          from: callerInfo.from,
          to: userData._id,
          message: {
            text: callMessageText,
            type: 'call-system',
            callType: callerInfo.callType,
            callDuration: duration,
            callStatus: status,
            callerName: callerInfo.callerName,
            isSystemMessage: true
          }
        };
        
        console.log(`Saving ${status} call message from ChatContainer:`, callMessageData);
        
        // Save the call message (same as rejected calls)
        const response = await axios.post(sendMessageRoute, callMessageData);
        
        if (response.data.status && isMountedRef.current) {
          // Add message to local state immediately (same as rejected calls)
          const localMessage = {
            _id: response.data.messageId,
            fromSelf: false, // System message, not from self
            message: callMessageText,
            messageType: 'call-system',
            callType: callerInfo.callType,
            callDuration: duration,
            callStatus: status,
            callerName: callerInfo.callerName,
            isSystemMessage: true,
            status: "sent",
            createdAt: new Date().toISOString()
          };
          setMessages(prev => [...prev, localMessage]);
          
          // Emit the call message via socket (same as rejected calls)
          if (socket.current) {
            socket.current.emit("send-msg", {
              to: callerInfo.from === userData._id ? currentChat._id : callerInfo.from,
              from: userData._id,
              msg: callMessageData.message,
              messageId: response.data.messageId,
              messageType: 'call-system',
              isCallMessage: true,
              callEventType: status,
              callEventData: {
                callerName: callerInfo.callerName,
                callType: callerInfo.callType,
                duration: duration,
                status: status,
                messageText: callMessageText
              }
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error saving ${status} call message:`, error);
    }
  };

  // Call handling functions - Updated for clean call system
  const startVideoCall = () => {
    handleVideoCall();
  };

  const startAudioCall = () => {
    handleAudioCall();
  };

  // Message deletion functions
  const handleMessageLongPress = useCallback((messageId, isCallHistory = false) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      if (isCallHistory) {
        setSelectedCallHistory(new Set([messageId]));
      } else {
        setSelectedMessages(new Set([messageId]));
      }
    }
  }, [isSelectionMode]);

  const handleMessageSelect = useCallback((messageId, isCallHistory = false) => {
    if (!isSelectionMode) return;
    
    if (isCallHistory) {
      setSelectedCallHistory(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(messageId)) {
          newSelected.delete(messageId);
        } else {
          newSelected.add(messageId);
        }
        
        // Exit selection mode if no items selected
        if (newSelected.size === 0 && selectedMessages.size === 0) {
          setIsSelectionMode(false);
        }
        
        return newSelected;
      });
    } else {
      setSelectedMessages(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(messageId)) {
          newSelected.delete(messageId);
        } else {
          newSelected.add(messageId);
        }
        
        // Exit selection mode if no items selected
        if (newSelected.size === 0 && selectedCallHistory.size === 0) {
          setIsSelectionMode(false);
        }
        
        return newSelected;
      });
    }
  }, [isSelectionMode, selectedMessages.size, selectedCallHistory.size]);

  const clearSelection = useCallback(() => {
    setSelectedMessages(new Set());
    setSelectedCallHistory(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleDeleteMessages = useCallback(() => {
    if (selectedMessages.size === 0 && selectedCallHistory.size === 0) return;
    setShowDeleteDialog(true);
  }, [selectedMessages, selectedCallHistory]);

  const showUndoToastMessage = useCallback((message) => {
    setShowUndoToast(true);
    
    // Clear any existing timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
    }
    
    // Set new timeout for 5 seconds
    const timeout = setTimeout(() => {
      setShowUndoToast(false);
      setUndoAction(null);
    }, 5000);
    
    setUndoTimeout(timeout);
  }, [undoTimeout]);

  const executeDeleteForMe = useCallback(async (messageIds) => {
    try {
      const response = await axios.post(deleteMessageForMeRoute, {
        messageIds: Array.from(messageIds),
        userId: userData._id
      });

      if (response.data.success) {
        // Remove messages from local state
        setMessages(prev => prev.filter(msg => !messageIds.has(msg._id)));
        
        // Setup undo functionality
        const deletedMessages = messages.filter(msg => messageIds.has(msg._id));
        setUndoAction({
          type: 'deleteForMe',
          messages: deletedMessages,
          messageIds
        });
        
        showUndoToastMessage("Messages deleted for you");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting messages for me:", error);
      return false;
    }
  }, [messages, userData._id, showUndoToastMessage]);

  const executeDeleteForEveryone = useCallback(async (messageIds) => {
    try {
      const response = await axios.post(deleteMessageForEveryoneRoute, {
        messageIds: Array.from(messageIds),
        userId: userData._id
      });

      if (response.data.success) {
        // Update messages to show deleted placeholder
        setMessages(prev => prev.map(msg => 
          messageIds.has(msg._id) 
            ? { ...msg, deletedForEveryone: true, message: "🚫 This message was deleted" }
            : msg
        ));
        
        // Emit socket event to update other users
        if (socket.current) {
          socket.current.emit("messages-deleted-for-everyone", {
            messageIds: Array.from(messageIds),
            chatId: currentChat._id
          });
        }
        
        // Setup undo functionality
        const deletedMessages = messages.filter(msg => messageIds.has(msg._id));
        setUndoAction({
          type: 'deleteForEveryone',
          messages: deletedMessages,
          messageIds
        });
        
        showUndoToastMessage("Messages deleted for everyone");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting messages for everyone:", error);
      return false;
    }
  }, [messages, userData._id, currentChat._id, socket, showUndoToastMessage]);

  // Call history deletion functions
  const executeDeleteCallHistoryForMe = useCallback(async (callHistoryIds) => {
    try {
      const response = await axios.post(deleteCallHistoryForMeRoute, {
        callHistoryIds: Array.from(callHistoryIds),
        userId: userData._id
      });

      if (response.data.success) {
        // Remove call history messages from local state
        setMessages(prev => prev.filter(msg => 
          !(msg.messageType === 'call-system' && callHistoryIds.has(msg._id))
        ));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting call history for me:", error);
      return false;
    }
  }, [userData._id]);

  const executeDeleteCallHistoryForEveryone = useCallback(async (callHistoryIds) => {
    try {
      const response = await axios.post(deleteCallHistoryForEveryoneRoute, {
        callHistoryIds: Array.from(callHistoryIds),
        userId: userData._id
      });

      if (response.data.success) {
        // Update call history messages to show deleted placeholder
        setMessages(prev => prev.map(msg => 
          (msg.messageType === 'call-system' && callHistoryIds.has(msg._id))
            ? { ...msg, deletedForEveryone: true, message: "🚫 This call record was deleted" }
            : msg
        ));
        
        // Emit socket event to update other users
        if (socket.current) {
          socket.current.emit("call-history-deleted-for-everyone", {
            callHistoryIds: Array.from(callHistoryIds),
            chatId: currentChat._id
          });
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting call history for everyone:", error);
      return false;
    }
  }, [userData._id, currentChat._id, socket]);

  const handleUndo = useCallback(async () => {
    if (!undoAction) return;
    
    try {
      if (undoAction.type === 'deleteForMe') {
        // Restore messages locally
        setMessages(prev => [...prev, ...undoAction.messages].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        ));
      } else if (undoAction.type === 'deleteForEveryone') {
        // Restore original messages
        setMessages(prev => prev.map(msg => {
          const originalMsg = undoAction.messages.find(original => original._id === msg._id);
          return originalMsg ? originalMsg : msg;
        }));
        
        // Emit socket event to restore for other users
        if (socket.current) {
          socket.current.emit("messages-restored", {
            messages: undoAction.messages,
            chatId: currentChat._id
          });
        }
      }
      
      // Clear undo state
      setShowUndoToast(false);
      setUndoAction(null);
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
      
    } catch (error) {
      console.error("Error during undo:", error);
    }
  }, [undoAction, undoTimeout, currentChat._id, socket]);

  const onDeleteConfirm = useCallback(async (deleteType) => {
    let messageSuccess = true;
    let callHistorySuccess = true;
    let messageError = null;
    let callHistoryError = null;
    
    // Delete messages if any are selected
    if (selectedMessages.size > 0) {
      try {
        messageSuccess = deleteType === 'forMe' 
          ? await executeDeleteForMe(selectedMessages)
          : await executeDeleteForEveryone(selectedMessages);
      } catch (error) {
        messageSuccess = false;
        messageError = error;
      }
    }
    
    // Delete call history if any are selected
    if (selectedCallHistory.size > 0) {
      try {
        callHistorySuccess = deleteType === 'forMe' 
          ? await executeDeleteCallHistoryForMe(selectedCallHistory)
          : await executeDeleteCallHistoryForEveryone(selectedCallHistory);
      } catch (error) {
        callHistorySuccess = false;
        callHistoryError = error;
      }
    }
    
    // Handle results and provide feedback
    if (messageSuccess && callHistorySuccess) {
      // Complete success
      if (selectedMessages.size > 0 && selectedCallHistory.size > 0) {
        showUndoToastMessage(`Messages and call history deleted ${deleteType === 'forMe' ? 'for you' : 'for everyone'}`);
      } else if (selectedMessages.size > 0) {
        showUndoToastMessage(`Messages deleted ${deleteType === 'forMe' ? 'for you' : 'for everyone'}`);
      } else {
        showUndoToastMessage(`Call history deleted ${deleteType === 'forMe' ? 'for you' : 'for everyone'}`);
      }
      clearSelection();
      setShowDeleteDialog(false);
    } else if (messageSuccess || callHistorySuccess) {
      // Partial success
      let successMessage = '';
      let errorMessage = '';
      
      if (messageSuccess && !callHistorySuccess) {
        successMessage = `Messages deleted ${deleteType === 'forMe' ? 'for you' : 'for everyone'}`;
        errorMessage = 'Failed to delete call history';
      } else if (!messageSuccess && callHistorySuccess) {
        successMessage = `Call history deleted ${deleteType === 'forMe' ? 'for you' : 'for everyone'}`;
        errorMessage = 'Failed to delete messages';
      }
      
      // Show partial success notification
      showUndoToastMessage(`${successMessage}. ${errorMessage}.`);
      
      // Clear only successful selections
      if (messageSuccess) {
        setSelectedMessages(new Set());
      }
      if (callHistorySuccess) {
        setSelectedCallHistory(new Set());
      }
      
      // Exit selection mode if all items are cleared
      if ((messageSuccess || selectedMessages.size === 0) && (callHistorySuccess || selectedCallHistory.size === 0)) {
        setIsSelectionMode(false);
        setShowDeleteDialog(false);
      }
    } else {
      // Complete failure
      console.error('Failed to delete both messages and call history:', { messageError, callHistoryError });
      alert('Failed to delete selected items. Please try again.');
    }
  }, [selectedMessages, selectedCallHistory, executeDeleteForMe, executeDeleteForEveryone, executeDeleteCallHistoryForMe, executeDeleteCallHistoryForEveryone, clearSelection, showUndoToastMessage]);

  // Check if user can delete for everyone (only for sent messages and own call history)
  const canDeleteForEveryone = useCallback(() => {
    if (selectedMessages.size === 0 && selectedCallHistory.size === 0) return false;
    
    // Check messages - only allow if all are from self
    const messagesCanDelete = selectedMessages.size === 0 || Array.from(selectedMessages).every(messageId => {
      const message = messages.find(msg => msg._id === messageId);
      return message && message.fromSelf;
    });
    
    // Check call history - allow all call history to be deleted for everyone
    const callHistoryCanDelete = true; // Call history can always be deleted for everyone
    
    return messagesCanDelete && callHistoryCanDelete;
  }, [selectedMessages, selectedCallHistory, messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (isSelectionMode) {
        if (event.key === 'Escape') {
          clearSelection();
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          if (selectedMessages.size > 0 || selectedCallHistory.size > 0) {
            handleDeleteMessages();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isSelectionMode, selectedMessages, selectedCallHistory, clearSelection, handleDeleteMessages]);

  const handleEndCall = () => {
    setShowVideoCall(false);
    activeCallIdRef.current = null;
  };
  
  return (
    <Container>
      <div className="chat-header">
        <div className="header-left">
          {isMobile && (
            <button className="back-btn" onClick={onBack}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          <div className="user-details">
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
                alt={currentChat.username}
              />
              <div className={`status-dot ${onlineUsers.has(currentChat._id) ? 'online' : 'offline'}`}></div>
            </div>
            <div className="user-info">
              <h3>{currentChat.username}</h3>
              <span className="status">
                <div className={`online-indicator ${onlineUsers.has(currentChat._id) ? 'online' : 'offline'}`}></div>
                {onlineUsers.has(currentChat._id) ? 'Online' : 'Last seen recently'}
              </span>
            </div>
          </div>
        </div>
        <div className="chat-actions">
          <button 
            className="action-btn call-btn" 
            onClick={startAudioCall}
            title="Voice Call"
          >
            <FiPhone />
          </button>
          <button 
            className="action-btn call-btn" 
            onClick={startVideoCall}
            title="Video Call"
          >
            <FiVideo />
          </button>
          <div className="dropdown-container">
            <button 
              className="action-btn menu-btn" 
              title="More options"
              onClick={handleDropdownToggle}
            >
              <FiMoreVertical />
            </button>
            {showDropdown && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={handleThemeToggle}>
                  {isDarkMode ? <FiSun /> : <FiMoon />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button className="dropdown-item" onClick={() => {
                  if (onOpenSettings) {
                    onOpenSettings();
                  }
                  setShowDropdown(false);
                }}>
                  <FiSettings />
                  <span>Settings</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleManageFriendship}>
                  <FiUserX />
                  <span>Manage Friendship</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => {
          // Check if this is a system message or call history
          const isSystemMessage = message.messageType === 'call-system' || message.isSystemMessage;
          const isCallHistory = message.messageType === 'call-system';
          const isSelected = isCallHistory ? selectedCallHistory.has(message._id) : selectedMessages.has(message._id);
          const isDeleted = message.deletedForEveryone;
          
          return (
            <div ref={scrollRef} key={message._id || uuidv4()}>
              <div
                className={`message ${
                  isSystemMessage ? "system-message" : (message.fromSelf ? "sended" : "recieved")
                } ${isSelected ? "selected" : ""} ${isDeleted ? "deleted" : ""} ${isCallHistory && isSelected ? "call-history-selected" : ""}`}
                onContextMenu={(e) => {
                  if (isDeleted) return;
                  e.preventDefault();
                  handleMessageLongPress(message._id, isCallHistory);
                }}
                onClick={() => {
                  if (isDeleted) return;
                  if (isSelectionMode) {
                    handleMessageSelect(message._id, isCallHistory);
                  }
                }}
                onTouchStart={(e) => {
                  if (isDeleted) return;
                  // Handle long press on mobile
                  const touchStartTime = Date.now();
                  const longPressTimeout = setTimeout(() => {
                    handleMessageLongPress(message._id, isCallHistory);
                  }, 500);
                  
                  const handleTouchEnd = () => {
                    clearTimeout(longPressTimeout);
                    if (Date.now() - touchStartTime < 500 && isSelectionMode) {
                      handleMessageSelect(message._id, isCallHistory);
                    }
                    e.target.removeEventListener('touchend', handleTouchEnd);
                  };
                  
                  e.target.addEventListener('touchend', handleTouchEnd);
                }}
              >
                {/* Selection checkbox */}
                {isSelectionMode && !isDeleted && (
                  <div className={`message-checkbox ${isCallHistory ? 'call-history-checkbox' : ''}`}>
                    <div className={`checkbox ${isSelected ? 'checked' : ''} ${isCallHistory ? 'call-history-check' : ''}`}>
                      {isSelected && <FiX />}
                    </div>
                  </div>
                )}
                
                <div className="content">
                  {isDeleted ? (
                    <div className="deleted-message">
                      <span className="deleted-icon">🚫</span>
                      <span className="deleted-text">This message was deleted</span>
                    </div>
                  ) : (
                    renderMessageContent(message)
                  )}
                  
                  {!isSystemMessage && !isDeleted && (
                    message.fromSelf ? (
                      <MessageStatus 
                        status={message.status || "sent"} 
                        timestamp={message.createdAt}
                      />
                    ) : (
                      <span className="timestamp">
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )
                  )}
                  
                  {isSystemMessage && (
                    <span className="system-timestamp">
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  
                  {isDeleted && (
                    <span className="deleted-timestamp">
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Selection Action Bar */}
      {isSelectionMode && (selectedMessages.size > 0 || selectedCallHistory.size > 0) && (
        <SelectionActionBar>
          <div className="selection-info">
            <span className="count">
              {selectedMessages.size + selectedCallHistory.size} selected
              {selectedMessages.size > 0 && selectedCallHistory.size > 0 && 
                ` (${selectedMessages.size} messages, ${selectedCallHistory.size} call history)`
              }
            </span>
          </div>
          <div className="actions">
            <button 
              className="action-btn delete-btn" 
              onClick={handleDeleteMessages}
              title="Delete selected items"
            >
              <FiTrash2 />
            </button>
            <button 
              className="action-btn cancel-btn" 
              onClick={clearSelection}
              title="Cancel selection"
            >
              <FiX />
            </button>
          </div>
        </SelectionActionBar>
      )}
      
      {/* Undo Toast */}
      {showUndoToast && (
        <UndoToast>
          <span>Messages deleted</span>
          <button onClick={handleUndo} className="undo-btn">
            UNDO
          </button>
        </UndoToast>
      )}
      <ChatInput 
        handleSendMsg={handleSendMsg} 
        currentUser={currentUser} 
        currentChat={currentChat} 
      />
      
      {/* Message Delete Dialog */}
      {showDeleteDialog && (
        <MessageDeleteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={onDeleteConfirm}
          selectedCount={selectedMessages.size + selectedCallHistory.size}
          canDeleteForEveryone={canDeleteForEveryone()}
          hasMessages={selectedMessages.size > 0}
          hasCallHistory={selectedCallHistory.size > 0}
        />
      )}

      {/* Friendship Management Modal */}
      {showFriendshipModal && (
        <FriendshipModal>
          <ModalOverlay onClick={() => setShowFriendshipModal(false)} />
          <ModalContent>
            <ModalHeader>
              <h3>Manage Friendship with {currentChat.username}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowFriendshipModal(false)}
              >
                ×
              </button>
            </ModalHeader>
            <ModalBody>
              <p>Choose an action to manage your friendship with {currentChat.username}:</p>
              <ModalActions>
                <ActionButton 
                  className="unfriend"
                  onClick={handleUnfriend}
                  disabled={friendshipAction === 'unfriend'}
                >
                  <FiUserX />
                  <span>
                    {friendshipAction === 'unfriend' ? 'Unfriending...' : 'Unfriend'}
                  </span>
                </ActionButton>
                <ActionButton 
                  className="block"
                  onClick={handleBlock}
                  disabled={friendshipAction === 'block'}
                >
                  <FiSlash />
                  <span>
                    {friendshipAction === 'block' ? 'Blocking...' : 'Block User'}
                  </span>
                </ActionButton>
              </ModalActions>
              <WarningText>
                ⚠️ Both actions will delete all chat history immediately and permanently!
              </WarningText>
            </ModalBody>
          </ModalContent>
        </FriendshipModal>
      )}

      {/* Video Call Modal - Updated for clean call system */}
      {showVideoCall && activeCallData && (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={handleEndVideoCall}
          socket={socket}
          currentUser={userData}
          contact={activeCallData.contact}
          callType={activeCallData.callType}
          isIncoming={!activeCallData.isInitiator}
          callId={activeCallData.callId}
          onCallEnd={(duration) => saveCallHistoryMessage('ended', duration)}
        />
      )}

    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: ${props => props.theme.background};
  position: relative;
  overflow: hidden;
  transition: background ${props => props.theme.transitionNormal};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.theme.type === 'dark' 
      ? `radial-gradient(circle at 25% 25%, rgba(0, 255, 136, 0.03) 0%, transparent 50%),
         radial-gradient(circle at 75% 75%, rgba(0, 255, 255, 0.03) 0%, transparent 50%)`
      : `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
         radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.02) 0%, transparent 50%)`
    };
    pointer-events: none;
    z-index: 0;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: ${props => props.theme.type === 'dark' 
      ? props.theme.glassBackground
      : `linear-gradient(135deg, ${props.theme.surface} 0%, ${props.theme.backgroundSecondary} 100%)`
    };
    border-bottom: 1px solid ${props => props.theme.surfaceBorder};
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 2px 12px rgba(0, 255, 136, 0.1), 0 1px 3px rgba(0, 0, 0, 0.3)`
      : `0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05)`
    };
    z-index: 10;
    position: relative;
    backdrop-filter: ${props => props.theme.type === 'dark' ? props.theme.glassBlur : 'blur(20px)'};
    transition: all ${props => props.theme.transitionNormal};
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      
      .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.15)`
          : `rgba(99, 102, 241, 0.1)`
        };
        border: none;
        border-radius: 50%;
        color: ${props => props.theme.primary};
        cursor: pointer;
        transition: all ${props => props.theme.transitionFast};
        
        &:hover {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.25)`
            : `rgba(99, 102, 241, 0.15)`
          };
          transform: translateX(-2px);
        }
        
        &:active {
          transform: translateX(-1px) scale(0.98);
        }
      }
      
      .user-details {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.3)`
            : `rgba(99, 102, 241, 0.2)`
          };
          transition: all ${props => props.theme.transitionNormal};
          
          &:hover {
            border-color: ${props => props.theme.primary};
            transform: scale(1.05);
            box-shadow: ${props => props.theme.type === 'dark' 
              ? `0 0 20px rgba(0, 255, 136, 0.3)`
              : `0 4px 12px rgba(99, 102, 241, 0.2)`
            };
          }
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
            
            &.online {
              background: ${props => props.theme.success};
              animation: pulse 2s infinite;
            }
            
            &.offline {
              background: ${props => props.theme.textTertiary};
            }
          }
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          h3 {
            font-size: 18px;
            font-weight: 600;
            color: ${props => props.theme.textPrimary};
            margin: 0;
            line-height: 1.2;
            font-family: ${props => props.theme.fontFamilyDisplay};
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: ${props => props.theme.textSecondary};
            font-weight: 500;
            
            .online-indicator {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              
              &.online {
                background: ${props => props.theme.success};
                animation: pulse 2s infinite;
              }
              
              &.offline {
                background: ${props => props.theme.textTertiary};
              }
            }
          }
        }
      }
    }
    
    .chat-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.1)`
          : `rgba(99, 102, 241, 0.08)`
        };
        border: none;
        border-radius: 50%;
        color: ${props => props.theme.primary};
        cursor: pointer;
        transition: all ${props => props.theme.transitionNormal};
        
        &:hover {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.2)`
            : `rgba(99, 102, 241, 0.12)`
          };
          transform: translateY(-1px);
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 4px 12px rgba(0, 255, 136, 0.3)`
            : `0 4px 12px rgba(99, 102, 241, 0.2)`
          };
        }
        
        &:active {
          transform: translateY(0) scale(0.98);
        }
      }

      .call-btn {
        &:hover {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(0, 200, 100, 0.2)`
            : `rgba(0, 150, 80, 0.15)`
          };
          color: ${props => props.theme.type === 'dark' ? '#00c864' : '#00a855'};
        }
      }
      
      .menu-btn {
        background: ${props => props.theme.gradientPrimary};
        color: ${props => props.theme.type === 'dark' ? props.theme.textInverse : 'white'};
        
        &:hover {
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 4px 15px rgba(0, 255, 136, 0.4)`
            : `0 4px 15px rgba(99, 102, 241, 0.3)`
          };
        }
      }
    }
  }
  
  .chat-messages {
    padding: 24px 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
    
    .message {
      display: flex;
      margin-bottom: 8px;
      animation: messageSlideIn 0.25s ease-out;
      position: relative;
      align-items: flex-end;
      gap: 8px;
      transition: all ${props => props.theme.transitionFast};
      
      &.selected {
        background: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.1)`
          : `rgba(99, 102, 241, 0.1)`
        };
        border-radius: 8px;
        padding: 4px;
        margin: 4px 0;
        
        .content {
          transform: translateX(4px);
        }
      }
      
      .message-checkbox {
        display: flex;
        align-items: center;
        padding: 8px 4px;
        
        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid ${props => props.theme.primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          cursor: pointer;
          transition: all ${props => props.theme.transitionFast};
          
          &.checked {
            background: ${props => props.theme.primary};
            color: white;
            
            svg {
              width: 12px;
              height: 12px;
            }
          }
          
          &:hover {
            transform: scale(1.1);
            box-shadow: ${props => props.theme.type === 'dark' 
              ? `0 0 8px rgba(0, 255, 136, 0.3)`
              : `0 0 8px rgba(99, 102, 241, 0.3)`
            };
          }
        }
      }
      
      &.sended {
        justify-content: flex-end;
        
        .content {
          background: ${props => props.theme.chatBubbleSent};
          color: ${props => props.theme.chatBubbleTextSent};
          border-radius: 16px 16px 4px 16px;
          max-width: 75%;
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: -6px;
            width: 0;
            height: 0;
            border-left: 6px solid ${props => props.theme.chatBubbleSent};
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
          }
          
          p {
            margin: 0;
            word-wrap: break-word;
            line-height: 1.4;
          }
        }
      }
      
      &.recieved {
        justify-content: flex-start;
        
        .content {
          background: ${props => props.theme.chatBubbleReceived};
          color: ${props => props.theme.chatBubbleTextReceived};
          border-radius: 16px 16px 16px 4px;
          border: 1px solid ${props => props.theme.surfaceBorder};
          max-width: 75%;
          position: relative;
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 1px 2px rgba(0, 0, 0, 0.3)`
            : `0 1px 2px rgba(0, 0, 0, 0.04)`
          };
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: -6px;
            width: 0;
            height: 0;
            border-right: 6px solid ${props => props.theme.chatBubbleReceived};
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
          }
          
          p {
            margin: 0;
            word-wrap: break-word;
            line-height: 1.4;
            color: ${props => props.theme.chatBubbleTextReceived};
          }
        }
      }
      
      &.deleted {
        opacity: 0.6;
        
        .content {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(255, 255, 255, 0.05)`
            : `rgba(0, 0, 0, 0.03)`
          };
          border: 1px dashed ${props => props.theme.surfaceBorder};
          
          &::after {
            display: none; // Remove bubble tail for deleted messages
          }
        }
      }
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: all ${props => props.theme.transitionFast};
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 4px 12px rgba(0, 0, 0, 0.4)`
            : `0 4px 12px rgba(0, 0, 0, 0.1)`
          };
        }
        
        .timestamp {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
          align-self: flex-end;
          font-weight: 500;
        }
        
        .deleted-timestamp {
          font-size: 12px;
          opacity: 0.5;
          margin-top: 4px;
          align-self: flex-end;
          font-weight: 500;
          color: ${props => props.theme.textTertiary};
        }
        
        .deleted-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          color: ${props => props.theme.textTertiary};
          font-style: italic;
          opacity: 0.7;
          
          .deleted-icon {
            font-size: 16px;
          }
          
          .deleted-text {
            font-size: 14px;
          }
        }

        // Image message styles
        .image-message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          
          .message-image {
            max-width: 250px;
            max-height: 300px;
            border-radius: 8px;
            object-fit: cover;
            cursor: pointer;
            transition: all ${props => props.theme.transitionNormal};
            border: 1px solid ${props => props.theme.surfaceBorder};
            
            &:hover {
              transform: scale(1.02);
              box-shadow: ${props => props.theme.type === 'dark' 
                ? `0 4px 16px rgba(0, 0, 0, 0.4)`
                : `0 4px 16px rgba(0, 0, 0, 0.1)`
              };
            }
          }
          
          .file-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            
            .file-name {
              font-size: 12px;
              font-weight: 500;
              opacity: 0.8;
            }
            
            .file-size {
              font-size: 11px;
              opacity: 0.6;
            }
          }
        }

        // File message styles
        .file-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(255, 255, 255, 0.05)`
            : `rgba(0, 0, 0, 0.03)`
          };
          border-radius: 8px;
          border: 1px solid ${props => props.theme.surfaceBorder};
          transition: all ${props => props.theme.transitionNormal};
          min-width: 200px;
          
          &:hover {
            background: ${props => props.theme.type === 'dark' 
              ? `rgba(255, 255, 255, 0.08)`
              : `rgba(0, 0, 0, 0.05)`
            };
          }
          
          .file-icon {
            width: 40px;
            height: 40px;
            background: ${props => props.theme.gradientPrimary};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            
            svg {
              width: 20px;
              height: 20px;
            }
          }
          
          .file-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            
            .file-name {
              font-size: 14px;
              font-weight: 500;
              color: ${props => props.theme.textPrimary};
              word-break: break-all;
            }
            
            .file-size {
              font-size: 12px;
              opacity: 0.7;
              color: ${props => props.theme.textSecondary};
            }
            
            .download-link {
              font-size: 12px;
              color: ${props => props.theme.primary};
              text-decoration: none;
              font-weight: 500;
              transition: all ${props => props.theme.transitionFast};
              
              &:hover {
                color: ${props => props.theme.primaryHover};
                text-decoration: underline;
              }
            }
          }
        }

        // Voice message styles
        .voice-message {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.1)`
            : `rgba(99, 102, 241, 0.1)`
          };
          border-radius: 12px;
          border: 1px solid ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.2)`
            : `rgba(99, 102, 241, 0.2)`
          };
          min-width: 280px;
          max-width: 300px;
          
          .voice-player {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .voice-icon {
              font-size: 24px;
              animation: pulse 2s infinite;
              
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
              }
            }
            
            .audio-control {
              flex: 1;
              height: 32px;
              background: transparent;
              
              &::-webkit-media-controls-panel {
                background: transparent;
              }
              
              &::-webkit-media-controls-play-button,
              &::-webkit-media-controls-pause-button {
                background: ${props => props.theme.primary};
                border-radius: 50%;
              }
              
              &::-webkit-media-controls-timeline {
                background: ${props => props.theme.surfaceBorder};
                border-radius: 4px;
              }
              
              &::-webkit-media-controls-current-time-display,
              &::-webkit-media-controls-time-remaining-display {
                color: ${props => props.theme.textSecondary};
                font-size: 11px;
              }
            }
            
            .voice-duration {
              font-size: 12px;
              color: ${props => props.theme.textSecondary};
              font-weight: 500;
              min-width: 30px;
              text-align: right;
            }
          }
          
          .voice-info {
            display: flex;
            justify-content: flex-end;
            
            .file-size {
              font-size: 11px;
              opacity: 0.7;
              color: ${props => props.theme.textSecondary};
            }
          }
        }
      }
      
      &.system-message {
        justify-content: center;
        margin: 16px 0;
        
        .content {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(255, 255, 255, 0.08)`
            : `rgba(0, 0, 0, 0.05)`
          };
          color: ${props => props.theme.textSecondary};
          border-radius: 12px;
          border: 1px solid ${props => props.theme.surfaceBorder};
          padding: 12px 16px;
          max-width: none;
          width: auto;
          text-align: center;
          position: relative;
          backdrop-filter: blur(10px);
          
          &::after {
            display: none; // Remove the bubble tail for system messages
          }
          
          .call-system-message {
            .call-system-content {
              .caller-name {
                font-weight: 600;
                font-size: 14px;
                color: ${props => props.theme.textPrimary};
                margin-bottom: 4px;
              }
              
              .call-details {
                font-size: 13px;
                opacity: 0.8;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              }
            }
          }
          
          .system-timestamp {
            font-size: 11px;
            opacity: 0.6;
            margin-top: 8px;
            display: block;
            font-weight: 400;
          }
          
          &:hover {
            transform: none; // Disable hover animation for system messages
            box-shadow: none;
          }
        }
        
        /* Call history selection styles */
        &.call-history-selected {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(255, 165, 0, 0.15)` // Orange tint for call history
            : `rgba(255, 140, 0, 0.1)`
          };
          border: 1px solid ${props => props.theme.type === 'dark' 
            ? `rgba(255, 165, 0, 0.3)`
            : `rgba(255, 140, 0, 0.2)`
          };
          
          .content {
            border-color: ${props => props.theme.type === 'dark' 
              ? `rgba(255, 165, 0, 0.4)`
              : `rgba(255, 140, 0, 0.3)`
            };
          }
        }
        
        .message-checkbox {
          &.call-history-checkbox {
            .checkbox {
              border-color: ${props => props.theme.type === 'dark' ? '#FFA500' : '#FF8C00'};
              
              &.call-history-check.checked {
                background: ${props => props.theme.type === 'dark' ? '#FFA500' : '#FF8C00'};
                color: white;
              }
              
              &:hover {
                border-color: ${props => props.theme.type === 'dark' ? '#FFD700' : '#FF6347'};
                box-shadow: ${props => props.theme.type === 'dark' 
                  ? `0 0 8px rgba(255, 165, 0, 0.4)`
                  : `0 0 8px rgba(255, 140, 0, 0.4)`
                };
              }
            }
          }
        }
      }
    }
    
    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(${props => props.theme.type === 'dark' ? '0, 255, 136' : '16, 185, 129'}, 0.4);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(${props => props.theme.type === 'dark' ? '0, 255, 136' : '16, 185, 129'}, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(${props => props.theme.type === 'dark' ? '0, 255, 136' : '16, 185, 129'}, 0);
      }
    }
  }
  
  /* Dropdown Styles */
  .chat-actions {
    .dropdown-container {
      position: relative;
      
      .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 180px;
        background: ${props => props.theme.surfaceElevated};
        border: 1px solid ${props => props.theme.surfaceBorder};
        border-radius: 12px;
        box-shadow: ${props => props.theme.elevationHigh};
        backdrop-filter: blur(20px);
        z-index: 1000;
        overflow: hidden;
        animation: dropdownSlideIn 0.2s ease-out;
        
        &::before {
          content: '';
          position: absolute;
          top: -8px;
          right: 16px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid ${props => props.theme.surfaceElevated};
        }
        
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          color: ${props => props.theme.textPrimary};
          cursor: pointer;
          transition: all ${props => props.theme.transitionFast};
          font-family: ${props => props.theme.fontFamily};
          font-size: 14px;
          text-align: left;
          
          svg {
            font-size: 16px;
            color: ${props => props.theme.textSecondary};
            transition: color ${props => props.theme.transitionFast};
          }
          
          &:hover {
            background: ${props => props.theme.type === 'dark' 
              ? `rgba(0, 255, 136, 0.1)`
              : `rgba(99, 102, 241, 0.08)`
            };
            
            svg {
              color: ${props => props.theme.primary};
            }
          }
          
          &.logout-item {
            color: ${props => props.theme.error};
            
            &:hover {
              background: ${props => props.theme.type === 'dark' 
                ? `rgba(255, 0, 64, 0.1)`
                : `rgba(255, 107, 107, 0.08)`
              };
              
              svg {
                color: ${props => props.theme.error};
              }
            }
          }
          
          span {
            font-weight: 500;
          }
        }
        
        .dropdown-divider {
          height: 1px;
          background: ${props => props.theme.surfaceBorder};
          margin: 4px 0;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    .chat-header {
      padding: 12px 16px;
      
      .user-details .avatar {
        width: 40px;
        height: 40px;
      }
      
      .user-info h3 {
        font-size: 16px;
      }
      
      .chat-actions {
        gap: 4px;
        
        .action-btn {
          width: 44px;
          height: 44px;
        }
      }
    }
    
    .chat-messages {
      padding: 16px 12px;
      gap: 8px;
      
      .message {
        &.sended .content,
        &.recieved .content {
          max-width: 85%;
          padding: 8px 12px;
        }
      }
    }
  }
  
  // Call message styling
  .call-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: #f3f4f6;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    max-width: fit-content;
    
    .call-icon {
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    
    .call-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .call-text {
        font-size: 14px;
        color: #374151;
        font-weight: 500;
      }
      
      .call-duration {
        font-size: 12px;
        color: #6b7280;
        opacity: 0.8;
      }
    }
  }
  
  // Override default message background for call messages
  .message .content:has(.call-message) {
    background-color: transparent !important;
  }
`;

const FriendshipModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  position: relative;
  background: ${props => props.theme.surface};
  border-radius: 16px;
  box-shadow: ${props => props.theme.shadowLg};
  border: 1px solid ${props => props.theme.surfaceBorder};
  width: min(400px, 90vw);
  max-height: 80vh;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.surfaceBorder};
  
  h3 {
    margin: 0;
    color: ${props => props.theme.textPrimary};
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: ${props => props.theme.textSecondary};
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all ${props => props.theme.transitionFast};
    
    &:hover {
      color: ${props => props.theme.textPrimary};
      background: ${props => props.theme.backgroundSecondary};
    }
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  
  p {
    margin: 0 0 20px 0;
    color: ${props => props.theme.textSecondary};
    line-height: 1.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 8px;
  background: ${props => props.theme.backgroundSecondary};
  color: ${props => props.theme.textPrimary};
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast};
  font-size: 14px;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadowSm};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.unfriend {
    border-color: #f59e0b;
    color: #f59e0b;
    
    &:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.1);
    }
  }
  
  &.block {
    border-color: #ef4444;
    color: #ef4444;
    
    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
    }
  }
  
  svg {
    font-size: 16px;
  }
`;

const WarningText = styled.p`
  color: #f59e0b !important;
  font-size: 13px !important;
  font-weight: 500;
  margin: 0 !important;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.2);
`;

const SelectionActionBar = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 24px;
  box-shadow: ${props => props.theme.elevationHigh};
  backdrop-filter: blur(20px);
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .selection-info {
    .count {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.theme.textPrimary};
    }
  }
  
  .actions {
    display: flex;
    gap: 8px;
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all ${props => props.theme.transitionFast};
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &.delete-btn {
        background: ${props => props.theme.error};
        color: white;
        
        &:hover {
          background: ${props => props.theme.errorHover};
          transform: scale(1.05);
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
      
      &.cancel-btn {
        background: ${props => props.theme.surfaceSecondary};
        color: ${props => props.theme.textSecondary};
        
        &:hover {
          background: ${props => props.theme.surface};
          color: ${props => props.theme.textPrimary};
          transform: scale(1.05);
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
`;

const UndoToast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 8px;
  box-shadow: ${props => props.theme.elevationHigh};
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 1001;
  animation: slideUp 0.3s ease-out;
  
  span {
    font-size: 14px;
    color: ${props => props.theme.textPrimary};
    font-weight: 500;
  }
  
  .undo-btn {
    background: none;
    border: none;
    color: ${props => props.theme.primary};
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all ${props => props.theme.transitionFast};
    
    &:hover {
      background: ${props => props.theme.type === 'dark' 
        ? `rgba(0, 255, 136, 0.1)`
        : `rgba(99, 102, 241, 0.1)`
      };
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
`;
