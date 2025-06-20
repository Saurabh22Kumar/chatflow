const {
  saveCall,
  getCallHistory,
  getCallHistoryBetweenUsers,
  updateCallStatus,
  getCallStats,
  deleteCallHistoryForMe,
  deleteCallHistoryForEveryone,
} = require("../controllers/callHistoryController");

const router = require("express").Router();

// Save a new call record
router.post("/save", saveCall);

// Get call history for a user
router.get("/user/:userId", getCallHistory);

// Get call history between two specific users
router.get("/between/:userId1/:userId2", getCallHistoryBetweenUsers);

// Update call status
router.put("/update/:callId", updateCallStatus);

// Get call statistics for a user
router.get("/stats/:userId", getCallStats);

// Delete call history for current user only
router.post("/delete-for-me", deleteCallHistoryForMe);

// Delete call history for everyone
router.post("/delete-for-everyone", deleteCallHistoryForEveryone);

module.exports = router;
