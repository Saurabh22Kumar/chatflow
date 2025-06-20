const {
  login,
  register,
  verifyOTP,
  resendOTP,
  getAllUsers,
  setAvatar,
  logOut,
  checkUsernameAvailability,
  searchUsers,
  deleteAccount,
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  removeContact,
  blockUser,
} = require("../controllers/userController");

const { clearAllChatData } = require("../controllers/adminController");

const router = require("express").Router();

router.post("/login", login);
router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/allusers/:id", getAllUsers);
router.post("/setavatar/:id", setAvatar);
router.get("/logout/:id", logOut);
router.post("/delete-account", deleteAccount);
router.get("/check-username/:username", checkUsernameAvailability);
router.get("/search-users/:userId/:query", searchUsers);
router.post("/remove-contact", removeContact);
router.post("/block-user", blockUser);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset-otp", verifyPasswordResetOTP);
router.post("/reset-password", resetPassword);

// Admin route to clear all chat data
router.post("/admin/clear-chat-data", clearAllChatData);

module.exports = router;
