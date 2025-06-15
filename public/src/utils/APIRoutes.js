// ChatFlow API Routes Configuration
const isProduction = process.env.NODE_ENV === 'production';

// API Base URL - automatically detects environment
export const host = isProduction 
  ? process.env.REACT_APP_API_URL || window.location.origin
  : process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Authentication Routes
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;

// Message Routes
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;

// Health Check
export const healthRoute = `${host}/api/health`;

// WebSocket URL for real-time features
export const socketHost = isProduction 
  ? process.env.REACT_APP_SOCKET_URL || window.location.origin
  : "http://localhost:5001";
