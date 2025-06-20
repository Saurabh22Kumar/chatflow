import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { searchUsersRoute, sendFriendRequestRoute, checkFriendStatusRoute } from "../utils/APIRoutes";
import { FiSearch, FiUser, FiUserPlus, FiX, FiCheck, FiClock, FiMessageCircle } from "react-icons/fi";

export default function UserSearch({ isOpen, onClose, currentUser, onUserSelect, socket }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState({});

  // Clear search when component closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
      setFriendStatuses({});
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts when component unmounts
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTimeout]);

  // Debounced search function
  useEffect(() => {
    // Don't proceed if currentUser is not available
    if (!currentUser?._id) {
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    if (searchQuery.length >= 2) {
      setIsSearching(true);
      
      const timeout = setTimeout(async () => {
        // Double-check currentUser is still available
        if (!currentUser?._id) {
          setIsSearching(false);
          return;
        }
        
        try {
          const response = await axios.get(
            `${searchUsersRoute}/${currentUser._id}/${encodeURIComponent(searchQuery)}`
          );
          const users = response.data.users;
          setSearchResults(users);
          
          // Fetch friend status for each user
          const statuses = {};
          for (const user of users) {
            // Check if currentUser is still available
            if (!currentUser?._id) {
              break;
            }
            
            try {
              const statusResponse = await axios.get(
                `${checkFriendStatusRoute}/${currentUser._id}/${user._id}`
              );
              statuses[user._id] = statusResponse.data.relationshipStatus;
            } catch (error) {
              console.error(`Error checking status for ${user._id}:`, error);
              statuses[user._id] = 'none';
            }
          }
          setFriendStatuses(statuses);
          setHasSearched(true);
        } catch (error) {
          console.error("Error searching users:", error);
          setSearchResults([]);
          setFriendStatuses({});
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce

      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      setFriendStatuses({});
    }

    // Cleanup function
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentUser?._id]); // Removed searchTimeout from dependencies to avoid infinite loops

  // Don't render if currentUser is not available
  if (!currentUser) {
    return null;
  }

  const handleUserSelect = async (user) => {
    if (!currentUser?._id) {
      console.error("Current user not available");
      return;
    }
    
    const friendStatus = friendStatuses[user._id];
    
    if (friendStatus === 'friend') {
      // Start chat with friend
      if (onUserSelect) {
        onUserSelect(user);
      }
      onClose();
    } else if (friendStatus === 'none') {
      // Send friend request
      try {
        // Double-check currentUser is still available
        if (!currentUser?._id) {
          console.error("Current user not available for friend request");
          return;
        }
        
        const response = await axios.post(sendFriendRequestRoute, {
          fromUserId: currentUser._id,
          toUserId: user._id
        });
        
        if (response.data.status) {
          // Update local status
          setFriendStatuses(prev => ({
            ...prev,
            [user._id]: 'request_sent'
          }));

          // Emit Socket.IO event for real-time notification
          if (socket?.current) {
            socket.current.emit("friend-request-sent", {
              toUserId: user._id,
              fromUser: {
                _id: currentUser._id,
                username: currentUser.username,
                email: currentUser.email,
                avatarImage: currentUser.avatarImage
              }
            });
          }
        } else {
          console.error("Failed to send friend request:", response.data.msg);
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
      }
    }
    // For other statuses (request_sent, request_received), do nothing or show info
  };

  if (!isOpen) return null;

  return (
    <SearchOverlay onClick={onClose}>
      <SearchModal onClick={(e) => e.stopPropagation()}>
        <SearchHeader>
          <h2>Search Users</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </SearchHeader>

        <SearchContainer>
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {isSearching && <div className="search-spinner"></div>}
          </div>

          <SearchResults>
            {isSearching && (
              <div className="search-status">
                <div className="spinner"></div>
                <span>Searching...</span>
              </div>
            )}

            {!isSearching && hasSearched && searchQuery.length >= 2 && (
              <>
                {searchResults.length > 0 ? (
                  <>
                    <div className="results-header">
                      Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                    </div>
                    {searchResults.map((user) => {
                      const friendStatus = friendStatuses[user._id] || 'none';
                      return (
                        <UserResultCard 
                          key={user._id} 
                          onClick={() => handleUserSelect(user)}
                          $friendStatus={friendStatus}
                        >
                          <div className="user-avatar">
                            {user.isAvatarImageSet ? (
                              <img
                                src={`data:image/svg+xml;base64,${user.avatarImage}`}
                                alt={user.username}
                              />
                            ) : (
                              <FiUser />
                            )}
                          </div>
                          <div className="user-info">
                            <div className="username">@{user.username}</div>
                            {(user.profile?.firstName || user.profile?.lastName) && (
                              <div className="display-name">
                                {user.profile.firstName} {user.profile.lastName}
                              </div>
                            )}
                            <div className="status-message">
                              {user.profile?.statusMessage || "Hey there! I'm using ChatFlow 🚀"}
                            </div>
                          </div>
                          <div className={`action-btn ${friendStatus}`}>
                            {friendStatus === 'friend' && <FiMessageCircle />}
                            {friendStatus === 'none' && <FiUserPlus />}
                            {friendStatus === 'request_sent' && <FiClock />}
                            {friendStatus === 'request_received' && <FiCheck />}
                          </div>
                        </UserResultCard>
                      );
                    })}
                  </>
                ) : (
                  <div className="no-results">
                    <FiUser className="no-results-icon" />
                    <div className="no-results-text">
                      No users found for "{searchQuery}"
                    </div>
                    <div className="no-results-subtitle">
                      Try searching with a different username
                    </div>
                  </div>
                )}
              </>
            )}

            {!hasSearched && searchQuery.length < 2 && searchQuery.length > 0 && (
              <div className="search-hint">
                Type at least 2 characters to search
              </div>
            )}

            {!hasSearched && searchQuery.length === 0 && (
              <div className="search-placeholder">
                <FiSearch className="placeholder-icon" />
                <div className="placeholder-text">
                  Search for users by their username
                </div>
                <div className="placeholder-subtitle">
                  Start typing to find people to chat with
                </div>
              </div>
            )}
          </SearchResults>
        </SearchContainer>
      </SearchModal>
    </SearchOverlay>
  );
}

const SearchOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const SearchModal = styled.div`
  background: ${props => props.theme.surfaceElevated};
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  box-shadow: ${props => props.theme.elevationHigh};
  overflow: hidden;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const SearchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.surfaceBorder};
  background: ${props => props.theme.background};

  h2 {
    color: ${props => props.theme.textPrimary};
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: ${props => props.theme.textSecondary};
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all ${props => props.theme.transitionFast};

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: ${props => props.theme.surfaceHover};
      color: ${props => props.theme.textPrimary};
    }
  }
`;

const SearchContainer = styled.div`
  padding: 20px 24px;

  .search-input-wrapper {
    position: relative;
    margin-bottom: 20px;

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: ${props => props.theme.textTertiary};
      width: 18px;
      height: 18px;
    }

    input {
      width: 100%;
      padding: 12px 48px 12px 44px;
      background: ${props => props.theme.surfaceElevated};
      border: 2px solid ${props => props.theme.surfaceBorder};
      border-radius: 12px;
      color: ${props => props.theme.textPrimary};
      font-size: 14px;
      transition: all ${props => props.theme.transitionFast};

      &:focus {
        outline: none;
        border-color: ${props => props.theme.primary};
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      &::placeholder {
        color: ${props => props.theme.textTertiary};
      }
    }

    .search-spinner {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      border: 2px solid ${props => props.theme.surfaceBorder};
      border-top: 2px solid ${props => props.theme.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SearchResults = styled.div`
  max-height: 400px;
  overflow-y: auto;

  .search-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: ${props => props.theme.textSecondary};

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid ${props => props.theme.surfaceBorder};
      border-top: 2px solid ${props => props.theme.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .results-header {
    color: ${props => props.theme.textSecondary};
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    padding: 0 4px;
  }

  .search-hint, .search-placeholder, .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: ${props => props.theme.textSecondary};

    .placeholder-icon, .no-results-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .placeholder-text, .no-results-text {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
      color: ${props => props.theme.textPrimary};
    }

    .placeholder-subtitle, .no-results-subtitle {
      font-size: 14px;
      opacity: 0.7;
    }
  }
`;

const UserResultCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast};
  border: 1px solid transparent;

  &:hover {
    background: ${props => props.theme.surfaceHover};
    border-color: ${props => props.theme.primary};
    transform: translateY(-1px);
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${props => props.theme.gradientPrimary};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    svg {
      width: 24px;
      height: 24px;
      color: white;
    }
  }

  .user-info {
    flex: 1;
    min-width: 0;

    .username {
      font-weight: 600;
      color: ${props => props.theme.textPrimary};
      font-size: 14px;
      margin-bottom: 2px;
    }

    .display-name {
      font-size: 13px;
      color: ${props => props.theme.textSecondary};
      margin-bottom: 4px;
    }

    .status-message {
      font-size: 12px;
      color: ${props => props.theme.textTertiary};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .action-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${props => props.theme.transitionFast};

    svg {
      width: 18px;
      height: 18px;
    }

    /* Default state - Send friend request */
    &.none {
      background: ${props => props.theme.primary};
      color: white;
    }

    /* Friend - Chat */
    &.friend {
      background: ${props => props.theme.success};
      color: white;
    }

    /* Request sent - Pending */
    &.request_sent {
      background: ${props => props.theme.warning || '#f59e0b'};
      color: white;
      cursor: not-allowed;
    }

    /* Request received - Can accept */
    &.request_received {
      background: ${props => props.theme.info || '#3b82f6'};
      color: white;
    }
  }

  &:hover .action-btn {
    &.none, &.friend, &.request_received {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    &.request_sent {
      transform: none;
      box-shadow: none;
    }
  }

  /* Disable interaction for sent requests */
  ${props => props.$friendStatus === 'request_sent' && `
    cursor: default;
    &:hover {
      transform: none;
      border-color: transparent;
    }
  `}
`;
