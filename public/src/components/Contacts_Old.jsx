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
            <div className="avatar">
              <img
                src={`data:image/svg+xml;base64,${currentUserImage}`}
                alt="avatar"
              />
            </div>
            <div className="username">
              <h2>{currentUserName}</h2>
            </div>
          </div>
        </Container>
      )}
    </>
  );
}
const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  background: var(--surface-color);
  border-right: 1px solid var(--border-color);
  
  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--gradient);
    
    h3 {
      color: white;
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
  }
  
  .contacts {
    display: flex;
    flex-direction: column;
    padding: 20px 16px;
    overflow-y: auto;
    gap: 8px;
    
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
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--text-secondary-color);
    }
    
    .contact {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      min-height: 70px;
      cursor: pointer;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.6s ease;
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: var(--primary-color);
        
        &::before {
          left: 100%;
        }
      }
      
      .avatar {
        position: relative;
        
        img {
          height: 45px;
          width: 45px;
          border-radius: 50%;
          border: 2px solid var(--border-color);
          transition: border-color 0.3s ease;
        }
        
        &::after {
          content: '';
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background: var(--success-color);
          border: 2px solid var(--surface-color);
          border-radius: 50%;
        }
      }
      
      .username {
        flex: 1;
        
        h3 {
          color: var(--text-color);
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-family);
        }
        
        .status {
          color: var(--text-secondary-color);
          font-size: 12px;
          font-weight: 400;
        }
      }
    }
    
    .selected {
      background: var(--primary-color);
      border-color: var(--primary-color);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(var(--primary-color-rgb), 0.3);
      
      .username h3,
      .username .status {
        color: white;
      }
      
      .avatar img {
        border-color: white;
      }
    }
  }

  .current-user {
    background: var(--gradient);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-top: 1px solid var(--border-color);
    
    .avatar {
      img {
        height: 50px;
        width: 50px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.3);
      }
    }
    
    .username {
      h2 {
        color: white;
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        font-family: var(--font-family);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
    }
    
    @media screen and (max-width: 768px) {
      padding: 12px;
      gap: 8px;
      
      .avatar img {
        height: 40px;
        width: 40px;
      }
      
      .username h2 {
        font-size: 14px;
      }
    }
  }
`;
