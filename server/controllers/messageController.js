const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      // Check if message is deleted for this user
      const isDeletedForUser = msg.deletedFor.includes(from);
      
      // If deleted for everyone, show placeholder
      if (msg.deletedForEveryone) {
        return {
          _id: msg._id,
          fromSelf: msg.sender.toString() === from,
          message: '🚫 This message was deleted',
          messageType: 'deleted',
          status: msg.status,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          deletedForEveryone: true
        };
      }
      
      // If deleted for this user, don't include in response
      if (isDeletedForUser) {
        return null;
      }

      return {
        _id: msg._id,
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
        messageType: msg.message.type || 'text',
        fileUrl: msg.message.fileUrl,
        fileName: msg.message.fileName,
        fileSize: msg.message.fileSize,
        callType: msg.message.callType,
        callDuration: msg.message.callDuration,
        callStatus: msg.message.callStatus,
        status: msg.status,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      };
    }).filter(msg => msg !== null); // Remove null entries

    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

// Delete entire chat between two users and remove from contacts
module.exports.deleteChat = async (req, res, next) => {
  try {
    const { userId, contactId } = req.body;
    
    if (!userId || !contactId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID and Contact ID are required" 
      });
    }

    console.log(`Deleting chat between ${userId} and ${contactId}`);

    // Delete all messages between the two users (hard delete)
    const deleteResult = await Messages.deleteMany({
      users: {
        $all: [userId, contactId],
      },
    });

    console.log(`Deleted ${deleteResult.deletedCount} messages`);

    // Hide contacts from each other's lists while keeping friendship
    const User = require("../models/userModel");
    
    // Add each user to the other's hidden contacts list
    await User.findByIdAndUpdate(
      userId,
      { 
        $addToSet: { 
          hiddenContacts: { 
            user: contactId, 
            hiddenAt: new Date() 
          } 
        } 
      }
    );

    await User.findByIdAndUpdate(
      contactId,
      { 
        $addToSet: { 
          hiddenContacts: { 
            user: userId, 
            hiddenAt: new Date() 
          } 
        } 
      }
    );

    console.log(`Hidden contacts from each other's lists while keeping friendship`);

    res.json({
      success: true,
      msg: "Chat deleted successfully",
      deletedMessagesCount: deleteResult.deletedCount
    });
  } catch (ex) {
    console.error('Error deleting chat:', ex);
    next(ex);
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    
    // Handle different message types
    let messageData = {};
    
    if (typeof message === 'string') {
      // Simple text message (backward compatibility)
      messageData = { text: message };
    } else if (typeof message === 'object') {
      // Complex message with type and additional data
      messageData = {
        text: message.text,
        type: message.type || 'text',
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        callType: message.callType,
        callDuration: message.callDuration,
        callStatus: message.callStatus
      };
    }
    
    // Check if users had hidden each other and restore visibility
    const User = require("../models/userModel");
    
    // Remove from hidden contacts if they exist there
    await User.findByIdAndUpdate(
      from,
      { $pull: { hiddenContacts: { user: to } } }
    );
    
    await User.findByIdAndUpdate(
      to,
      { $pull: { hiddenContacts: { user: from } } }
    );
    
    const data = await Messages.create({
      message: messageData,
      users: [from, to],
      sender: from,
      status: "sent", // Default status when message is created
    });

    if (data) return res.json({ 
      msg: "Message added successfully.",
      messageId: data._id,
      status: data.status 
    });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

// Update message status to 'delivered'
module.exports.updateMessageDelivered = async (req, res, next) => {
  try {
    const { messageIds, to } = req.body;
    
    await Messages.updateMany(
      { 
        _id: { $in: messageIds },
        users: { $in: [to] },
        status: "sent"
      },
      { status: "delivered" }
    );

    res.json({ msg: "Messages marked as delivered" });
  } catch (ex) {
    next(ex);
  }
};

// Update message status to 'read'
module.exports.updateMessageRead = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    
    await Messages.updateMany(
      { 
        users: { $all: [from, to] },
        sender: from,
        status: { $in: ["sent", "delivered"] }
      },
      { status: "read" }
    );

    res.json({ msg: "Messages marked as read" });
  } catch (ex) {
    next(ex);
  }
};

// Delete messages for current user only (hide from their view)
module.exports.deleteMessageForMe = async (req, res, next) => {
  try {
    const { messageIds, userId } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "Message IDs array is required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID is required" 
      });
    }

    console.log(`Deleting ${messageIds.length} messages for user ${userId} (delete for me)`);

    // Add userId to deletedFor array for each message
    const updateResult = await Messages.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deletedFor: userId } }
    );

    console.log(`Updated ${updateResult.modifiedCount} messages`);

    res.json({
      success: true,
      msg: "Messages deleted for you successfully",
      deletedCount: updateResult.modifiedCount
    });
  } catch (ex) {
    console.error('Error deleting messages for user:', ex);
    next(ex);
  }
};

// Delete messages for everyone (hard delete)
module.exports.deleteMessageForEveryone = async (req, res, next) => {
  try {
    const { messageIds, userId } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "Message IDs array is required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID is required" 
      });
    }

    console.log(`Deleting ${messageIds.length} messages for everyone by user ${userId}`);

    // Mark messages as deleted for everyone
    const updateResult = await Messages.updateMany(
      { 
        _id: { $in: messageIds },
        sender: userId  // Only allow deleting own messages for everyone
      },
      { 
        $set: { 
          deletedForEveryone: true,
          'message.text': '🚫 This message was deleted'
        }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} messages`);

    res.json({
      success: true,
      msg: "Messages deleted for everyone successfully",
      deletedCount: updateResult.modifiedCount,
      messageIds: messageIds
    });
  } catch (ex) {
    console.error('Error deleting messages for everyone:', ex);
    next(ex);
  }
};

// Get unread message counts for all contacts
module.exports.getUnreadCounts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID is required" 
      });
    }

    // Get unread message counts for each contact
    const unreadCounts = await Messages.aggregate([
      {
        // Match messages where the user is the recipient and status is not 'read'
        $match: {
          users: { $in: [userId] },
          sender: { $ne: userId }, // Messages not sent by the user
          status: { $in: ["sent", "delivered"] }, // Not read yet
          deletedFor: { $nin: [userId] }, // Not deleted by the user
          deletedForEveryone: { $ne: true } // Not deleted for everyone
        }
      },
      {
        // Get the other user (sender) in the conversation
        $addFields: {
          otherUser: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$users",
                  cond: { $ne: ["$$this", userId] }
                }
              },
              0
            ]
          }
        }
      },
      {
        // Group by the other user and count unread messages
        $group: {
          _id: "$otherUser",
          unreadCount: { $sum: 1 }
        }
      }
    ]);

    // Convert to a more convenient format
    const unreadCountsMap = {};
    unreadCounts.forEach(item => {
      unreadCountsMap[item._id] = item.unreadCount;
    });

    res.json({
      success: true,
      unreadCounts: unreadCountsMap
    });
  } catch (ex) {
    console.error('Error getting unread counts:', ex);
    next(ex);
  }
};
