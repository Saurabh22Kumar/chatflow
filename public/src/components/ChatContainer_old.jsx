import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import MessageStatus from "./MessageStatus";
// import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, updateMessageReadRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket, onBack, isMobile = false, onlineUsers = new Set() }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user data
  useEffect(() => {
    const userData = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    setCurrentUser(userData);
  }, []);

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
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
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

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    
    // Create temporary message with sending status
    const tempMessageId = uuidv4();
    const tempMessage = {
      _id: tempMessageId,
      fromSelf: true,
      message: msg,
      status: "sending",
      createdAt: new Date().toISOString(),
    };
    
    // Add temporary message to state
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      // Send message to backend first
      const response = await axios.post(sendMessageRoute, {
        from: data._id,
        to: currentChat._id,
        message: msg,
      });
      
      // Update message with real ID and sent status
      const realMessageId = response.data.messageId;
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
      
      // Emit message via socket with real message ID
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: data._id,
        msg,
        messageId: realMessageId,
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
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
        setArrivalMessage({ 
          fromSelf: false, 
          message: data.msg || data,
          status: "delivered",
          _id: data.messageId || uuidv4(),
          createdAt: new Date().toISOString()
        });
      });
      
      // Listen for message delivery confirmation
      socket.current.on("message-delivered", ({ messageId }) => {
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
    }
    
    return () => {
      if (socket.current) {
        socket.current.off("msg-recieve");
        socket.current.off("message-delivered");
        socket.current.off("message-read");
      }
    };
  }, [currentUser, currentChat]);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage]);
      
      // Emit delivery confirmation for received message
      if (socket.current && arrivalMessage._id) {
        socket.current.emit("message-delivered", {
          to: currentUser?._id,
          messageId: arrivalMessage._id,
        });
      }
    }
  }, [arrivalMessage, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <button className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </button>
          <button className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z"></path>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button className="action-btn menu-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => {
          return (
            <div ref={scrollRef} key={message._id || uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content">
                  <p>{message.message}</p>
                  {message.fromSelf ? (
                    <MessageStatus 
                      status={message.status || "sent"} 
                      timestamp={message.createdAt}
                    />
                  ) : (
                    <span className="timestamp">
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: linear-gradient(to bottom, #E3F2FD 0%, #F8F9FA 100%);
  position: relative;
  overflow: hidden;
  
  /* Chat background pattern */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-6);
    background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    box-shadow: 
      0 2px 12px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.05);
    z-index: 10;
    position: relative;
    backdrop-filter: blur(20px);
    
    /* Glassmorphism effect */
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.9) 0%, 
        rgba(248, 250, 252, 0.8) 100%);
      z-index: -1;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      
      .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(99, 102, 241, 0.1);
        border: none;
        border-radius: var(--radius-full);
        color: var(--brand-primary);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        
        &:hover {
          background: rgba(99, 102, 241, 0.15);
          transform: translateX(-2px);
        }
        
        &:active {
          transform: translateX(-1px) scale(0.98);
        }
        
        svg {
          transition: transform var(--duration-fast) var(--ease-out);
        }
        
        &:hover svg {
          transform: translateX(-1px);
        }
      }
      
      .user-details {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        
        .avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 2px solid rgba(99, 102, 241, 0.2);
          transition: all var(--duration-normal) var(--ease-out);
          
          &:hover {
            border-color: var(--brand-primary);
            transform: scale(1.05);
          }
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform var(--duration-normal) var(--ease-out);
          }
          
          &:hover img {
            transform: scale(1.1);
          }
          
          .status-dot {
            position: absolute;
            bottom: 2px;
            right: 2px;
            width: 12px;
            height: 12px;
            border-radius: var(--radius-full);
            border: 2px solid white;
            transition: all var(--duration-normal) var(--ease-out);
            
            &.online {
              background: var(--status-online);
              box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
              animation: pulse 2s infinite;
            }
            
            &.offline {
              background: var(--status-offline);
            }
          }
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          
          h3 {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin: 0;
            line-height: 1.2;
            letter-spacing: -0.01em;
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: var(--space-1);
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-weight: var(--font-weight-medium);
            
            .online-indicator {
              width: 6px;
              height: 6px;
              border-radius: var(--radius-full);
              transition: all var(--duration-normal) var(--ease-out);
              
              &.online {
                background: var(--status-online);
                animation: pulse 2s infinite;
              }
              
              &.offline {
                background: var(--status-offline);
              }
            }
          }
        }
      }
    }
    
    .chat-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(99, 102, 241, 0.08);
        border: none;
        border-radius: var(--radius-full);
        color: var(--brand-primary);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-out);
        position: relative;
        overflow: hidden;
        
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(99, 102, 241, 0.1);
          border-radius: var(--radius-full);
          transform: translate(-50%, -50%);
          transition: all var(--duration-normal) var(--ease-out);
        }
        
        &:hover {
          background: rgba(99, 102, 241, 0.12);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          
          &::before {
            width: 100%;
            height: 100%;
          }
        }
        
        &:active {
          transform: translateY(0) scale(0.98);
        }
        
        svg {
          z-index: 1;
          transition: transform var(--duration-fast) var(--ease-out);
        }
        
        &:hover svg {
          transform: scale(1.1);
        }
      }
      
      .menu-btn {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 100%);
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
      }
    }
    
    @media (max-width: 768px) {
      padding: var(--space-3) var(--space-4);
      
      .user-details .avatar {
        width: 40px;
        height: 40px;
      }
      
      .user-info h3 {
        font-size: var(--font-size-base);
      }
      
      .chat-actions {
        gap: var(--space-1);
        
        .action-btn {
          width: 36px;
          height: 36px;
        }
      }
    }
  }
  
  .chat-messages {
    padding: var(--space-6) var(--space-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    position: relative;
    z-index: 1;
    scroll-behavior: smooth;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.2);
      border-radius: var(--radius-full);
      
      &:hover {
        background: rgba(99, 102, 241, 0.3);
      }
    }
    
    .message {
      display: flex;
      margin-bottom: var(--space-2);
      animation: messageSlideIn var(--duration-normal) var(--ease-out);
      
      &.sended {
        justify-content: flex-end;
        
        .content {
          background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 100%);
          color: white;
          border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
          max-width: 75%;
          position: relative;
          
          /* Message tail */
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: -6px;
            width: 0;
            height: 0;
            border-left: 6px solid var(--brand-primary);
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
          background: white;
          color: var(--text-primary);
          border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
          border: 1px solid rgba(99, 102, 241, 0.1);
          max-width: 75%;
          position: relative;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          
          /* Message tail */
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: -6px;
            width: 0;
            height: 0;
            border-right: 6px solid white;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
          }
          
          p {
            margin: 0;
            word-wrap: break-word;
            line-height: 1.4;
            color: var(--text-primary);
          }
        }
      }
      
      .content {
        padding: var(--space-3) var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        transition: all var(--duration-fast) var(--ease-out);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .timestamp {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          margin-top: var(--space-1);
          align-self: flex-end;
          font-weight: var(--font-weight-medium);
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
    
    @media (max-width: 768px) {
      padding: var(--space-4) var(--space-3);
      gap: var(--space-2);
      
      .message {
        &.sended .content,
        &.recieved .content {
          max-width: 85%;
          padding: var(--space-2) var(--space-3);
        }
      }
    }
  }
  
  /* Enhanced responsive design */
  @media (max-width: 768px) {
    .chat-header {
      .user-details {
        gap: var(--space-2);
        
        .user-info {
          .status {
            font-size: var(--font-size-xs);
          }
        }
      }
    }
  }
  
  /* Dark mode support */
  [data-theme="dark"] & {
    background: linear-gradient(to bottom, #1E293B 0%, #0F172A 100%);
    
    .chat-header {
      background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
      border-bottom-color: rgba(99, 102, 241, 0.2);
      
      &::before {
        background: linear-gradient(135deg, 
          rgba(30, 41, 59, 0.9) 0%, 
          rgba(51, 65, 85, 0.8) 100%);
      }
    }
    
    .chat-messages {
      .message {
        &.recieved .content {
          background: #334155;
          color: var(--text-primary);
          border-color: rgba(99, 102, 241, 0.2);
          
          &::after {
            border-right-color: #334155;
          }
        }
      }
    }
  }
const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: linear-gradient(to bottom, #E3F2FD 0%, #F8F9FA 100%);
  position: relative;
  overflow: hidden;
  
  /* Chat background pattern */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.02) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-4) var(--space-6);
    background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    box-shadow: 
      0 2px 12px rgba(0, 0, 0, 0.04),
      0 1px 3px rgba(0, 0, 0, 0.05);
    z-index: 10;
    position: relative;
    backdrop-filter: blur(20px);
    
    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex: 1;
      
      .back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(99, 102, 241, 0.1);
        border: none;
        border-radius: var(--radius-full);
        color: var(--brand-primary);
        cursor: pointer;
        transition: all var(--duration-fast) var(--ease-out);
        
        &:hover {
          background: rgba(99, 102, 241, 0.15);
          transform: translateX(-2px);
        }
        
        &:active {
          transform: translateX(-1px) scale(0.98);
        }
      }
      
      .user-details {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        
        .avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 2px solid rgba(99, 102, 241, 0.2);
          transition: all var(--duration-normal) var(--ease-out);
          
          &:hover {
            border-color: var(--brand-primary);
            transform: scale(1.05);
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
            border-radius: var(--radius-full);
            border: 2px solid white;
            
            &.online {
              background: var(--status-online);
              animation: pulse 2s infinite;
            }
            
            &.offline {
              background: var(--status-offline);
            }
          }
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          
          h3 {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin: 0;
            line-height: 1.2;
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: var(--space-1);
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            font-weight: var(--font-weight-medium);
            
            .online-indicator {
              width: 6px;
              height: 6px;
              border-radius: var(--radius-full);
              
              &.online {
                background: var(--status-online);
                animation: pulse 2s infinite;
              }
              
              &.offline {
                background: var(--status-offline);
              }
            }
          }
        }
      }
    }
    
    .chat-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      
      .action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(99, 102, 241, 0.08);
        border: none;
        border-radius: var(--radius-full);
        color: var(--brand-primary);
        cursor: pointer;
        transition: all var(--duration-normal) var(--ease-out);
        
        &:hover {
          background: rgba(99, 102, 241, 0.12);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }
        
        &:active {
          transform: translateY(0) scale(0.98);
        }
      }
      
      .menu-btn {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 100%);
        color: white;
        
        &:hover {
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }
      }
    }
  }
  
  .chat-messages {
    padding: var(--space-6) var(--space-4);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    position: relative;
    z-index: 1;
    
    .message {
      display: flex;
      margin-bottom: var(--space-2);
      animation: messageSlideIn var(--duration-normal) var(--ease-out);
      
      &.sended {
        justify-content: flex-end;
        
        .content {
          background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 100%);
          color: white;
          border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
          max-width: 75%;
          position: relative;
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: -6px;
            width: 0;
            height: 0;
            border-left: 6px solid var(--brand-primary);
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
          background: white;
          color: var(--text-primary);
          border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
          border: 1px solid rgba(99, 102, 241, 0.1);
          max-width: 75%;
          position: relative;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          
          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: -6px;
            width: 0;
            height: 0;
            border-right: 6px solid white;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
          }
          
          p {
            margin: 0;
            word-wrap: break-word;
            line-height: 1.4;
            color: var(--text-primary);
          }
        }
      }
      
      .content {
        padding: var(--space-3) var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        transition: all var(--duration-fast) var(--ease-out);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .timestamp {
          font-size: var(--font-size-xs);
          opacity: 0.7;
          margin-top: var(--space-1);
          align-self: flex-end;
          font-weight: var(--font-weight-medium);
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
  }
  
  @media (max-width: 768px) {
    .chat-header {
      padding: var(--space-3) var(--space-4);
      
      .user-details .avatar {
        width: 40px;
        height: 40px;
      }
      
      .user-info h3 {
        font-size: var(--font-size-base);
      }
      
      .chat-actions {
        gap: var(--space-1);
        
        .action-btn {
          width: 36px;
          height: 36px;
        }
      }
    }
    
    .chat-messages {
      padding: var(--space-4) var(--space-3);
      gap: var(--space-2);
      
      .message {
        &.sended .content,
        &.recieved .content {
          max-width: 85%;
          padding: var(--space-2) var(--space-3);
        }
      }
    }
  }
`;
