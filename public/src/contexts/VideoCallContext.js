import React, { createContext, useContext, useState, useCallback } from 'react';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const startCall = useCallback((contact, callType = 'video') => {
    setCallData({ contact, callType });
    setIsInCall(true);
  }, []);

  const endCall = useCallback(() => {
    setIsInCall(false);
    setCallData(null);
    setIncomingCall(null);
  }, []);

  const receiveCall = useCallback((callerData) => {
    setIncomingCall(callerData);
  }, []);

  const acceptCall = useCallback(() => {
    if (incomingCall) {
      setCallData({
        contact: { _id: incomingCall.from, username: incomingCall.name },
        callType: incomingCall.callType,
        isIncoming: true,
        signal: incomingCall.signal
      });
      setIsInCall(true);
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const rejectCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const value = {
    isInCall,
    callData,
    incomingCall,
    startCall,
    endCall,
    receiveCall,
    acceptCall,
    rejectCall
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

export default VideoCallContext;
