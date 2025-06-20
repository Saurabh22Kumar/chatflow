// ChatFlow API Routes Configuration
const isProduction = process.env.NODE_ENV === 'production';

// API Base URL - automatically detects environment
export const host = isProduction 
  ? process.env.REACT_APP_API_URL || window.location.origin
  : process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Authentication Routes
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const verifyOTPRoute = `${host}/api/auth/verify-otp`;
export const resendOTPRoute = `${host}/api/auth/resend-otp`;
export const logoutRoute = `${host}/api/auth/logout`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const setAvatarRoute = `${host}/api/auth/setavatar`;
export const deleteAccountRoute = `${host}/api/auth/delete-account`;
export const checkUsernameRoute = `${host}/api/auth/check-username`;
export const searchUsersRoute = `${host}/api/auth/search-users`;

// Password Reset Routes
export const forgotPasswordRoute = `${host}/api/auth/forgot-password`;
export const verifyPasswordResetOTPRoute = `${host}/api/auth/verify-password-reset-otp`;
export const resetPasswordRoute = `${host}/api/auth/reset-password`;

// User Status Routes
export const onlineUsersRoute = `${host}/api/users/online`;

// Message Routes
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;
export const updateMessageDeliveredRoute = `${host}/api/messages/delivered`;
export const updateMessageReadRoute = `${host}/api/messages/read`;
export const getUnreadCountsRoute = `${host}/api/messages/unread-counts`;
export const deleteChatRoute = `${host}/api/messages/delete-chat`;

export const removeContactRoute = `${host}/api/auth/remove-contact`;
export const blockUserAPIRoute = `${host}/api/auth/block-user`;
export const deleteMessageForMeRoute = `${host}/api/messages/delete-for-me`;
export const deleteMessageForEveryoneRoute = `${host}/api/messages/delete-for-everyone`;

// File Upload Routes
export const uploadPhotoRoute = `${host}/api/files/upload-photo`;
export const uploadFileRoute = `${host}/api/files/upload-file`;

// Friend Request Routes
export const sendFriendRequestRoute = `${host}/api/friends/send-request`;
export const acceptFriendRequestRoute = `${host}/api/friends/accept-request`;
export const declineFriendRequestRoute = `${host}/api/friends/decline-request`;
export const getFriendRequestsRoute = `${host}/api/friends/requests`;
export const getFriendsRoute = `${host}/api/friends/friends`;
export const getContactsRoute = `${host}/api/friends/contacts`;
export const removeFriendRoute = `${host}/api/friends/remove-friend`;
export const checkFriendStatusRoute = `${host}/api/friends/status`;
export const blockUserRoute = `${host}/api/friends/block-user`;
export const unblockUserRoute = `${host}/api/friends/unblock-user`;
export const unfriendUserRoute = `${host}/api/friends/unfriend-user`;
export const getBlockedUsersRoute = `${host}/api/friends/blocked`;

// Call History Routes
export const saveCallRoute = `${host}/api/calls/save`;
export const getCallHistoryRoute = `${host}/api/calls/user`;
export const getCallHistoryBetweenUsersRoute = `${host}/api/calls/between`;
export const updateCallStatusRoute = `${host}/api/calls/update`;
export const getCallStatsRoute = `${host}/api/calls/stats`;
export const deleteCallHistoryForMeRoute = `${host}/api/calls/delete-for-me`;
export const deleteCallHistoryForEveryoneRoute = `${host}/api/calls/delete-for-everyone`;

// Health Check
export const healthRoute = `${host}/api/health`;

// WebSocket URL for real-time features
export const socketHost = isProduction 
  ? process.env.REACT_APP_SOCKET_URL || window.location.origin
  : "http://localhost:5001";
