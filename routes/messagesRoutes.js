const express = require("express");
const router = express.Router();
const { postMessage, viewMessage, updateMessageStatus, deleteMessage, sendReplyMessage } = require("../controller/messagesController");

// Public route to post a message
router.post("/contact", postMessage);
// Protected route to view messages (admin only)
router.get("/messages", viewMessage);
router.put("/messages/:id/status", updateMessageStatus);
router.delete("/messages/:id", deleteMessage);
router.patch("/messages/:id/reply", sendReplyMessage);

module.exports = router;