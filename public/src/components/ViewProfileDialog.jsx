import React from "react";
import styled from "styled-components";
import { BsX, BsPersonCircle, BsEnvelope, BsCalendar, BsClock, BsCircleFill } from "react-icons/bs";
import { FiUser, FiMessageCircle } from "react-icons/fi";

export default function ViewProfileDialog({ 
  isOpen, 
  contact, 
  isOnline,
  onClose,
  onMessage 
}) {
  if (!isOpen || !contact) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <DialogOverlay onClick={onClose}>
      <DialogContainer onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <HeaderTitle>Profile</HeaderTitle>
          <CloseButton onClick={onClose}>
            <BsX />
          </CloseButton>
        </DialogHeader>
        
        <DialogContent>
          {/* Avatar Section */}
          <AvatarSection>
            <AvatarContainer>
              {contact.isAvatarImageSet ? (
                <Avatar src={`data:image/svg+xml;base64,${contact.avatarImage}`} alt="avatar" />
              ) : (
                <DefaultAvatar>
                  <BsPersonCircle />
                </DefaultAvatar>
              )}
              <OnlineIndicator isOnline={isOnline}>
                <BsCircleFill />
              </OnlineIndicator>
            </AvatarContainer>
            <UserInfo>
              <Username>{contact.username}</Username>
              <StatusMessage>
                {contact.profile?.statusMessage || "Hey there! I'm using ChatFlow 🚀"}
              </StatusMessage>
            </UserInfo>
          </AvatarSection>

          {/* Profile Details */}
          <ProfileDetails>
            <DetailSection>
              <SectionTitle>Personal Information</SectionTitle>
              <DetailItem>
                <DetailIcon><FiUser /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Full Name</DetailLabel>
                  <DetailValue>
                    {contact.profile?.firstName || contact.profile?.lastName 
                      ? `${contact.profile?.firstName || ''} ${contact.profile?.lastName || ''}`.trim()
                      : 'Not provided'
                    }
                  </DetailValue>
                </DetailContent>
              </DetailItem>
              
              <DetailItem>
                <DetailIcon><BsEnvelope /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Email</DetailLabel>
                  <DetailValue>{contact.email || 'Not available'}</DetailValue>
                </DetailContent>
              </DetailItem>

              {contact.profile?.bio && (
                <DetailItem>
                  <DetailIcon><FiMessageCircle /></DetailIcon>
                  <DetailContent>
                    <DetailLabel>Bio</DetailLabel>
                    <DetailValue>{contact.profile.bio}</DetailValue>
                  </DetailContent>
                </DetailItem>
              )}
            </DetailSection>

            <DetailSection>
              <SectionTitle>Activity</SectionTitle>
              <DetailItem>
                <DetailIcon><BsClock /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Last Seen</DetailLabel>
                  <DetailValue>
                    {isOnline ? (
                      <OnlineStatus>
                        <BsCircleFill style={{ fontSize: '8px', color: '#10B981' }} />
                        Online now
                      </OnlineStatus>
                    ) : (
                      formatLastSeen(contact.activity?.lastSeen)
                    )}
                  </DetailValue>
                </DetailContent>
              </DetailItem>
              
              <DetailItem>
                <DetailIcon><BsCalendar /></DetailIcon>
                <DetailContent>
                  <DetailLabel>Member Since</DetailLabel>
                  <DetailValue>{formatDate(contact.createdAt)}</DetailValue>
                </DetailContent>
              </DetailItem>
            </DetailSection>
          </ProfileDetails>
        </DialogContent>
        
        <DialogActions>
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton variant="primary" onClick={() => { onMessage(); onClose(); }}>
            <FiMessageCircle style={{ marginRight: '8px' }} />
            Send Message
          </ActionButton>
        </DialogActions>
      </DialogContainer>
    </DialogOverlay>
  );
}

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(4px);
    }
  }
`;

const DialogContainer = styled.div`
  background: ${props => props.theme?.surface || '#1F2937'};
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      transform: translateY(20px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    max-width: 90vw;
    border-radius: 12px;
    max-height: 85vh;
  }

  @media (max-width: 480px) {
    max-width: 95vw;
    margin: 10px;
    border-radius: 8px;
  }
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.05)'};
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 18px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.theme?.textPrimary || '#ffffff'};
  }
`;

const DialogContent = styled.div`
  padding: 0;
  max-height: 60vh;
  overflow-y: auto;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px;
  background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.02)'};
  border-bottom: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
`;

const AvatarContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid ${props => props.theme?.primary || '#3B82F6'};
  object-fit: cover;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const DefaultAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  font-size: 40px;
  border: 3px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const OnlineIndicator = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.theme?.surface || '#1F2937'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isOnline ? '#10B981' : '#6B7280'};
  font-size: 12px;
  border: 2px solid ${props => props.theme?.surface || '#1F2937'};
`;

const UserInfo = styled.div`
  text-align: center;
`;

const Username = styled.h3`
  margin: 0 0 8px 0;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 20px;
  font-weight: 600;
`;

const StatusMessage = styled.p`
  margin: 0;
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  font-size: 14px;
  font-style: italic;
  max-width: 300px;
  line-height: 1.4;
`;

const ProfileDetails = styled.div`
  padding: 0;
`;

const DetailSection = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailIcon = styled.div`
  color: ${props => props.theme?.primary || '#3B82F6'};
  font-size: 16px;
  margin-right: 12px;
  margin-top: 2px;
  flex-shrink: 0;
`;

const DetailContent = styled.div`
  flex: 1;
`;

const DetailLabel = styled.div`
  color: ${props => props.theme?.textSecondary || '#9CA3AF'};
  font-size: 12px;
  margin-bottom: 4px;
  font-weight: 500;
`;

const DetailValue = styled.div`
  color: ${props => props.theme?.textPrimary || '#ffffff'};
  font-size: 14px;
  line-height: 1.4;
`;

const OnlineStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10B981;
  font-weight: 500;
`;

const DialogActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  background: ${props => props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.02)'};
  border-top: 1px solid ${props => props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  ${props => props.variant === 'primary' ? `
    background: ${props.theme?.primary || '#3B82F6'};
    color: white;
    
    &:hover {
      background: ${props.theme?.primaryHover || '#2563EB'};
      transform: translateY(-1px);
    }
  ` : `
    background: transparent;
    color: ${props.theme?.textSecondary || '#9CA3AF'};
    border: 1px solid ${props.theme?.border || 'rgba(255, 255, 255, 0.1)'};
    
    &:hover {
      background: ${props.theme?.surfaceHover || 'rgba(255, 255, 255, 0.05)'};
      color: ${props.theme?.textPrimary || '#ffffff'};
    }
  `}
`;
