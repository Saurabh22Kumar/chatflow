const { addMessage, getMessages, updateMessageDelivered, updateMessageRead, deleteChat, deleteMessageForMe, deleteMessageForEveryone, getUnreadCounts } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
router.post("/delivered/", updateMessageDelivered);
router.post("/read/", updateMessageRead);
router.get("/unread-counts/:userId", getUnreadCounts);
router.delete("/delete-chat/", deleteChat);
router.post("/delete-for-me/", deleteMessageForMe);
router.post("/delete-for-everyone/", deleteMessageForEveryone);

module.exports = router;
