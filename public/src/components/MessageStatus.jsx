import React from 'react';
import styled from 'styled-components';

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

const StatusIcon = styled.span`
  font-size: 12px;
  color: ${props => {
    switch (props.status) {
      case 'sent': return 'var(--text-secondary-color)';
      case 'delivered': return 'var(--text-secondary-color)';
      case 'read': return 'var(--primary-color)';
      default: return 'var(--text-secondary-color)';
    }
  }};
`;

const Timestamp = styled.span`
  font-size: 10px;
  color: var(--text-secondary-color);
  margin-left: 4px;
`;

const MessageStatus = ({ status, timestamp, showTimestamp = true }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '❌';
      default:
        return '';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <StatusContainer>
      <StatusIcon status={status}>
        {getStatusIcon(status)}
      </StatusIcon>
      {showTimestamp && timestamp && (
        <Timestamp>{formatTime(timestamp)}</Timestamp>
      )}
    </StatusContainer>
  );
};

export default MessageStatus;
