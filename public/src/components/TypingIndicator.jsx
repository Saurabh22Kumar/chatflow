import React from 'react';
import styled, { keyframes } from 'styled-components';

const typing = keyframes`
  0%, 60%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
`;

const TypingContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 20px;
  margin: 5px 0;
  width: fit-content;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 3px;
  margin-left: 8px;
  
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--primary-color);
    animation: ${typing} 1.4s infinite;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

const UserInfo = styled.span`
  font-size: 12px;
  color: var(--text-secondary-color);
  font-weight: 500;
`;

const TypingIndicator = ({ username }) => {
  return (
    <TypingContainer>
      <UserInfo>{username} is typing</UserInfo>
      <TypingDots>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </TypingDots>
    </TypingContainer>
  );
};

export default TypingIndicator;
