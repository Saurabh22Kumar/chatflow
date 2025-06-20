import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';

const IncomingCallNotification = ({ 
  isVisible, 
  caller, 
  callType, 
  onAccept, 
  onReject 
}) => {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      // No auto-reject timeout - calls will only be rejected manually
      // This prevents automatic call drops and "Call was rejected" messages
    } else {
      setIsRinging(false);
    }
  }, [isVisible, onReject]);

  if (!isVisible) return null;

  return (
    <NotificationContainer isRinging={isRinging}>
      <NotificationContent>
        <CallerInfo>
          <CallerAvatar>
            {caller?.username?.charAt(0).toUpperCase() || '?'}
          </CallerAvatar>
          <CallerDetails>
            <CallerName>{caller?.username || 'Unknown'}</CallerName>
            <CallTypeText>
              {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </CallTypeText>
          </CallerDetails>
        </CallerInfo>
        
        <CallActions>
          <RejectButton onClick={onReject}>
            <FiPhoneOff />
          </RejectButton>
          <AcceptButton onClick={onAccept}>
            {callType === 'video' ? <FiVideo /> : <FiPhone />}
          </AcceptButton>
        </CallActions>
      </NotificationContent>
    </NotificationContainer>
  );
};

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  background: ${props => props.theme?.surface || '#ffffff'};
  border: 1px solid ${props => props.theme?.surfaceBorder || '#e1e8ed'};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  overflow: hidden;
  animation: ${props => props.isRinging ? 'ring 1s infinite' : 'slideIn 0.3s ease-out'};
  backdrop-filter: blur(10px);

  @keyframes ring {
    0%, 20%, 40%, 60%, 80%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    width: 90vw;
    right: 5vw;
    left: 5vw;
  }
`;

const NotificationContent = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CallerInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const CallerAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: 15px;
`;

const CallerDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CallerName = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme?.text || '#333333'};
`;

const CallTypeText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${props => props.theme?.textSecondary || '#666666'};
`;

const CallActions = styled.div`
  display: flex;
  gap: 15px;
`;

const CallButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const AcceptButton = styled(CallButton)`
  background: #00d084;
  color: white;

  &:hover {
    background: #00b771;
  }
`;

const RejectButton = styled(CallButton)`
  background: #ff4757;
  color: white;

  &:hover {
    background: #ff3838;
  }
`;

export default IncomingCallNotification;
