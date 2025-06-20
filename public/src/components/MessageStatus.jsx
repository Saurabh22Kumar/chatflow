import React from "react";
import styled from "styled-components";

const MessageStatus = ({ status, timestamp, showTimestamp = true }) => {
  const renderStatusIcon = () => {
    switch (status) {
      case "sent":
        return (
          <StatusIcon className="sent">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path
                d="M5.5 7.5L8.5 10.5L14.5 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </StatusIcon>
        );
      case "delivered":
        return (
          <StatusIcon className="delivered">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path
                d="M2 7.5L5 10.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 7.5L9 10.5L15 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </StatusIcon>
        );
      case "read":
        return (
          <StatusIcon className="read">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path
                d="M2 7.5L5 10.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 7.5L9 10.5L15 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </StatusIcon>
        );
      case "sending":
        return (
          <StatusIcon className="sending">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="31.416" 
                strokeDashoffset="31.416"
                className="loading-circle"
              />
            </svg>
          </StatusIcon>
        );
      case "failed":
        return (
          <StatusIcon className="failed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="m15 9-6 6" stroke="currentColor" strokeWidth="2"/>
              <path d="m9 9 6 6" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </StatusIcon>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container>
      {showTimestamp && timestamp && (
        <Timestamp>{formatTime(timestamp)}</Timestamp>
      )}
      {renderStatusIcon()}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  justify-content: flex-end;
`;

const Timestamp = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0.8;
`;

const StatusIcon = styled.div`
  display: flex;
  align-items: center;
  opacity: 0.8;
  
  &.sent {
    color: rgba(255, 255, 255, 0.7);
  }
  
  &.delivered {
    color: rgba(255, 255, 255, 0.8);
  }
  
  &.read {
    color: #4FC3F7; /* WhatsApp blue color for read messages */
  }
  
  &.sending {
    color: rgba(255, 255, 255, 0.6);
    animation: spin 1s linear infinite;
  }
  
  &.failed {
    color: #FF6B6B; /* Red color for failed messages */
  }
  
  svg {
    width: 16px;
    height: 12px;
  }
  
  .loading-circle {
    animation: dash 1.5s ease-in-out infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
`;

export default MessageStatus;
