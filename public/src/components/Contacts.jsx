import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX, FiMoreVertical, FiSettings, FiMessageCircle, FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import { HiOutlineStatusOnline } from "react-icons/hi";
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import axios from "axios";
import { logoutRoute, deleteChatRoute, blockUserAPIRoute } from "../utils/APIRoutes";
import UserSearch from "./UserSearch";
import ContactOptionsMenu from "./ContactOptionsMenu";
import DeleteChatDialog from "./DeleteChatDialog";
import ViewProfileDialog from "./ViewProfileDialog";

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid var(--bg-primary);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
  }
`;

export default function Contacts({ contacts, changeChat, currentUser, isMobile = false, onlineUsers = new Set(), onOpenSettings, friendRequestCount = 0, unreadCounts = {}, socket, onContactsUpdate }) {
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [currentUserImage, setCurrentUserImage] = useState(undefined);
  const [currentSelected, setCurrentSelected] = useState(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [contactToView, setContactToView] = useState(null);
  
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );
        
        if (data && data.username) {
          setCurrentUserName(data.username);
          setCurrentUserImage(data.avatarImage);
        } else {
          // If no user data, redirect to login
          console.log('No user data found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigate('/login');
      }
    };
    
    loadUserData();
  }, [navigate]);

  const changeCurrentChat = (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isUserOnline = (userId) => {
    const isOnline = onlineUsers.has(userId);
    // Only log for debugging specific users
    if (userId === "test1" || userId === "test2") {
      console.log(`User ${userId} online status:`, isOnline);
    }
    return isOnline;
  };

  const handleLogout = async () => {
    try {
      const userData = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
      );
      
      if (userData?._id) {
        await axios.get(`${logoutRoute}/${userData._id}`);
      }
      
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      localStorage.clear();
      navigate("/login");
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setShowDropdown(false); // Close dropdown after action
  };

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  const handleUserSearch = () => {
    setShowUserSearch(true);
    setShowDropdown(false); // Close dropdown if open
  };

  const handleUserSelect = (user) => {
    // For now, just start a chat with the selected user
    // In the next step, we'll add friend request functionality
    changeChat(user);
    setShowUserSearch(false);
  };

  // Contact Options Handlers
  const handleDeleteChat = (contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteChat = async () => {
    if (!contactToDelete) return;
    
    try {
      // API call to delete chat and remove contact
      const response = await axios.delete(deleteChatRoute, {
        data: {
          userId: currentUser._id,
          contactId: contactToDelete._id
        }
      });

      if (response.data.success) {
        // Check if the deleted contact was the currently selected one
        const deletedContactIndex = contacts.findIndex(contact => contact._id === contactToDelete._id);
        if (deletedContactIndex === currentSelected) {
          // Reset current selection and redirect to Welcome screen
          setCurrentSelected(undefined);
          changeChat(undefined);
        }
        
        // Update contacts list to remove the deleted contact
        if (onContactsUpdate) {
          onContactsUpdate();
        }
        
        toast.success(`Chat with ${contactToDelete.username} deleted. Contact hidden but friendship maintained.`);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    }
  };

  const handleBlockUser = async (contact) => {
    try {
      const response = await axios.post(blockUserAPIRoute, {
        userId: currentUser._id,
        targetUserId: contact._id
      });

      if (response.data.success) {
        if (response.data.isBlocked) {
          toast.success(`${contact.username} has been blocked`);
        } else {
          toast.success(`${contact.username} has been unblocked`);
        }
        
        // Update contacts list
        if (onContactsUpdate) {
          onContactsUpdate();
        }
      }
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast.error('Failed to update block status. Please try again.');
    }
  };

  const handleViewProfile = (contact) => {
    setContactToView(contact);
    setProfileDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (contactToView) {
      const contactIndex = contacts.findIndex(c => c._id === contactToView._id);
      if (contactIndex !== -1) {
        changeCurrentChat(contactIndex, contactToView);
      }
    }
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

  return (
    <>
      {currentUserImage && currentUserName && currentUser && (
        <Container className={isMobile ? 'mobile' : ''}>
          {/* Header */}
          <div className="header">
            <div className="brand">
              <FiMessageCircle className="brand-icon" />
              <h3>Chats</h3>
              <span className="contact-count">{contacts.length}</span>
            </div>
            <div className="header-actions">
              <button 
                className="action-btn" 
                title="Search users"
                onClick={handleUserSearch}
              >
                <FiSearch />
              </button>
              <div className="dropdown-container">
                <button 
                  className="action-btn" 
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
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <FiLogOut />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery("")}>
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* Contacts List */}
          <div className="contacts">
            {filteredContacts.map((contact, index) => {
              const isSelected = index === currentSelected;
              const isOnline = isUserOnline(contact._id);
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
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h4 className="contact-name">{contact.username}</h4>
                      <span className="last-message-time">2:45 PM</span>
                    </div>
                    <div className="contact-details">
                      <p className="last-message">
                        {isOnline ? "Online" : "Last seen recently"}
                      </p>
                      <div className="message-badges">
                        {unreadCounts[contact._id] > 0 && (
                          <span className="unread-count">{unreadCounts[contact._id]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="contact-options">
                    <ContactOptionsMenu
                      contact={contact}
                      onDeleteChat={() => handleDeleteChat(contact)}
                      onBlockUser={() => handleBlockUser(contact)}
                      onViewProfile={() => handleViewProfile(contact)}
                    />
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
              <span className="user-status">
                <HiOutlineStatusOnline className="status-icon" />
                Online
              </span>
            </div>
            <button 
              className="settings-btn" 
              title="Settings"
              onClick={() => {
                if (onOpenSettings) {
                  onOpenSettings();
                }
              }}
              style={{ position: 'relative' }}
            >
              <FiSettings />
              {friendRequestCount > 0 && (
                <NotificationBadge>{friendRequestCount}</NotificationBadge>
              )}
            </button>
          </div>

          {/* User Search Modal */}
          {showUserSearch && currentUser && (
            <UserSearch
              isOpen={showUserSearch}
              onClose={() => setShowUserSearch(false)}
              currentUser={currentUser}
              onUserSelect={handleUserSelect}
              socket={socket}
            />
          )}

          {/* Delete Chat Dialog */}
          <DeleteChatDialog
            isOpen={deleteDialogOpen}
            contactName={contactToDelete?.username || ''}
            onConfirm={handleConfirmDeleteChat}
            onCancel={() => {
              setDeleteDialogOpen(false);
              setContactToDelete(null);
            }}
          />

          {/* View Profile Dialog */}
          <ViewProfileDialog
            isOpen={profileDialogOpen}
            contact={contactToView}
            isOnline={contactToView ? isUserOnline(contactToView._id) : false}
            onClose={() => {
              setProfileDialogOpen(false);
              setContactToView(null);
            }}
            onMessage={handleSendMessage}
          />
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  /* World-Class Contacts Component Design */
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  height: 100%;
  background: ${props => props.theme.background};
  border-right: 1px solid ${props => props.theme.surfaceBorder};
  transition: all ${props => props.theme.transitionNormal};
  
  &.mobile {
    border-right: none;
    height: 100vh;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: ${props => props.theme.gradientPrimary};
    position: relative;
    
    /* Subtle pattern overlay */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: ${props => props.theme.type === 'dark' 
        ? `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300ff88' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v-2h20v2.5zm0 2.5v1.5h20V22H20z'/%3E%3C/g%3E%3C/svg%3E")`
        : `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20.5V18H0v-2h20v2.5zm0 2.5v1.5h20V22H20z'/%3E%3C/g%3E%3C/svg%3E")`
      };
      opacity: 0.1;
    }
    
    @media screen and (max-width: 768px) {
      padding: 16px 20px;
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
      
      .brand-icon {
        font-size: 1.5rem;
        color: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.9)`
          : `rgba(255, 255, 255, 0.9)`
        };
      }
      
      h3 {
        color: ${props => props.theme.type === 'dark' 
          ? props.theme.textInverse
          : 'white'
        };
        font-family: ${props => props.theme.fontFamilyDisplay};
        font-family: var(--font-family-display);
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        margin: 0;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        @media screen and (max-width: 768px) {
          font-size: var(--font-size-xl);
        }
      }
      
      .contact-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }
    
    .header-actions {
      display: flex;
      gap: var(--space-2);
      position: relative;
      z-index: 1;
      
      .action-btn {
        width: 44px;
        height: 44px;
        border: none;
        background: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.15)`
          : `rgba(255, 255, 255, 0.15)`
        };
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.9)`
          : `white`
        };
        transition: all ${props => props.theme.transitionNormal};
        backdrop-filter: blur(10px);
        border: 1px solid ${props => props.theme.type === 'dark' 
          ? `rgba(0, 255, 136, 0.2)`
          : `rgba(255, 255, 255, 0.1)`
        };
        
        @media screen and (max-width: 768px) {
          width: 40px;
          height: 40px;
        }
        
        svg {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        &:hover {
          background: ${props => props.theme.type === 'dark' 
            ? `rgba(0, 255, 136, 0.25)`
            : `rgba(255, 255, 255, 0.25)`
          };
          transform: scale(1.05);
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 4px 16px rgba(0, 255, 136, 0.3)`
            : `0 4px 16px rgba(0, 0, 0, 0.1)`
          };
        }
        
        &:active {
          transform: scale(0.95);
        }
      }

      .dropdown-container {
        position: relative;
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          min-width: 180px;
          background: ${props => props.theme.surface};
          border: 1px solid ${props => props.theme.surfaceBorder};
          border-radius: 12px;
          box-shadow: ${props => props.theme.type === 'dark' 
            ? `0 8px 32px rgba(0, 0, 0, 0.6)`
            : `0 8px 32px rgba(0, 0, 0, 0.15)`
          };
          overflow: hidden;
          z-index: 1000;
          backdrop-filter: blur(20px);
          animation: dropdownSlideIn 0.2s ease-out;
          
          @keyframes dropdownSlideIn {
            from {
              opacity: 0;
              transform: translateY(-10px) scale(0.95);
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
  }
  
  .search-container {
    padding: var(--space-4) var(--space-5);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--surface-divider);
    
    @media screen and (max-width: 768px) {
      padding: var(--space-3) var(--space-4);
    }
    
    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--surface-elevated);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      transition: all var(--duration-normal) var(--ease-out);
      box-shadow: var(--elevation-1);
      
      &:focus-within {
        border-color: var(--brand-primary);
        box-shadow: var(--elevation-3), 0 0 0 3px rgba(99, 102, 241, 0.1);
        transform: translateY(-1px);
      }
      
      .search-icon {
        color: ${props => props.theme.textTertiary};
        margin-right: 12px;
        font-size: 18px;
        width: 18px;
        height: 18px;
        transition: color ${props => props.theme.transitionFast};
      }
      
      &:focus-within .search-icon {
        color: ${props => props.theme.primary};
      }
      
      .search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
        font-family: var(--font-family-body);
        font-weight: var(--font-weight-medium);
        
        &::placeholder {
          color: var(--text-tertiary);
          font-weight: var(--font-weight-normal);
        }
      }
      
      .clear-search {
        border: none;
        background: transparent;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-base);
        transition: all var(--duration-fast) var(--ease-out);
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          font-size: 1rem;
        }
        
        &:hover {
          background: var(--surface-variant);
          color: var(--brand-primary);
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
      background: var(--surface-border);
      border-radius: var(--radius-base);
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--text-tertiary);
    }
    
    .contact {
      display: flex;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-out);
      border-bottom: 1px solid var(--surface-divider);
      position: relative;
      
      @media screen and (max-width: 768px) {
        padding: var(--space-3) var(--space-4);
      }
      
      &:hover {
        background: var(--bg-secondary);
        transform: translateY(-1px);
      }
      
      &:active {
        transform: scale(0.98);
      }
      
      &.selected {
        background: var(--gradient-primary);
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: white;
          border-radius: 0 var(--radius-base) var(--radius-base) 0;
        }
        
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
        margin-right: var(--space-3);
        
        img {
          width: var(--avatar-lg);
          height: var(--avatar-lg);
          border-radius: var(--radius-full);
          border: 2px solid var(--surface-border);
          object-fit: cover;
          transition: all var(--duration-normal) var(--ease-out);
          
          @media screen and (max-width: 768px) {
            width: var(--avatar-md);
            height: var(--avatar-md);
          }
        }
        
        .status-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 0.75rem;
          height: 0.75rem;
          border-radius: var(--radius-full);
          border: 2px solid var(--surface-elevated);
          transition: all var(--duration-normal) var(--ease-out);
          
          &.online {
            background: var(--status-online);
            animation: pulse 2s infinite;
            
            @keyframes pulse {
              0% { 
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); 
              }
              70% { 
                box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); 
              }
              100% { 
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); 
              }
            }
          }
          
          &.offline {
            background: var(--status-offline);
            animation: none;
          }
          
          &.away {
            background: var(--status-away);
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
          margin-bottom: var(--space-1);
          
          .contact-name {
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            color: var(--text-primary);
            margin: 0;
            font-family: var(--font-family-display);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            
            @media screen and (max-width: 768px) {
              font-size: var(--font-size-sm);
            }
          }
          
          .last-message-time {
            font-size: var(--font-size-xs);
            color: var(--text-tertiary);
            white-space: nowrap;
            font-weight: var(--font-weight-medium);
          }
        }
        
        .contact-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .last-message {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            font-weight: var(--font-weight-normal);
            
            @media screen and (max-width: 768px) {
              font-size: var(--font-size-xs);
            }
          }
          
          .message-badges {
            display: flex;
            align-items: center;
            gap: var(--space-1);
            
            .unread-count {
              background: var(--brand-primary);
              color: white;
              font-size: var(--font-size-xs);
              font-weight: var(--font-weight-semibold);
              padding: var(--space-1) var(--space-2);
              border-radius: var(--radius-full);
              min-width: 1.125rem;
              text-align: center;
              box-shadow: var(--elevation-2);
            }
          }
        }
      }

      .contact-options {
        margin-left: var(--space-2);
        
        /* Show menu trigger on hover */
        button {
          opacity: 0;
          transform: scale(0.8);
          transition: all var(--duration-fast) var(--ease-out);
        }
      }
      
      &:hover .contact-options button {
        opacity: 1;
        transform: scale(1);
      }
      
      /* Always show menu trigger on selected contact */
      &.selected .contact-options button {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
  
  .current-user {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5);
    background: var(--surface-elevated);
    border-top: 1px solid var(--surface-border);
    
    @media screen and (max-width: 768px) {
      padding: var(--space-4);
    }
    
    .avatar {
      position: relative;
      margin-right: var(--space-3);
      
      img {
        width: var(--avatar-md);
        height: var(--avatar-md);
        border-radius: var(--radius-full);
        border: 2px solid var(--brand-primary);
        object-fit: cover;
      }
      
      .status-dot {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 0.75rem;
        height: 0.75rem;
        background: var(--status-online);
        border: 2px solid var(--surface-elevated);
        border-radius: var(--radius-full);
        animation: pulse 2s infinite;
      }
    }
    
    .user-info {
      flex: 1;
      
      h4 {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0 0 var(--space-1) 0;
        font-family: var(--font-family-display);
      }
      
      .user-status {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: var(--space-1);
        font-weight: var(--font-weight-medium);
        
        .status-icon {
          color: var(--status-online);
          font-size: 0.875rem;
        }
      }
    }
    
    .settings-btn {
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      background: var(--surface-variant);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all var(--duration-normal) var(--ease-spring);
      box-shadow: var(--elevation-1);
      
      svg {
        font-size: 1rem;
      }
      
      &:hover {
        background: var(--brand-primary);
        color: white;
        transform: scale(1.05);
        box-shadow: var(--elevation-3);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }

  /* User Search Overlay */
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  UserSearchOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
    
    .user-search-content {
      background: ${props => props.theme.surface};
      border-radius: 12px;
      padding: var(--space-4);
      width: 90%;
      max-width: 400px;
      box-shadow: var(--elevation-4);
      position: relative;
      
      @media screen and (max-width: 768px) {
        width: 95%;
        padding: var(--space-3);
      }
      
      h2 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        margin: 0 0 var(--space-3) 0;
        text-align: center;
      }
      
      .close-btn {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 1.25rem;
        transition: color var(--duration-fast);
        
        &:hover {
          color: var(--brand-primary);
        }
      }
    }
  }
`;