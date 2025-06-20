import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import MessageStatus from "./MessageStatus";
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
    padding: 16px 24px;
    background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.05);
    z-index: 10;
    position: relative;
    backdrop-filter: blur(20px);
    
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
        background: rgba(99, 102, 241, 0.1);
        border: none;
        border-radius: 50%;
        color: #6366F1;
        cursor: pointer;
        transition: all 0.15s ease-out;
        
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
        gap: 12px;
        
        .avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(99, 102, 241, 0.2);
          transition: all 0.25s ease-out;
          
          &:hover {
            border-color: #6366F1;
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
            border-radius: 50%;
            border: 2px solid white;
            
            &.online {
              background: #10B981;
              animation: pulse 2s infinite;
            }
            
            &.offline {
              background: #6B7280;
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
            color: #0F172A;
            margin: 0;
            line-height: 1.2;
          }
          
          .status {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: #475569;
            font-weight: 500;
            
            .online-indicator {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              
              &.online {
                background: #10B981;
                animation: pulse 2s infinite;
              }
              
              &.offline {
                background: #6B7280;
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
        width: 40px;
        height: 40px;
        background: rgba(99, 102, 241, 0.08);
        border: none;
        border-radius: 50%;
        color: #6366F1;
        cursor: pointer;
        transition: all 0.25s ease-out;
        
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
        background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
        color: white;
        
        &:hover {
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
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
      
      &.sended {
        justify-content: flex-end;
        
        .content {
          background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
          color: white;
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
            border-left: 6px solid #6366F1;
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
          color: #0F172A;
          border-radius: 16px 16px 16px 4px;
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
            color: #0F172A;
          }
        }
      }
      
      .content {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: all 0.15s ease-out;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .timestamp {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 4px;
          align-self: flex-end;
          font-weight: 500;
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
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
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
          width: 36px;
          height: 36px;
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
`;
