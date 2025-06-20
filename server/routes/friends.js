const {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  getContacts,
  removeFriend,
  checkFriendStatus,
  blockUser,
  unblockUser,
  unfriendUser,
  getBlockedUsers,
} = require("../controllers/friendController");

const router = require("express").Router();

router.post("/send-request", sendFriendRequest);
router.post("/accept-request", acceptFriendRequest);
router.post("/decline-request", declineFriendRequest);
router.get("/requests/:userId", getFriendRequests);
router.get("/friends/:userId", getFriends);
router.get("/contacts/:userId", getContacts);
router.post("/remove-friend", removeFriend);
router.get("/status/:userId/:targetUserId", checkFriendStatus);
router.post("/block-user", blockUser);
router.post("/unblock-user", unblockUser);
router.post("/unfriend-user", unfriendUser);
router.get("/blocked/:userId", getBlockedUsers);

module.exports = router;
