import React, { useState, useEffect } from "react";
import styled from "styled-components";

export default function Contacts({ contacts, changeChat, currentUser, isMobile = false }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(async () => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );
    setCurrentUserName(data.username);
    setCurrentUserImage(data.avatarImage);
  }, []);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Online";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Online";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {currentUserImage && currentUserName && (
        <Container className={isMobile ? 'mobile' : ''}>
          {/* Header */}
          <div className="header">
            <div className="brand">
              <h3>Chats</h3>
              <span className="contact-count">{contacts.length}</span>
            </div>
            <div className="header-actions">
              <button className="action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
              <button className="action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="12" cy="5" r="1"/>
                  <circle cx="12" cy="19" r="1"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Contacts List */}
          <div className="contacts">
            {filteredContacts.map((contact, index) => {
              const isSelected = index === currentSelected;
              return (
                <div
                  key={contact._id}
                  className={`contact ${isSelected ? "selected" : ""}`}
                  onClick={() => changeCurrentChat(index, contact)}
                >
                  <div className="contact-avatar">
                    <img
                      src={`data:image/svg+xml;base64,${contact.avatarImage}`}
                      alt={contact.username}
                    />
                    <div className="status-indicator online"></div>
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h4 className="contact-name">{contact.username}</h4>
                      <span className="last-message-time">2:45 PM</span>
                    </div>
                    <div className="contact-details">
                      <p className="last-message">Hey! How are you doing?</p>
                      <div className="message-badges">
                        <span className="unread-count">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current User Profile */}
          <div className="current-user">
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${currentUserImage}`}
                alt="avatar"
              />
              <div className="status-dot"></div>
            </div>
            <div className="user-info">
              <h4>{currentUserName}</h4>
              <span className="user-status">Online</span>
            </div>
            <button className="settings-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m-6-6h6m6 0h6"/>
              </svg>
            </button>
          </div>
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100%;
  background: var(--surface-color);
  border-right: 1px solid var(--border-color);
  
  &.mobile {
    border-right: none;
    height: 100vh;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
    
    @media screen and (max-width: 768px) {
      padding: 16px 20px;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      
      h3 {
        color: white;
        font-family: var(--font-family);
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        
        @media screen and (max-width: 768px) {
          font-size: 20px;
        }
      }
      
      .contact-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 8px;
      
      .action-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: all 0.3s ease;
        
        @media screen and (max-width: 768px) {
          width: 36px;
          height: 36px;
        }
        
        &:hover, &:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
      }
    }
  }
  
  .search-container {
    padding: 16px 20px;
    background: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    
    @media screen and (max-width: 768px) {
      padding: 12px 16px;
    }
    
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 8px 16px;
      transition: all 0.3s ease;
      
      &:focus-within {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
      }
      
      .search-icon {
        color: var(--text-secondary-color);
        margin-right: 8px;
      }
      
      .search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: var(--text-color);
        font-size: 14px;
        font-family: var(--font-family);
        
        &::placeholder {
          color: var(--text-secondary-color);
        }
      }
      
      .clear-search {
        border: none;
        background: transparent;
        color: var(--text-secondary-color);
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        transition: all 0.3s ease;
        
        &:hover {
          background: var(--background-color);
          color: var(--primary-color);
        }
      }
    }
  }
  
  .contacts {
    flex: 1;
    overflow-y: auto;
    
    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 2px;
    }
    
    .contact {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      border-bottom: 1px solid var(--border-color);
      position: relative;
      
      @media screen and (max-width: 768px) {
        padding: 12px 16px;
      }
      
      &:hover {
        background: var(--background-color);
      }
      
      &:active {
        background: var(--primary-color);
        transform: scale(0.98);
        
        * {
          color: white !important;
        }
      }
      
      &.selected {
        background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
        
        * {
          color: white !important;
        }
        
        .status-indicator {
          border-color: white !important;
        }
        
        .unread-count {
          background: rgba(255, 255, 255, 0.3) !important;
          color: white !important;
        }
      }
      
      .contact-avatar {
        position: relative;
        margin-right: 12px;
        
        img {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          object-fit: cover;
          
          @media screen and (max-width: 768px) {
            width: 45px;
            height: 45px;
          }
        }
        
        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--surface-color);
          
          &.online {
            background: #4ade80;
            animation: pulse 2s infinite;
            
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
              70% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
              100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
            }
          }
          
          &.offline {
            background: #94a3b8;
          }
          
          &.away {
            background: #fbbf24;
          }
        }
      }
      
      .contact-info {
        flex: 1;
        min-width: 0;
        
        .contact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          
          .contact-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
            font-family: var(--font-family);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            
            @media screen and (max-width: 768px) {
              font-size: 15px;
            }
          }
          
          .last-message-time {
            font-size: 12px;
            color: var(--text-secondary-color);
            white-space: nowrap;
          }
        }
        
        .contact-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .last-message {
            font-size: 14px;
            color: var(--text-secondary-color);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            
            @media screen and (max-width: 768px) {
              font-size: 13px;
            }
          }
          
          .message-badges {
            display: flex;
            align-items: center;
            gap: 4px;
            
            .unread-count {
              background: var(--primary-color);
              color: white;
              font-size: 11px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 10px;
              min-width: 18px;
              text-align: center;
            }
          }
        }
      }
    }
  }
  
  .current-user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    background: var(--background-color);
    border-top: 1px solid var(--border-color);
    
    @media screen and (max-width: 768px) {
      padding: 16px;
    }
    
    .avatar {
      position: relative;
      margin-right: 12px;
      
      img {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        border: 2px solid var(--primary-color);
        object-fit: cover;
      }
      
      .status-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: #4ade80;
        border: 2px solid var(--background-color);
        border-radius: 50%;
      }
    }
    
    .user-info {
      flex: 1;
      
      h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color);
        margin: 0 0 2px 0;
        font-family: var(--font-family);
      }
      
      .user-status {
        font-size: 12px;
        color: var(--text-secondary-color);
      }
    }
    
    .settings-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--surface-color);
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
        transform: scale(1.1);
      }
    }
  }
`;
