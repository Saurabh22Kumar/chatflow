import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { getContactsRoute, host, onlineUsersRoute, getFriendRequestsRoute, getUnreadCountsRoute } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import Settings from "../components/Settings";
import GlobalCallNotification from "../components/GlobalCallNotification_New";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const isMountedRef = useRef(true);
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [showContacts, setShowContacts] = useState(true); // For mobile view switching
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // Track screen size to determine which layout is active
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Clean Call State Management - Rewritten from scratch
  const [incomingCall, setIncomingCall] = useState(null); // Stores incoming call data
  const [isCallNotificationVisible, setIsCallNotificationVisible] = useState(false);
  const [activeCallData, setActiveCallData] = useState(null); // For accepted calls
  
  // Track the last call end time to prevent race conditions
  const lastCallEndTimeRef = useRef(0);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const userData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
        if (!userData) {
          navigate("/login");
          return;
        }
        
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData && parsedUserData._id) {
          setCurrentUser(parsedUserData);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate("/login");
      }
    };
    
    checkUserData();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
      
      // Listen for online/offline status changes
      socket.current.on("user-online", (userId) => {
        if (!isMountedRef.current) return;
        console.log("User came online:", userId);
        console.log("Current user ID:", currentUser._id);
        // Don't add current user to their own online list
        if (userId !== currentUser._id) {
          setOnlineUsers(prev => new Set([...prev, userId]));
        }
      });
      
      socket.current.on("user-offline", (userId) => {
        if (!isMountedRef.current) return;
        console.log("User went offline:", userId);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Listen for real-time friend request notifications
      socket.current.on("friend-request-received", (data) => {
        if (!isMountedRef.current) return;
        console.log("Friend request received:", data);
        // Update friend request count
        setFriendRequestCount(prev => prev + 1);
        
        // Optional: Show a toast notification
        // toast.info(`Friend request from ${data.from.username}`);
      });

      socket.current.on("friend-request-response", (data) => {
        if (!isMountedRef.current) return;
        console.log("Friend request response:", data);
        
        if (data.type === "accepted") {
          // Reload friends list when request is accepted
          loadFriends();
          // Optional: Show success notification
          // toast.success(`${data.user.username} accepted your friend request!`);
        }
        
        // Optional: Show notification for declined requests too
        // if (data.type === "declined") {
        //   toast.info(`${data.user.username} declined your friend request`);
        // }
      });

      // Listen for chat deletion events (unfriend/block)
      socket.current.on("chat-deleted", (data) => {
        if (!isMountedRef.current) return;
        console.log("Chat deleted event received:", data);
        
        // Remove user from contacts list
        setContacts(prev => prev.filter(contact => contact._id !== data.targetUserId));
        
        // If currently chatting with the user who was unfriended/blocked, close the chat
        if (currentChat && currentChat._id === data.targetUserId) {
          setCurrentChat(undefined);
          setShowContacts(true); // Show contacts on mobile
        }
      });

      // Clean Call System Socket Events - Rewritten from scratch
      
      // 1. Call Initiated (only caller gets this with real callId)
      socket.current.on("callInitiated", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL INITIATED received:", data);
        // Use the pending call info
        const pending = pendingCallRef.current;
        if (!pending) return;
        setActiveCallData({
          type: 'outgoing',
          callId: data.callId, // Use real call ID from server
          contact: pending.contact,
          callType: pending.callType,
          isInitiator: true,
          status: 'calling'
        });
        // Clear pending call info
        pendingCallRef.current = null;
      });
      
      // 2. Incoming Call Notification (only receiver gets this)
      socket.current.on("incomingCall", (data) => {
        if (!isMountedRef.current) return;
        console.log("INCOMING CALL received:", data);
        
        // Set incoming call state
        setIncomingCall(data);
        setIsCallNotificationVisible(true);
      });
      
      // 3. Call Accepted (only caller gets this)
      socket.current.on("callAccepted", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL ACCEPTED received:", data);
        
        // Update existing active call data to show call is accepted
        setActiveCallData(prev => {
          if (prev && prev.type === 'outgoing') {
            return {
              ...prev,
              status: 'accepted' // Update status (but keep same callId)
            };
          }
          return prev;
        });
      });
      
      // 4. Call Rejected (only caller gets this)
      socket.current.on("callRejected", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL REJECTED received:", data);
        
        // Clean up call state
        setActiveCallData(null);
        // Could show "Call rejected" message here
      });
      
      // 4. Call Cancelled (only receiver gets this)
      socket.current.on("callCancelled", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL CANCELLED received:", data);
        
        // Hide incoming call notification
        setIncomingCall(null);
        setIsCallNotificationVisible(false);
      });
      
      // 5. Call Ended (both parties get this)
      socket.current.on("callEnded", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL ENDED received:", data);
        
        // Clean up all call state
        setIncomingCall(null);
        setIsCallNotificationVisible(false);
        setActiveCallData(null);
      });
      
      // 6. Call Failed (only caller gets this)
      socket.current.on("callFailed", (data) => {
        if (!isMountedRef.current) return;
        console.log("CALL FAILED received:", data);
        
        // Clean up call state
        setActiveCallData(null);
        // Could show error message here
      });

      // 7. WebRTC Signal Exchange (for peer-to-peer connection)
      socket.current.on("receiveSignal", (data) => {
        if (!isMountedRef.current) return;
        console.log("🌐 WEBRTC SIGNAL received in Chat.jsx:", data);
        
        // Forward signal to active call modal if it exists
        if (activeCallData && data.callId === activeCallData.callId) {
          console.log("🌐 Forwarding signal to VideoCallModal");
          // The VideoCallModal will handle this via its own socket listener
          // This is just for debugging - the actual handling is in VideoCallModal
        } else {
          console.log("🌐 No active call or callId mismatch");
        }
      });
      
      // Fetch initial online users list
      fetchOnlineUsers();
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (socket.current) {
        socket.current.off("user-online");
        socket.current.off("user-offline");
        socket.current.off("msg-recieve");
        socket.current.off("friend-request-received");
        socket.current.off("friend-request-response");
        socket.current.off("chat-deleted");
        // Clean call event listeners
        socket.current.off("incomingCall");
        socket.current.off("callAccepted");
        socket.current.off("callRejected");
        socket.current.off("callCancelled");
        socket.current.off("callEnded");
        socket.current.off("callFailed");
      }
    };
  }, [currentUser]);

  // Function to fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.get(onlineUsersRoute);
      console.log("Fetched online users:", response.data.onlineUsers);
      console.log("Current user ID:", currentUser._id);
      // Filter out current user from online users list
      const filteredOnlineUsers = response.data.onlineUsers.filter(userId => userId !== currentUser._id);
      console.log("Filtered online users (excluding self):", filteredOnlineUsers);
      setOnlineUsers(new Set(filteredOnlineUsers));
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  useEffect(async () => {
    if (currentUser) {
      if (currentUser.isAvatarImageSet) {
        // Load friends and friend request count when user logs in
        await loadFriends();
        await loadFriendRequestCount();
      } else {
        navigate("/setAvatar");
      }
    }
  }, [currentUser]);

  // Load friend request count when currentUser changes
  useEffect(() => {
    if (currentUser?._id) {
      loadFriendRequestCount();
    }
  }, [currentUser?._id]);

  // Function to reload friends list
  const loadFriends = async () => {
    if (!currentUser?._id) return;
    
    try {
      // Fetch visible contacts (friends minus hidden ones) for chat interface
      const data = await axios.get(`${getContactsRoute}/${currentUser._id}`);
      setContacts(data.data.friends || []);
      
      // Also load unread counts
      await loadUnreadCounts();
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  // Function to load unread message counts
  const loadUnreadCounts = async () => {
    if (!currentUser?._id) return;
    
    try {
      const response = await axios.get(`${getUnreadCountsRoute}/${currentUser._id}`);
      if (response.data.success) {
        setUnreadCounts(response.data.unreadCounts || {});
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
      setUnreadCounts({});
    }
  };

  // Function to load friend request count
  const loadFriendRequestCount = async () => {
    if (!currentUser?._id) return;
    
    try {
      const response = await axios.get(`${getFriendRequestsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setFriendRequestCount(response.data.received?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching friend request count:", error);
      setFriendRequestCount(0);
    }
  };

  // Function to handle when messages are read (clear unread count for that contact)
  const handleMessagesRead = useCallback((contactId) => {
    setUnreadCounts(prevCounts => {
      const newCounts = { ...prevCounts };
      delete newCounts[contactId]; // Remove the unread count for this contact
      return newCounts;
    });
  }, []);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    setShowContacts(false); // Hide contacts on mobile when chat is selected
  };

  const handleBackToContacts = () => {
    setShowContacts(true);
    setCurrentChat(undefined);
  };

  const handleLogout = () => {
    // Emit logout event to socket before disconnecting
    if (socket.current && currentUser) {
      socket.current.emit("user-logout", currentUser._id);
      socket.current.disconnect();
    }
    localStorage.removeItem(process.env.REACT_APP_LOCALHOST_KEY);
    navigate("/login");
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // Clean Call Handling Functions - Rewritten from scratch
  
  const handleAcceptCall = (callData) => {
    console.log("Accepting call:", callData.callId);
    
    if (!socket.current) return;
    
    // Send acceptance to caller
    socket.current.emit("acceptCall", {
      callId: callData.callId,
      from: currentUser._id,
      to: callData.from
    });
    
    // Hide notification and set active call
    setIsCallNotificationVisible(false);
    setIncomingCall(null);
    
    // Find caller contact and switch to their chat
    const callerContact = contacts.find(contact => contact._id === callData.from);
    if (callerContact) {
      setCurrentChat(callerContact);
      setShowContacts(false);
    }
    
    // Set active call data
    setActiveCallData({
      type: 'incoming',
      callId: callData.callId,
      contact: callerContact,
      callType: callData.callType,
      isInitiator: false
    });
  };

  const handleRejectCall = (callData) => {
    console.log("Rejecting call:", callData.callId);
    
    if (!socket.current) return;
    
    // Send rejection to caller
    socket.current.emit("rejectCall", {
      callId: callData.callId,
      from: currentUser._id,
      to: callData.from
    });
    
    // Hide notification
    setIsCallNotificationVisible(false);
    setIncomingCall(null);
  };

  // Add a ref to store pending call info
  const pendingCallRef = useRef(null);

  // Function to initiate a call (called from ChatContainer)
  const initiateCall = (contactId, callType) => {
    console.log("Initiating call to:", contactId, "type:", callType);
    
    if (!socket.current || !currentUser) return;
    
    // Find the contact we're calling
    const contactToCall = contacts.find(contact => contact._id === contactId);
    if (!contactToCall) {
      console.error("Contact not found for call");
      return;
    }
    
    // Store the contact and callType in a ref for use in callInitiated
    pendingCallRef.current = { contact: contactToCall, callType };
    
    // Send call initiation to server
    socket.current.emit("initiateCall", {
      from: currentUser._id,
      fromName: currentUser.username,
      to: contactId,
      callType: callType
    });
    // DO NOT setActiveCallData here!
  };

  // Handle window resize to detect mobile vs desktop layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Container>
      {/* Mobile App Header */}
      <AppHeader className="mobile-header">
        <div className="header-content">
          <h1>ChatFlow</h1>
        </div>
      </AppHeader>

      {/* Main Chat Interface */}
      <MainContainer>
        <Settings 
          isOpen={showSettings} 
          onClose={handleCloseSettings}
          currentUser={currentUser}
          socket={socket}
          onFriendRequestUpdate={() => {
            loadFriends();
            loadFriendRequestCount();
          }}
        />
        
        {/* Desktop Layout */}
        <div className="desktop-layout">
          <Contacts 
            contacts={contacts} 
            changeChat={handleChatChange}
            currentUser={currentUser}
            onlineUsers={onlineUsers}
            onOpenSettings={handleOpenSettings}
            friendRequestCount={friendRequestCount}
            unreadCounts={unreadCounts}
            socket={socket}
          />
          {currentChat === undefined ? (
            <Welcome hasFriends={contacts.length > 0} />
          ) : (
            <ChatContainer 
              currentChat={currentChat} 
              currentUser={currentUser}
              socket={socket}
              onBack={handleBackToContacts}
              onlineUsers={onlineUsers}
              onOpenSettings={handleOpenSettings}
              activeCallData={!isMobile ? activeCallData : null}
              onInitiateCall={initiateCall}
              onEndCall={() => setActiveCallData(null)}
              onMessagesRead={handleMessagesRead}
            />
          )}
        </div>

        {/* Mobile Layout */}
        <div className="mobile-layout">
          {showContacts ? (
            <Contacts 
              contacts={contacts} 
              changeChat={handleChatChange}
              currentUser={currentUser}
              isMobile={true}
              onlineUsers={onlineUsers}
              onOpenSettings={handleOpenSettings}
              friendRequestCount={friendRequestCount}
              unreadCounts={unreadCounts}
              socket={socket}
            />
          ) : currentChat ? (
            <ChatContainer 
              currentChat={currentChat} 
              currentUser={currentUser}
              socket={socket}
              onBack={handleBackToContacts}
              isMobile={true}
              onlineUsers={onlineUsers}
              onOpenSettings={handleOpenSettings}
              activeCallData={isMobile ? activeCallData : null}
              onInitiateCall={initiateCall}
              onEndCall={() => setActiveCallData(null)}
              onMessagesRead={handleMessagesRead}
            />
          ) : (
            <Welcome hasFriends={contacts.length > 0} isMobile={true} />
          )}
        </div>
      </MainContainer>

      {/* Global Call Notification - Clean Implementation */}
      <GlobalCallNotification
        isVisible={isCallNotificationVisible}
        callData={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
  overflow: hidden;
`;

const AppHeader = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  z-index: 1000;
  display: none;
  
  @media screen and (max-width: 768px) {
    display: block;
  }
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    height: 100%;
    
    h1 {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
      font-family: var(--font-family);
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
      
      button {
        width: 40px;
        height: 40px;
        border: none;
        background: var(--background-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-secondary-color);
        transition: all 0.3s ease;
        
        &:hover, &:active {
          background: var(--primary-color);
          color: white;
          transform: scale(0.95);
        }
      }
      
      .logout-btn {
        background: linear-gradient(135deg, #ff4757, #ff3838);
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #ff6b7a, #ff4757);
        }
      }
    }
  }
`;

const MainContainer = styled.div`
  flex: 1;
  display: flex;
  position: relative;
  
  .desktop-layout {
    display: grid;
    grid-template-columns: 350px 1fr;
    width: 100%;
    height: 100vh;
    
    @media screen and (max-width: 768px) {
      display: none;
    }
    
    @media screen and (min-width: 769px) and (max-width: 1080px) {
      grid-template-columns: 300px 1fr;
    }
  }
  
  .mobile-layout {
    display: none;
    width: 100%;
    height: 100vh;
    padding-top: 60px; /* Account for fixed header */
    
    @media screen and (max-width: 768px) {
      display: block;
    }
  }
`;

