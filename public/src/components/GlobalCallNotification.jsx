import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';

const GlobalCallNotification = ({ 
  isVisible, 
  callerData,
  onAccept, 
  onReject 
}) => {
  const [isRinging, setIsRinging] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const audioRef = useRef(null);

  // Start ringing animation and sound when notification becomes visible
  useEffect(() => {
    if (isVisible && callerData) {
      setIsRinging(true);
      setShowAnimation(true);
      
      // Add a subtle vibration on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      
      // Optional: Play notification sound
      // if (audioRef.current) {
      //   audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      // }
    } else {
      setIsRinging(false);
      setShowAnimation(false);
      
      // Stop notification sound
      // if (audioRef.current) {
      //   audioRef.current.pause();
      //   audioRef.current.currentTime = 0;
      // }
    }
  }, [isVisible, callerData]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!isVisible || !callerData) return null;

  const handleAccept = () => {
    setIsRinging(false);
    onAccept();
  };

  const handleReject = () => {
    setIsRinging(false);
    onReject();
  };

  return (
    <>
      {/* Optional: Hidden audio element for ringtone */}
      {/* <audio ref={audioRef} loop>
        <source src="/sounds/ringtone.mp3" type="audio/mpeg" />
      </audio> */}
      
      <NotificationOverlay showAnimation={showAnimation}>
        <NotificationModal isRinging={isRinging}>
          <NotificationHeader>
            <CallTypeIndicator callType={callerData.callType}>
              {callerData.callType === 'video' ? <FiVideo /> : <FiPhone />}
            </CallTypeIndicator>
            <CallTypeText>
              Incoming {callerData.callType === 'video' ? 'Video' : 'Voice'} Call
            </CallTypeText>
          </NotificationHeader>

          <CallerSection>
            <CallerAvatar>
              {callerData.name?.charAt(0).toUpperCase() || '?'}
            </CallerAvatar>
            <CallerName>{callerData.name || 'Unknown Caller'}</CallerName>
            <CallingText>is calling you...</CallingText>
          </CallerSection>

          <CallActions>
            <RejectButton onClick={handleReject}>
              <FiPhoneOff />
              <ButtonText>Decline</ButtonText>
            </RejectButton>
            
            <AcceptButton onClick={handleAccept}>
              {callerData.callType === 'video' ? <FiVideo /> : <FiPhone />}
              <ButtonText>Accept</ButtonText>
            </AcceptButton>
          </CallActions>
        </NotificationModal>
      </NotificationOverlay>
    </>
  );
};

// Styled Components
const NotificationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.showAnimation ? 1 : 0};
  transition: opacity 0.3s ease-in-out;
  
  @media (max-width: 768px) {
    background: rgba(0, 0, 0, 0.95);
  }
`;

const NotificationModal = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 350px;
  max-width: 90vw;
  transform: ${props => props.isRinging ? 'scale(1.02)' : 'scale(1)'};
  animation: ${props => props.isRinging ? 'pulse 1s infinite' : 'slideIn 0.3s ease-out'};
  
  @keyframes pulse {
    0%, 100% { 
      transform: scale(1); 
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    50% { 
      transform: scale(1.02); 
      box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
    }
  }
  
  @keyframes slideIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @media (max-width: 768px) {
    min-width: 300px;
    padding: 30px 20px;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const CallTypeIndicator = styled.div`
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

const CallTypeText = styled.span`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const CallerSection = styled.div`
  margin-bottom: 40px;
`;

const CallerAvatar = styled.div`
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

const CallActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 30px;
  
  @media (max-width: 480px) {
    gap: 20px;
  }
`;

const CallButton = styled.button`
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

const AcceptButton = styled(CallButton)`
  background: #00d084;
  color: white;
  
  svg {
    font-size: 24px;
  }
  
  &:hover {
    background: #00b771;
    box-shadow: 0 8px 25px rgba(0, 208, 132, 0.4);
  }
`;

const RejectButton = styled(CallButton)`
  background: #ff4757;
  color: white;
  
  svg {
    font-size: 24px;
  }
  
  &:hover {
    background: #ff3838;
    box-shadow: 0 8px 25px rgba(255, 71, 87, 0.4);
  }
`;

const ButtonText = styled.span`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export default GlobalCallNotification;
