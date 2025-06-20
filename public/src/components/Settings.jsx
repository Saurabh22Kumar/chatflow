import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import { useTheme } from '../contexts/ThemeContext';
import { themes } from '../utils/themes';
import axios from "axios";
import { logoutRoute, getFriendRequestsRoute, acceptFriendRequestRoute, declineFriendRequestRoute, getFriendsRoute, removeFriendRoute, deleteAccountRoute, getBlockedUsersRoute, unblockUserRoute } from "../utils/APIRoutes";
import { FiCheck, FiX, FiUsers, FiUser, FiTrash2, FiSlash, FiLock } from "react-icons/fi";
import ChangePassword from './ChangePassword';

const SettingsContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-100%'};
  width: min(400px, 100vw);
  max-width: 400px;
  height: 100vh;
  background: ${props => props.theme.surface};
  border-left: 1px solid ${props => props.theme.surfaceBorder};
  box-shadow: ${props => props.theme.type === 'dark' 
    ? `-2px 0 20px rgba(0, 0, 0, 0.5)`
    : `-2px 0 10px rgba(0, 0, 0, 0.1)`
  };
  transition: right 0.3s ease;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: ${props => props.theme.type === 'dark' ? props.theme.glassBlur : 'none'};
  
  @media (max-width: 768px) {
    width: 100vw;
    max-width: none;
    right: ${props => props.isOpen ? '0' : '-100vw'};
    border-left: none;
    border-top: 1px solid ${props => props.theme.surfaceBorder};
  }
  
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    color: ${props => props.theme.textPrimary};
    margin: 0;
    font-family: ${props => props.theme.fontFamilyDisplay};
    background: ${props => props.theme.gradientPrimary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.textPrimary};
    background: ${props => props.theme.type === 'dark' 
      ? `rgba(0, 255, 136, 0.1)`
      : `rgba(99, 102, 241, 0.1)`
    };
    transform: scale(1.1);
  }
`;

const SettingSection = styled.div`
  margin-bottom: 30px;
  
  h3 {
    color: ${props => props.theme.textPrimary};
    margin-bottom: 15px;
    font-size: 16px;
    font-family: ${props => props.theme.fontFamilyDisplay};
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .about-info {
    background: ${props => props.theme.backgroundSecondary};
    border: 1px solid ${props => props.theme.surfaceBorder};
    border-radius: 12px;
    padding: 16px;
    
    p {
      color: ${props => props.theme.textSecondary};
      margin: 4px 0;
      font-size: 14px;
      
      &:first-child {
        color: ${props => props.theme.textPrimary};
        font-weight: 600;
        margin-bottom: 8px;
      }
    }
  }
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
`;

const ThemeCard = styled.div`
  padding: 15px;
  border: 2px solid ${props => props.isActive ? props.theme.primary : props.theme.surfaceBorder};
  border-radius: 12px;
  cursor: pointer;
  transition: all ${props => props.theme.transitionNormal};
  background: ${props => props.themeData.background};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.isActive 
      ? `linear-gradient(135deg, ${props.theme.primary}20, transparent)`
      : 'transparent'
    };
    transition: all ${props => props.theme.transitionNormal};
  }
  
  &:hover {
    border-color: ${props => props.theme.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 8px 25px rgba(0, 255, 136, 0.2)`
      : `0 8px 25px rgba(99, 102, 241, 0.15)`
    };
  }
  
  .theme-name {
    font-weight: 600;
    color: ${props => props.themeData.textPrimary};
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
  }
  }
  
  .theme-preview {
    display: flex;
    gap: 5px;
    position: relative;
    z-index: 1;
    
    .color-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid ${props => props.themeData.surfaceBorder};
      transition: all ${props => props.theme.transitionFast};
      
      &:hover {
        transform: scale(1.2);
      }
    }
  }
`;

const ToggleSwitch = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input {
    display: none;
  }
  
  .switch {
    width: 50px;
    height: 26px;
    background: ${props => props.checked 
      ? props.theme.primary 
      : props.theme.surfaceBorder
    };
    border-radius: 13px;
    position: relative;
    transition: all ${props => props.theme.transitionNormal};
    margin-right: 10px;
    box-shadow: ${props => props.checked && props.theme.type === 'dark'
      ? `0 0 20px rgba(0, 255, 136, 0.3)`
      : 'none'
    };
    
    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: ${props => props.checked ? '26px' : '2px'};
      width: 22px;
      height: 22px;
      background: ${props => props.theme.type === 'dark' && props.checked 
        ? props.theme.textInverse 
        : 'white'
      };
      border-radius: 50%;
      transition: all ${props => props.theme.transitionNormal};
      box-shadow: ${props => props.theme.type === 'dark' 
        ? `0 2px 8px rgba(0, 0, 0, 0.3)`
        : `0 2px 4px rgba(0, 0, 0, 0.1)`
      };
    }
  }
  
  span {
    color: ${props => props.theme.textPrimary};
    font-weight: 500;
    font-family: ${props => props.theme.fontFamily};
  }
`;

const LogoutButtonInPanel = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.gradientError};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: ${props => props.theme.fontFamily};
  font-weight: 500;
  transition: all ${props => props.theme.transitionNormal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 4px 16px rgba(255, 0, 64, 0.3)`
      : `0 4px 16px rgba(255, 107, 107, 0.3)`
    };
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    transition: transform ${props => props.theme.transitionNormal};
  }
  
  span {
    color: white;
  }
`;

const ChangePasswordButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.type === 'dark' 
    ? 'linear-gradient(135deg, #4e0eff 0%, #7c3aed 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: ${props => props.theme.fontFamily};
  font-weight: 500;
  transition: all ${props => props.theme.transitionNormal};
  margin-bottom: 12px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 4px 16px rgba(78, 14, 255, 0.3)`
      : `0 4px 16px rgba(102, 126, 234, 0.3)`
    };
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    transition: transform ${props => props.theme.transitionNormal};
  }
  
  span {
    color: white;
  }
`;

const DeleteAccountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.error}15;
  color: ${props => props.theme.error};
  border: 1px solid ${props => props.theme.error}30;
  border-radius: 8px;
  cursor: pointer;
  font-family: ${props => props.theme.fontFamily};
  font-weight: 500;
  transition: all ${props => props.theme.transitionNormal};
  margin-top: 12px;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.error};
    color: white;
    border-color: ${props => props.theme.error};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 4px 16px rgba(255, 0, 64, 0.3)`
      : `0 4px 16px rgba(255, 107, 107, 0.3)`
    };
  }
  
  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    transition: transform ${props => props.theme.transitionNormal};
  }
`;

const DeleteAccountModal = styled.div`
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
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${props => props.theme.surface};
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: ${props => props.theme.type === 'dark' 
    ? `0 8px 32px rgba(0, 0, 0, 0.5)`
    : `0 8px 32px rgba(0, 0, 0, 0.2)`
  };

  h3 {
    color: ${props => props.theme.error};
    margin: 0 0 16px 0;
    font-family: ${props => props.theme.fontFamilyDisplay};
    display: flex;
    align-items: center;
    gap: 8px;
  }

  p {
    color: ${props => props.theme.textSecondary};
    margin: 0 0 20px 0;
    line-height: 1.5;
  }

  .warning-list {
    background: ${props => props.theme.error}10;
    border: 1px solid ${props => props.theme.error}30;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;

    ul {
      margin: 0;
      padding-left: 20px;
      color: ${props => props.theme.textSecondary};
      
      li {
        margin-bottom: 8px;
      }
    }
  }

  .password-input {
    margin: 16px 0;
    
    input {
      width: 100%;
      padding: 12px;
      border: 1px solid ${props => props.theme.surfaceBorder};
      border-radius: 8px;
      background: ${props => props.theme.background};
      color: ${props => props.theme.textPrimary};
      font-family: ${props => props.theme.fontFamily};
      
      &:focus {
        outline: none;
        border-color: ${props => props.theme.error};
      }
    }

    label {
      display: block;
      color: ${props => props.theme.textPrimary};
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;

    button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: ${props => props.theme.fontFamily};
      font-weight: 500;
      transition: all ${props => props.theme.transitionNormal};

      &.cancel {
        background: ${props => props.theme.backgroundSecondary};
        color: ${props => props.theme.textPrimary};
        border: 1px solid ${props => props.theme.surfaceBorder};

        &:hover {
          background: ${props => props.theme.surface};
        }
      }

      &.delete {
        background: ${props => props.theme.error};
        color: white;

        &:hover:not(:disabled) {
          background: ${props => props.theme.errorDark || props.theme.error};
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
`;

const FriendRequestCard = styled.div`
  background: ${props => props.theme.backgroundSecondary};
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all ${props => props.theme.transitionNormal};
  
  &:hover {
    border-color: ${props => props.theme.primary};
    box-shadow: ${props => props.theme.type === 'dark' 
      ? `0 4px 15px rgba(0, 255, 136, 0.1)`
      : `0 4px 15px rgba(99, 102, 241, 0.1)`
    };
  }
  
  .request-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid ${props => props.theme.primary};
    }
    
    .user-details {
      flex: 1;
      
      .username {
        color: ${props => props.theme.textPrimary};
        font-weight: 600;
        margin: 0;
        font-size: 14px;
      }
      
      .request-time {
        color: ${props => props.theme.textSecondary};
        font-size: 12px;
        margin: 2px 0 0 0;
      }
    }
  }
  
  .request-actions {
    display: flex;
    gap: 8px;
  }
`;

const FriendRequestButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &.accept {
    background: ${props => props.theme.success || '#10B981'};
    color: white;
    
    &:hover {
      background: ${props => props.theme.successHover || '#059669'};
      transform: translateY(-1px);
    }
  }
  
  &.decline {
    background: ${props => props.theme.backgroundSecondary};
    color: ${props => props.theme.textSecondary};
    border: 1px solid ${props => props.theme.surfaceBorder};
    
    &:hover {
      background: ${props => props.theme.danger || '#EF4444'};
      color: white;
      border-color: ${props => props.theme.danger || '#EF4444'};
      transform: translateY(-1px);
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: ${props => props.theme.textSecondary};
  
  .icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${props => props.theme.danger || '#EF4444'};
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  border: 2px solid ${props => props.theme.surface};
`;

const TabsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  background: ${props => props.theme.backgroundSecondary};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 1.5rem;
  border: 1px solid ${props => props.theme.surfaceBorder};
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    padding: 3px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
`;

const Tab = styled.button`
  padding: 10px 4px;
  background: ${props => props.active ? props.theme.surface : 'transparent'};
  border: none;
  color: ${props => props.active ? props.theme.primary : props.theme.textSecondary};
  border-radius: 8px;
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast};
  font-weight: ${props => props.active ? '600' : '500'};
  font-size: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 50px;
  position: relative;
  box-shadow: ${props => props.active ? props.theme.shadowSm : 'none'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    padding: 8px 2px;
    font-size: 0.7rem;
    min-height: 45px;
    gap: 2px;
  }
  
  @media (max-width: 480px) {
    min-height: 50px;
    font-size: 0.75rem;
    padding: 10px 4px;
  }
  
  &:hover {
    color: ${props => props.theme.primary};
    background: ${props => props.active 
      ? props.theme.surface 
      : props.theme.type === 'dark' 
        ? `rgba(0, 255, 136, 0.05)`
        : `rgba(99, 102, 241, 0.05)`
    };
  }
  
  svg {
    font-size: 1.2rem;
  }
  
  @media (max-width: 480px) {
    padding: 10px 6px;
    font-size: 0.8rem;
    min-height: 55px;
    gap: 2px;
    
    svg {
      font-size: 1rem;
    }
  }
`;

const FriendCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.surfaceBorder};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.surfaceHover};
    border-color: ${props => props.theme.primary}20;
  }

  .friend-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid ${props => props.theme.surfaceBorder};
    }

    .friend-details {
      .username {
        font-weight: 600;
        color: ${props => props.theme.text};
        margin: 0;
        font-size: 0.9rem;
      }

      .status {
        font-size: 0.8rem;
        color: ${props => props.theme.textSecondary};
        margin: 0.25rem 0 0 0;
      }
    }
  }

  .friend-actions {
    .remove-btn {
      padding: 0.5rem 0.75rem;
      background: ${props => props.theme.error}15;
      color: ${props => props.theme.error};
      border: 1px solid ${props => props.theme.error}30;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &:hover:not(:disabled) {
        background: ${props => props.theme.error};
        color: white;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

const UserInfoSection = styled.div`
  .user-info {
    background: ${props => props.theme.backgroundSecondary};
    border: 1px solid ${props => props.theme.surfaceBorder};
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;

    .user-profile {
      display: flex;
      align-items: center;
      gap: 16px;

      .profile-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid ${props => props.theme.primary};
      }

      .profile-details {
        h4 {
          margin: 0 0 4px 0;
          color: ${props => props.theme.textPrimary};
          font-family: ${props => props.theme.fontFamilyDisplay};
          font-size: 1.2rem;
        }

        p {
          margin: 0;
          color: ${props => props.theme.textSecondary};
          font-size: 0.9rem;
        }
      }
    }
  }
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.textPrimary};
  margin-bottom: 15px;
  font-size: 16px;
  font-family: ${props => props.theme.fontFamilyDisplay};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Settings = ({ isOpen: externalIsOpen, onClose, currentUser, onFriendRequestUpdate, socket }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [removingFriends, setRemovingFriends] = useState(new Set());
  const [unblockingUsers, setUnblockingUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState('requests'); // 'theme', 'friends', 'requests', 'account', 'blocked'
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalIsOpen !== undefined ? onClose : setInternalIsOpen;

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

  const loadFriendRequests = useCallback(async () => {
    if (!currentUser?._id) return;
    
    setIsLoadingRequests(true);
    try {
      const response = await axios.get(`${getFriendRequestsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setFriendRequests(response.data.received || []);
      }
    } catch (error) {
      console.error("Error loading friend requests:", error);
      setFriendRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [currentUser?._id]);

  const loadFriends = useCallback(async () => {
    if (!currentUser?._id) return;
    
    setIsLoadingFriends(true);
    try {
      const response = await axios.get(`${getFriendsRoute}/${currentUser._id}`);
      if (response.data.status) {
        setFriends(response.data.friends || []);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [currentUser?._id]);

  const loadBlockedUsers = useCallback(async () => {
    if (!currentUser?._id) return;
    
    setIsLoadingBlocked(true);
    try {
      const response = await axios.get(`${getBlockedUsersRoute}/${currentUser._id}`);
      if (response.data.status) {
        setBlockedUsers(response.data.blockedUsers || []);
      }
    } catch (error) {
      console.error("Error loading blocked users:", error);
      setBlockedUsers([]);
    } finally {
      setIsLoadingBlocked(false);
    }
  }, [currentUser?._id]);

  // Load friend requests when component opens
  useEffect(() => {
    if (isOpen && currentUser?._id) {
      loadFriendRequests();
      if (activeTab === 'friends') {
        loadFriends();
      }
      if (activeTab === 'blocked') {
        loadBlockedUsers();
      }
    }
  }, [isOpen, currentUser?._id, loadFriendRequests, loadFriends, loadBlockedUsers, activeTab]);

  const handleAcceptRequest = async (requestId, fromUserId) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    
    try {
      const response = await axios.post(acceptFriendRequestRoute, {
        userId: currentUser._id,
        requesterId: fromUserId
      });
      
      if (response.data.status) {
        // Remove the request from the list
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Emit Socket.IO event for real-time notification
        if (socket?.current) {
          socket.current.emit("friend-request-accepted", {
            requesterId: fromUserId,
            acceptorUser: {
              _id: currentUser._id,
              username: currentUser.username,
              email: currentUser.email,
              avatarImage: currentUser.avatarImage
            }
          });
        }
        
        // Notify parent component about the friend list update
        if (onFriendRequestUpdate) {
          onFriendRequestUpdate();
        }
      } else {
        console.error("Failed to accept friend request:", response.data.msg);
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId, fromUserId) => {
    setProcessingRequests(prev => new Set([...prev, requestId]));
    
    try {
      const response = await axios.post(declineFriendRequestRoute, {
        userId: currentUser._id,
        requesterId: fromUserId
      });
      
      if (response.data.status) {
        // Remove the request from the list
        setFriendRequests(prev => prev.filter(req => req._id !== requestId));
        
        // Emit Socket.IO event for real-time notification
        if (socket?.current) {
          socket.current.emit("friend-request-declined", {
            requesterId: fromUserId,
            declinerUser: {
              _id: currentUser._id,
              username: currentUser.username,
              email: currentUser.email,
              avatarImage: currentUser.avatarImage
            }
          });
        }
      } else {
        console.error("Failed to decline friend request:", response.data.msg);
      }
    } catch (error) {
      console.error("Error declining friend request:", error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRemoveFriend = async (friendId, friendUsername) => {
    if (!window.confirm(`Are you sure you want to remove ${friendUsername} from your friends list?`)) {
      return;
    }

    setRemovingFriends(prev => new Set([...prev, friendId]));
    
    try {
      const response = await axios.post(removeFriendRoute, {
        userId: currentUser._id,
        friendId: friendId
      });
      
      if (response.data.status) {
        // Remove the friend from the local list
        setFriends(prev => prev.filter(friend => friend._id !== friendId));
        
        // Notify parent component about the friend list update
        if (onFriendRequestUpdate) {
          onFriendRequestUpdate();
        }
      } else {
        console.error("Failed to remove friend:", response.data.msg);
        alert("Failed to remove friend. Please try again.");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
      alert("Error removing friend. Please try again.");
    } finally {
      setRemovingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  const handleUnblockUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unblock ${username}? They will be treated as an unfriended user.`)) {
      return;
    }

    setUnblockingUsers(prev => new Set([...prev, userId]));
    
    try {
      const response = await axios.post(unblockUserRoute, {
        userId: currentUser._id,
        targetUserId: userId
      });
      
      if (response.data.status) {
        // Remove the user from the blocked list
        setBlockedUsers(prev => prev.filter(blocked => blocked._id !== userId));
        alert(`${username} has been unblocked successfully.`);
      } else {
        console.error("Failed to unblock user:", response.data.msg);
        alert("Failed to unblock user. Please try again.");
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Error unblocking user. Please try again.");
    } finally {
      setUnblockingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteAccountConfirm = async () => {
    if (!deletePassword.trim()) {
      alert('Please enter your password to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await axios.post(deleteAccountRoute, {
        userId: currentUser._id,
        password: deletePassword
      });

      if (response.data.status) {
        // Account deleted successfully
        localStorage.clear();
        navigate("/login");
        alert('Your account and all associated data have been permanently deleted. Thank you for using ChatFlow.');
      } else {
        alert(response.data.msg || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error("Delete account error:", error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  const handleDeleteAccountCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
  };

  const formatRequestTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Settings panel only - no floating buttons */}
      
      <SettingsContainer isOpen={isOpen}>
        <SettingsHeader>
          <h2>Settings</h2>
          <CloseButton onClick={() => setIsOpen ? setIsOpen(false) : setInternalIsOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        </SettingsHeader>
        
        {/* Tabs Navigation */}
        <TabsContainer>
          <Tab 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')}
          >
            <FiUsers />
            <span>Requests</span>
            {friendRequests.length > 0 && (
              <NotificationBadge>{friendRequests.length}</NotificationBadge>
            )}
          </Tab>
          <Tab 
            active={activeTab === 'friends'} 
            onClick={() => setActiveTab('friends')}
          >
            <FiUser />
            <span>Friends</span>
          </Tab>
          <Tab 
            active={activeTab === 'theme'} 
            onClick={() => setActiveTab('theme')}
          >
            <span style={{ fontSize: '1.1rem' }}>🎨</span>
            <span>Theme</span>
          </Tab>
          <Tab 
            active={activeTab === 'blocked'} 
            onClick={() => setActiveTab('blocked')}
          >
            <FiSlash />
            <span>Blocked</span>
          </Tab>
          <Tab 
            active={activeTab === 'account'} 
            onClick={() => setActiveTab('account')}
          >
            <FiUser />
            <span>Account</span>
          </Tab>
        </TabsContainer>
        
        {/* Tab Content */}
        {activeTab === 'requests' && (
          <SettingSection>
            <SectionTitle>
              <FiUsers />
              Friend Requests 
              {friendRequests.length > 0 && (
                <NotificationBadge>{friendRequests.length}</NotificationBadge>
              )}
            </SectionTitle>
            
            {isLoadingRequests ? (
              <EmptyState>
                <div className="icon">⏳</div>
                <p>Loading friend requests...</p>
              </EmptyState>
            ) : friendRequests.length === 0 ? (
              <EmptyState>
                <div className="icon">
                  <FiUser />
                </div>
                <p>No pending friend requests</p>
              </EmptyState>
            ) : (
              friendRequests.map((request) => (
                <FriendRequestCard key={request._id}>
                  <div className="request-info">
                    <img 
                      className="avatar"
                      src={`data:image/svg+xml;base64,${request.user.avatarImage}`}
                      alt={request.user.username}
                    />
                    <div className="user-details">
                      <p className="username">{request.user.username}</p>
                      <p className="request-time">{formatRequestTime(request.sentAt)}</p>
                    </div>
                  </div>
                  <div className="request-actions">
                    <FriendRequestButton
                      className="accept"
                      onClick={() => handleAcceptRequest(request._id, request.user._id)}
                      disabled={processingRequests.has(request._id)}
                    >
                      <FiCheck />
                      Accept
                    </FriendRequestButton>
                    <FriendRequestButton
                      className="decline"
                      onClick={() => handleDeclineRequest(request._id, request.user._id)}
                      disabled={processingRequests.has(request._id)}
                    >
                      <FiX />
                      Decline
                    </FriendRequestButton>
                  </div>
                </FriendRequestCard>
              ))
            )}
          </SettingSection>
        )}
        
        {activeTab === 'friends' && (
          <SettingSection>
            <SectionTitle>
              <FiUser />
              My Friends ({friends.length})
            </SectionTitle>
            
            {isLoadingFriends ? (
              <EmptyState>
                <div className="icon">⏳</div>
                <p>Loading friends...</p>
              </EmptyState>
            ) : friends.length === 0 ? (
              <EmptyState>
                <div className="icon">
                  <FiUsers />
                </div>
                <p>No friends yet. Add some friends to start chatting!</p>
              </EmptyState>
            ) : (
              friends.map((friend) => (
                <FriendCard key={friend._id}>
                  <div className="friend-info">
                    <img 
                      className="avatar"
                      src={`data:image/svg+xml;base64,${friend.avatarImage}`}
                      alt={friend.username}
                    />
                    <div className="friend-details">
                      <p className="username">{friend.username}</p>
                      <p className="status">Friend since {new Date(friend.friendshipDate || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFriend(friend._id, friend.username)}
                      disabled={removingFriends.has(friend._id)}
                    >
                      <FiX />
                      {removingFriends.has(friend._id) ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </FriendCard>
              ))
            )}
          </SettingSection>
        )}
        
        {activeTab === 'theme' && (
          <>
            <SettingSection>
              <SectionTitle>🌙 Appearance</SectionTitle>
              <ToggleSwitch checked={isDarkMode}>
                <input 
                  type="checkbox" 
                  checked={isDarkMode}
                  onChange={toggleTheme}
                />
                <div className="switch"></div>
                <span>{isDarkMode ? 'Neo-Matrix Dark' : 'Minimal Light'}</span>
              </ToggleSwitch>
            </SettingSection>
            
            <SettingSection>
              <SectionTitle>🎨 Theme Preview</SectionTitle>
              <ThemeGrid>
                <ThemeCard
                  isActive={!isDarkMode}
                  themeData={themes.light}
                >
                  <div className="theme-name">ChatFlow Light</div>
                  <div className="theme-preview">
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.light.primary }}
                    ></div>
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.light.secondary }}
                    ></div>
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.light.accent }}
                    ></div>
                  </div>
                </ThemeCard>
                <ThemeCard
                  isActive={isDarkMode}
                  themeData={themes.dark}
                >
                  <div className="theme-name">Neo-Matrix Dark</div>
                  <div className="theme-preview">
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.dark.primary }}
                    ></div>
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.dark.secondary }}
                    ></div>
                    <div 
                      className="color-dot" 
                      style={{ backgroundColor: themes.dark.accent }}
                    ></div>
                  </div>
                </ThemeCard>
              </ThemeGrid>
            </SettingSection>
            
            <SettingSection>
              <SectionTitle>ℹ️ About ChatFlow</SectionTitle>
              <div className="about-info">
                <p>ChatFlow v2.0 - File Sharing Edition</p>
                <p>A modern, real-time chat application</p>
                <p>Built with React, Socket.io & Styled Components</p>
                <p>🎨 Features world-class theming system</p>
                <p>📁 File and photo sharing support</p>
              </div>
            </SettingSection>
          </>
        )}

        {activeTab === 'blocked' && (
          <SettingSection>
            <SectionTitle>
              <FiSlash />
              Blocked Users
              {blockedUsers.length > 0 && (
                <NotificationBadge>{blockedUsers.length}</NotificationBadge>
              )}
            </SectionTitle>
            
            {isLoadingBlocked ? (
              <EmptyState>
                <div className="icon">⏳</div>
                <p>Loading blocked users...</p>
              </EmptyState>
            ) : blockedUsers.length === 0 ? (
              <EmptyState>
                <div className="icon">
                  <FiSlash />
                </div>
                <h3>No Blocked Users</h3>
                <p>You haven't blocked anyone yet.</p>
              </EmptyState>
            ) : (
              <div className="blocked-users-list">
                {blockedUsers.map((blockedUser) => (
                  <FriendRequestCard key={blockedUser._id}>
                    <div className="request-info">
                      <img
                        src={`data:image/svg+xml;base64,${blockedUser.avatarImage}`}
                        alt={blockedUser.username}
                        className="avatar"
                      />
                      <div className="user-details">
                        <h4 className="username">{blockedUser.username}</h4>
                        <p className="request-time">{blockedUser.email}</p>
                        <span className="request-time">
                          Blocked {formatRequestTime(blockedUser.blockedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="request-actions">
                      <FriendRequestButton
                        className="accept"
                        onClick={() => handleUnblockUser(blockedUser._id, blockedUser.username)}
                        disabled={unblockingUsers.has(blockedUser._id)}
                        title="Unblock user"
                      >
                        {unblockingUsers.has(blockedUser._id) ? (
                          <>
                            <div className="spinner"></div>
                            <span>Unblocking...</span>
                          </>
                        ) : (
                          <>
                            <FiCheck />
                            <span>Unblock</span>
                          </>
                        )}
                      </FriendRequestButton>
                    </div>
                  </FriendRequestCard>
                ))}
              </div>
            )}
          </SettingSection>
        )}

        {activeTab === 'account' && (
          <SettingSection>
            <SectionTitle>
              <FiUser />
              Account Settings
            </SectionTitle>
            
            <UserInfoSection>
              <div className="user-info">
                <div className="user-profile">
                  <img 
                    src={`data:image/svg+xml;base64,${currentUser?.avatarImage}`}
                    alt={currentUser?.username}
                    className="profile-avatar"
                  />
                  <div className="profile-details">
                    <h4>{currentUser?.username}</h4>
                    <p>{currentUser?.email}</p>
                  </div>
                </div>
              </div>
            </UserInfoSection>

            <ChangePasswordButton onClick={() => setShowChangePassword(true)}>
              <FiLock />
              <span>Change Password</span>
            </ChangePasswordButton>

            <LogoutButtonInPanel onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </LogoutButtonInPanel>

            <DeleteAccountButton onClick={handleDeleteAccount}>
              <FiTrash2 />
              <span>Delete Account</span>
            </DeleteAccountButton>
          </SettingSection>
        )}
      </SettingsContainer>
      
      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <DeleteAccountModal>
          <ModalContent>
            <h3>
              <FiTrash2 />
              Delete Account
            </h3>
            <p>
              ⚠️ This will PERMANENTLY delete your account and ALL associated data. This action is irreversible.
            </p>
            
            <div className="warning-list">
              <p><strong>⚡ PERMANENT DELETION - What will be removed:</strong></p>
              <ul>
                <li>🗑️ Your user account will be completely deleted</li>
                <li>💬 All your messages and chat history will be permanently removed</li>
                <li>👥 You will be removed from all friend lists</li>
                <li>📤 All sent and received friend requests will be deleted</li>
                <li>🚫 Any blocked user records will be cleared</li>
                <li>📁 Profile data, avatar, and settings will be wiped</li>
                <li>🔄 This action CANNOT be undone - no recovery possible</li>
              </ul>
            </div>
            
            <div className="password-input">
              <label>Confirm with your password</label>
              <input 
                type="password" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="modal-actions">
              <button className="cancel" onClick={handleDeleteAccountCancel}>
                Cancel
              </button>
              <button 
                className="delete"
                onClick={handleDeleteAccountConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Permanently Deleting...' : 'YES, PERMANENTLY DELETE'}
              </button>
            </div>
          </ModalContent>
        </DeleteAccountModal>
      )}
      
      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword 
          currentUser={currentUser} 
          onClose={() => setShowChangePassword(false)} 
        />
      )}
    </>
  );
};

export default Settings;
