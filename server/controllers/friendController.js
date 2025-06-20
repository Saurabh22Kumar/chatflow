const User = require("../models/userModel");
const Messages = require("../models/messageModel");

// Send a friend request
module.exports.sendFriendRequest = async (req, res, next) => {
  try {
    const { fromUserId, toUserId } = req.body;
    
    // Validation
    if (!fromUserId || !toUserId) {
      return res.json({ 
        status: false, 
        msg: "Both user IDs are required" 
      });
    }
    
    if (fromUserId === toUserId) {
      return res.json({ 
        status: false, 
        msg: "Cannot send friend request to yourself" 
      });
    }
    
    // Check if users exist
    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findById(toUserId);
    
    if (!fromUser || !toUser) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if they're already friends
    if (fromUser.friends.includes(toUserId)) {
      return res.json({ 
        status: false, 
        msg: "You are already friends with this user" 
      });
    }
    
    // Check if request already sent
    const alreadySent = fromUser.friendRequestsSent.some(
      request => request.user.toString() === toUserId
    );
    
    if (alreadySent) {
      return res.json({ 
        status: false, 
        msg: "Friend request already sent" 
      });
    }
    
    // Check if user is blocked
    const isBlocked = fromUser.blockedUsers.some(
      blocked => blocked.user.toString() === toUserId
    ) || toUser.blockedUsers.some(
      blocked => blocked.user.toString() === fromUserId
    );
    
    if (isBlocked) {
      return res.json({ 
        status: false, 
        msg: "Cannot send friend request to this user" 
      });
    }
    
    // Add to sender's sent requests
    fromUser.friendRequestsSent.push({
      user: toUserId,
      sentAt: new Date()
    });
    
    // Add to receiver's received requests
    toUser.friendRequestsReceived.push({
      user: fromUserId,
      sentAt: new Date()
    });
    
    await fromUser.save();
    await toUser.save();

    // Emit real-time notification via Socket.IO if user is online
    const recipientSocketId = global.onlineUsers && global.onlineUsers.get(toUserId);
    if (recipientSocketId && global.io) {
      global.io.to(recipientSocketId).emit("friend-request-received", {
        from: {
          _id: fromUser._id,
          username: fromUser.username,
          email: fromUser.email,
          avatarImage: fromUser.avatarImage
        },
        timestamp: new Date().toISOString()
      });
      console.log(`Friend request notification sent to user ${toUserId}`);
    }
    
    return res.json({ 
      status: true, 
      msg: "Friend request sent successfully" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Accept a friend request
module.exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { userId, requesterId } = req.body;
    
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);
    
    if (!user || !requester) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if request exists
    const requestExists = user.friendRequestsReceived.some(
      request => request.user.toString() === requesterId
    );
    
    if (!requestExists) {
      return res.json({ 
        status: false, 
        msg: "Friend request not found" 
      });
    }
    
    // Add to friends list
    user.friends.push(requesterId);
    requester.friends.push(userId);
    
    // Remove from requests
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      request => request.user.toString() !== requesterId
    );
    
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      request => request.user.toString() !== userId
    );
    
    await user.save();
    await requester.save();

    // Emit real-time notification to requester if online
    const requesterSocketId = global.onlineUsers && global.onlineUsers.get(requesterId);
    if (requesterSocketId && global.io) {
      global.io.to(requesterSocketId).emit("friend-request-response", {
        type: "accepted",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatarImage: user.avatarImage
        },
        timestamp: new Date().toISOString()
      });
      console.log(`Friend request accepted notification sent to user ${requesterId}`);
    }
    
    return res.json({ 
      status: true, 
      msg: "Friend request accepted" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Decline a friend request
module.exports.declineFriendRequest = async (req, res, next) => {
  try {
    const { userId, requesterId } = req.body;
    
    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);
    
    if (!user || !requester) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Remove from requests
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      request => request.user.toString() !== requesterId
    );
    
    requester.friendRequestsSent = requester.friendRequestsSent.filter(
      request => request.user.toString() !== userId
    );
    
    await user.save();
    await requester.save();

    // Emit real-time notification to requester if online
    const requesterSocketId = global.onlineUsers && global.onlineUsers.get(requesterId);
    if (requesterSocketId && global.io) {
      global.io.to(requesterSocketId).emit("friend-request-response", {
        type: "declined",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatarImage: user.avatarImage
        },
        timestamp: new Date().toISOString()
      });
      console.log(`Friend request declined notification sent to user ${requesterId}`);
    }
    
    return res.json({ 
      status: true, 
      msg: "Friend request declined" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Get friend requests (received)
module.exports.getFriendRequests = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('friendRequestsReceived.user', 'username avatarImage isAvatarImageSet profile')
      .populate('friendRequestsSent.user', 'username avatarImage isAvatarImageSet profile');
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    return res.json({ 
      status: true, 
      received: user.friendRequestsReceived,
      sent: user.friendRequestsSent
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Get friends list
module.exports.getFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('friends', 'username avatarImage isAvatarImageSet profile activity');
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Return ALL friends regardless of hidden status
    // Hidden contacts should only be filtered from chat/contacts list, not friends list
    return res.json({ 
      status: true, 
      friends: user.friends 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Remove friend
module.exports.removeFriend = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!user || !friend) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Remove from both friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);
    
    await user.save();
    await friend.save();
    
    return res.json({ 
      status: true, 
      msg: "Friend removed successfully" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Check friend request status
module.exports.checkFriendStatus = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if friends
    const isFriend = user.friends.includes(targetUserId);
    
    // Check if request sent
    const requestSent = user.friendRequestsSent.some(
      request => request.user.toString() === targetUserId
    );
    
    // Check if request received
    const requestReceived = user.friendRequestsReceived.some(
      request => request.user.toString() === targetUserId
    );
    
    let relationshipStatus = 'none';
    if (isFriend) relationshipStatus = 'friend';
    else if (requestSent) relationshipStatus = 'request_sent';
    else if (requestReceived) relationshipStatus = 'request_received';
    
    return res.json({ 
      status: true, 
      relationshipStatus,
      isFriend,
      requestSent,
      requestReceived
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Block a user
module.exports.blockUser = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!userId || !targetUserId) {
      return res.json({ 
        status: false, 
        msg: "Both user IDs are required" 
      });
    }
    
    if (userId === targetUserId) {
      return res.json({ 
        status: false, 
        msg: "Cannot block yourself" 
      });
    }
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!user || !targetUser) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if already blocked
    const alreadyBlocked = user.blockedUsers.some(
      blocked => blocked.user.toString() === targetUserId
    );
    
    if (alreadyBlocked) {
      return res.json({ 
        status: false, 
        msg: "User is already blocked" 
      });
    }
    
    // Remove from friends if they are friends
    user.friends = user.friends.filter(
      friendId => friendId.toString() !== targetUserId
    );
    targetUser.friends = targetUser.friends.filter(
      friendId => friendId.toString() !== userId
    );
    
    // Remove any pending friend requests between them
    user.friendRequestsSent = user.friendRequestsSent.filter(
      request => request.user.toString() !== targetUserId
    );
    user.friendRequestsReceived = user.friendRequestsReceived.filter(
      request => request.user.toString() !== targetUserId
    );
    targetUser.friendRequestsSent = targetUser.friendRequestsSent.filter(
      request => request.user.toString() !== userId
    );
    targetUser.friendRequestsReceived = targetUser.friendRequestsReceived.filter(
      request => request.user.toString() !== userId
    );
    
    // Add to blocked list
    user.blockedUsers.push({
      user: targetUserId,
      blockedAt: new Date()
    });
    
    // Delete all messages between these users
    await Messages.deleteMany({
      $or: [
        { users: { $all: [userId, targetUserId] } },
        { users: { $all: [targetUserId, userId] } }
      ]
    });
    
    await user.save();
    await targetUser.save();
    
    // Emit real-time notification to both users if online
    const userSocketId = global.onlineUsers && global.onlineUsers.get(userId);
    const targetSocketId = global.onlineUsers && global.onlineUsers.get(targetUserId);
    
    if (userSocketId && global.io) {
      global.io.to(userSocketId).emit("chat-deleted", {
        targetUserId: targetUserId,
        reason: "blocked"
      });
    }
    
    if (targetSocketId && global.io) {
      global.io.to(targetSocketId).emit("chat-deleted", {
        targetUserId: userId,
        reason: "blocked"
      });
    }
    
    return res.json({ 
      status: true, 
      msg: "User blocked successfully and all chats deleted" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Unblock a user
module.exports.unblockUser = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!userId || !targetUserId) {
      return res.json({ 
        status: false, 
        msg: "Both user IDs are required" 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if user is blocked
    const isBlocked = user.blockedUsers.some(
      blocked => blocked.user.toString() === targetUserId
    );
    
    if (!isBlocked) {
      return res.json({ 
        status: false, 
        msg: "User is not blocked" 
      });
    }
    
    // Remove from blocked list
    user.blockedUsers = user.blockedUsers.filter(
      blocked => blocked.user.toString() !== targetUserId
    );
    
    await user.save();
    
    return res.json({ 
      status: true, 
      msg: "User unblocked successfully" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Unfriend a user and delete chat history
module.exports.unfriendUser = async (req, res, next) => {
  try {
    const { userId, friendId } = req.body;
    
    if (!userId || !friendId) {
      return res.json({ 
        status: false, 
        msg: "Both user IDs are required" 
      });
    }
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!user || !friend) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Check if they are actually friends
    const isFriend = user.friends.includes(friendId);
    
    if (!isFriend) {
      return res.json({ 
        status: false, 
        msg: "You are not friends with this user" 
      });
    }
    
    // Remove from friends list
    user.friends = user.friends.filter(
      id => id.toString() !== friendId
    );
    friend.friends = friend.friends.filter(
      id => id.toString() !== userId
    );
    
    // Delete all messages between these users
    await Messages.deleteMany({
      $or: [
        { users: { $all: [userId, friendId] } },
        { users: { $all: [friendId, userId] } }
      ]
    });
    
    await user.save();
    await friend.save();
    
    // Emit real-time notification to both users if online
    const userSocketId = global.onlineUsers && global.onlineUsers.get(userId);
    const friendSocketId = global.onlineUsers && global.onlineUsers.get(friendId);
    
    if (userSocketId && global.io) {
      global.io.to(userSocketId).emit("chat-deleted", {
        targetUserId: friendId,
        reason: "unfriended"
      });
    }
    
    if (friendSocketId && global.io) {
      global.io.to(friendSocketId).emit("chat-deleted", {
        targetUserId: userId,
        reason: "unfriended"
      });
    }
    
    return res.json({ 
      status: true, 
      msg: "User unfriended successfully and all chats deleted" 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Get blocked users
module.exports.getBlockedUsers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('blockedUsers.user', 'username email avatarImage profile')
      .select('blockedUsers');
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    const blockedUsers = user.blockedUsers.map(blocked => ({
      _id: blocked.user._id,
      username: blocked.user.username,
      email: blocked.user.email,
      avatarImage: blocked.user.avatarImage,
      profile: blocked.user.profile,
      blockedAt: blocked.blockedAt
    }));
    
    return res.json({ 
      status: true, 
      blockedUsers 
    });
    
  } catch (ex) {
    next(ex);
  }
};

// Get contacts (visible friends for chat interface)
module.exports.getContacts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('friends', 'username avatarImage isAvatarImageSet profile activity');
    
    if (!user) {
      return res.json({ 
        status: false, 
        msg: "User not found" 
      });
    }
    
    // Filter out hidden contacts from the contacts list (for chat interface)
    const visibleContacts = user.friends.filter(friend => {
      const isHidden = user.hiddenContacts.some(hidden => 
        hidden.user.toString() === friend._id.toString()
      );
      return !isHidden;
    });
    
    return res.json({ 
      status: true, 
      friends: visibleContacts 
    });
    
  } catch (ex) {
    next(ex);
  }
};
