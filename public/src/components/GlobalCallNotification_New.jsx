import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';

const GlobalCallNotification = ({ 
  isVisible, 
  callData,
  onAccept, 
  onReject 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible && callData) {
      setIsAnimating(true);
      
      // Add mobile vibration (only if user has interacted with page)
      if (navigator.vibrate) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (error) {
          // Silently ignore vibration errors (user hasn't interacted yet)
          console.log("Vibration blocked - user hasn't interacted with page yet");
        }
      }
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, callData]);

  if (!isVisible || !callData) return null;

  const handleAccept = () => {
    console.log("User accepted call:", callData.callId);
    onAccept(callData);
  };

  const handleReject = () => {
    console.log("User rejected call:", callData.callId);
    onReject(callData);
  };

  return (
    <Overlay>
      <ModalContainer isAnimating={isAnimating}>
        <Header>
          <CallTypeIcon callType={callData.callType}>
            {callData.callType === 'video' ? <FiVideo /> : <FiPhone />}
          </CallTypeIcon>
          <HeaderText>
            Incoming {callData.callType === 'video' ? 'Video' : 'Voice'} Call
          </HeaderText>
        </Header>

        <CallerSection>
          <Avatar>
            {callData.fromName?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <CallerName>{callData.fromName || 'Unknown'}</CallerName>
          <CallingText>is calling you...</CallingText>
        </CallerSection>

        <Actions>
          <RejectButton onClick={handleReject}>
            <FiPhoneOff />
            <span>Decline</span>
          </RejectButton>
          
          <AcceptButton onClick={handleAccept}>
            {callData.callType === 'video' ? <FiVideo /> : <FiPhone />}
            <span>Accept</span>
          </AcceptButton>
        </Actions>
      </ModalContainer>
    </Overlay>
  );
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContainer = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  min-width: 350px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  transform: ${props => props.isAnimating ? 'scale(1.02)' : 'scale(1)'};
  animation: ${props => props.isAnimating ? 'pulse 1.5s infinite ease-in-out' : 'slideIn 0.3s ease-out'};
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  @keyframes slideIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @media (max-width: 768px) {
    min-width: 300px;
    padding: 30px 20px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const CallTypeIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.callType === 'video' ? '#00d084' : '#007bff'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
`;

const HeaderText = styled.span`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const CallerSection = styled.div`
  margin-bottom: 40px;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 2.5rem;
  margin: 0 auto 20px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
`;

const CallerName = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const CallingText = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #666;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  
  @media (max-width: 480px) {
    gap: 20px;
  }
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  font-size: 24px;
  
  span {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 480px) {
    padding: 15px;
    min-width: 70px;
  }
`;

const AcceptButton = styled(ActionButton)`
  background: #00d084;
  color: white;
  
  &:hover {
    background: #00b771;
    box-shadow: 0 8px 25px rgba(0, 208, 132, 0.4);
  }
`;

const RejectButton = styled(ActionButton)`
  background: #ff4757;
  color: white;
  
  &:hover {
    background: #ff3838;
    box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
  }
`;

export default GlobalCallNotification;
