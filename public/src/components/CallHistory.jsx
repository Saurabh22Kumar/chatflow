import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiPhone, FiVideo, FiClock, FiPhoneCall, FiPhoneIncoming, FiPhoneOutgoing, FiPhoneMissed, FiX, FiRefreshCw } from 'react-icons/fi';
import { getCallHistoryRoute, getCallStatsRoute } from '../utils/APIRoutes';

const CallHistory = ({ isOpen, onClose, currentUser, contact = null }) => {
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'video', 'audio', 'missed'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadCallHistory();
      loadCallStats();
    }
  }, [isOpen, currentUser, filter]);

  const loadCallHistory = async (pageNum = 1, append = false) => {
    if (!currentUser?._id) return;
    
    try {
      setLoading(true);
      
      const params = {
        page: pageNum,
        limit: 20,
      };
      
      if (filter !== 'all') {
        if (filter === 'missed') {
          params.status = 'missed';
        } else {
          params.callType = filter;
        }
      }

      // If contact is specified, get calls between specific users
      const url = contact 
        ? `${getCallHistoryRoute.replace('/user', '/between')}/${currentUser._id}/${contact._id}`
        : `${getCallHistoryRoute}/${currentUser._id}`;

      const response = await axios.get(url, { params });
      
      if (response.data.status) {
        const newCalls = response.data.calls;
        setCalls(append ? prev => [...prev, ...newCalls] : newCalls);
        setHasMore(response.data.pagination.hasNextPage);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCallStats = async () => {
    if (!currentUser?._id) return;
    
    try {
      const response = await axios.get(`${getCallStatsRoute}/${currentUser._id}`, {
        params: { period: 'month' }
      });
      
      if (response.data.status) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading call stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCallHistory(1, false);
    await loadCallStats();
    setRefreshing(false);
  };

  const loadMoreCalls = () => {
    if (!loading && hasMore) {
      loadCallHistory(page + 1, true);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (callDate.getTime() === today.getTime()) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (callDate.getTime() === yesterday.getTime()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getCallIcon = (call) => {
    if (call.status === 'missed') {
      return <FiPhoneMissed className="missed" />;
    }
    
    if (call.isIncoming) {
      return call.callType === 'video' ? <FiPhoneIncoming className="incoming" /> : <FiPhoneIncoming className="incoming" />;
    } else {
      return call.callType === 'video' ? <FiPhoneOutgoing className="outgoing" /> : <FiPhoneOutgoing className="outgoing" />;
    }
  };

  const getCallTypeIcon = (callType) => {
    return callType === 'video' ? <FiVideo /> : <FiPhone />;
  };

  const getStatusText = (call) => {
    switch (call.status) {
      case 'missed':
        return 'Missed';
      case 'rejected':
        return 'Rejected';
      case 'answered':
        return call.duration > 0 ? formatDuration(call.duration) : 'Connected';
      case 'ended':
        return call.duration > 0 ? formatDuration(call.duration) : 'Ended';
      default:
        return call.status;
    }
  };

  if (!isOpen) return null;

  return (
    <CallHistoryOverlay>
      <CallHistoryModal>
        <Header>
          <div className="title-section">
            <h2>{contact ? `Call History with ${contact.username}` : 'Call History'}</h2>
            <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </Header>

        {stats && !contact && (
          <StatsSection>
            <StatCard>
              <div className="stat-value">{stats.totalCalls}</div>
              <div className="stat-label">Total Calls</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{stats.totalDurationFormatted}</div>
              <div className="stat-label">Total Time</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{stats.missedCalls}</div>
              <div className="stat-label">Missed</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">{stats.averageDurationFormatted}</div>
              <div className="stat-label">Avg Duration</div>
            </StatCard>
          </StatsSection>
        )}

        <FilterSection>
          <FilterButton 
            active={filter === 'all'} 
            onClick={() => setFilter('all')}
          >
            All
          </FilterButton>
          <FilterButton 
            active={filter === 'video'} 
            onClick={() => setFilter('video')}
          >
            <FiVideo /> Video
          </FilterButton>
          <FilterButton 
            active={filter === 'audio'} 
            onClick={() => setFilter('audio')}
          >
            <FiPhone /> Audio
          </FilterButton>
          <FilterButton 
            active={filter === 'missed'} 
            onClick={() => setFilter('missed')}
          >
            <FiPhoneMissed /> Missed
          </FilterButton>
        </FilterSection>

        <CallsList>
          {loading && calls.length === 0 ? (
            <LoadingState>
              <div className="spinner"></div>
              <p>Loading call history...</p>
            </LoadingState>
          ) : calls.length === 0 ? (
            <EmptyState>
              <FiPhoneCall />
              <h3>No calls yet</h3>
              <p>Your call history will appear here</p>
            </EmptyState>
          ) : (
            <>
              {calls
                .filter(call => call && call.contact) // Filter out calls without valid contact data
                .map((call) => (
                <CallItem key={call._id}>
                  <CallIconContainer>
                    {getCallIcon(call)}
                    <CallTypeIcon>
                      {getCallTypeIcon(call.callType)}
                    </CallTypeIcon>
                  </CallIconContainer>
                  
                  <CallDetails>
                    <ContactInfo>
                      <ContactAvatar>
                        {call.contact?.avatarImage ? (
                          <img 
                            src={`data:image/svg+xml;base64,${call.contact.avatarImage}`}
                            alt={call.contact.username || 'User'}
                          />
                        ) : (
                          <div className="default-avatar">
                            {(call.contact?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </ContactAvatar>
                      <div>
                        <ContactName>{call.contact?.username || 'Unknown User'}</ContactName>
                        <CallTime>{formatDate(call.createdAt)}</CallTime>
                      </div>
                    </ContactInfo>
                    
                    <CallStatus status={call.status}>
                      {getStatusText(call)}
                    </CallStatus>
                  </CallDetails>
                </CallItem>
              ))}
              
              {hasMore && (
                <LoadMoreButton onClick={loadMoreCalls} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More'}
                </LoadMoreButton>
              )}
            </>
          )}
        </CallsList>
      </CallHistoryModal>
    </CallHistoryOverlay>
  );
};

// Styled Components
const CallHistoryOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
`;

const CallHistoryModal = styled.div`
  background: var(--surface-color, white);
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--primary-gradient, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  
  .title-section {
    display: flex;
    align-items: center;
    gap: 12px;
    
    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .refresh-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 8px;
      padding: 8px;
      color: white;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
  
  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 24px;
  background: var(--background-secondary, #f8fafc);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div`
  text-align: center;
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color, #667eea);
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 0.75rem;
    color: var(--text-secondary, #6b7280);
    text-transform: uppercase;
    font-weight: 500;
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background: var(--surface-color, white);
`;

const FilterButton = styled.button`
  background: ${props => props.active ? 'var(--primary-color, #667eea)' : 'var(--surface-secondary, #f1f5f9)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary, #6b7280)'};
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.active ? 'var(--primary-dark, #5a67d8)' : 'var(--surface-hover, #e2e8f0)'};
  }
  
  svg {
    font-size: 0.75rem;
  }
`;

const CallsList = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--surface-secondary, #f1f5f9);
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--border-color, #d1d5db);
    border-radius: 3px;
  }
`;

const CallItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light, #f3f4f6);
  transition: background 0.2s;
  
  &:hover {
    background: var(--surface-hover, #f8fafc);
  }
`;

const CallIconContainer = styled.div`
  position: relative;
  margin-right: 16px;
  
  svg {
    font-size: 1.25rem;
    
    &.missed {
      color: #ef4444;
    }
    
    &.incoming {
      color: #10b981;
    }
    
    &.outgoing {
      color: var(--primary-color, #667eea);
    }
  }
`;

const CallTypeIcon = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: var(--surface-color, white);
  border-radius: 50%;
  padding: 2px;
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-color, #e5e7eb);
`;

const CallDetails = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ContactAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .default-avatar {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1rem;
  }
`;

const ContactName = styled.div`
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 2px;
`;

const CallTime = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
`;

const CallStatus = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => {
    switch (props.status) {
      case 'missed': return '#ef4444';
      case 'rejected': return '#f59e0b';
      case 'answered':
      case 'ended': return '#10b981';
      default: return 'var(--text-secondary, #6b7280)';
    }
  }};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: var(--text-secondary, #6b7280);
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color, #e5e7eb);
    border-top: 3px solid var(--primary-color, #667eea);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: var(--text-secondary, #6b7280);
  text-align: center;
  
  svg {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 8px 0;
    color: var(--text-primary, #1f2937);
  }
  
  p {
    margin: 0;
    opacity: 0.7;
  }
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 16px;
  border: none;
  background: var(--surface-secondary, #f8fafc);
  color: var(--primary-color, #667eea);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--surface-hover, #f1f5f9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default CallHistory;
