const CallHistory = require("../models/callHistoryModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// Save a new call record
module.exports.saveCall = async (req, res, next) => {
  try {
    const { 
      callerId, 
      receiverId, 
      callType, 
      status, 
      duration = 0,
      startedAt,
      endedAt,
      quality = "good",
      technicalInfo = {}
    } = req.body;

    console.log('Received call save request:', { callerId, receiverId, callType, status });
    console.log('Full request body:', req.body);

    // Validate required fields
    if (!callerId || !receiverId || !callType || !status) {
      console.log('Missing required fields:', { callerId, receiverId, callType, status });
      return res.status(400).json({ 
        msg: "Missing required fields", 
        status: false 
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(callerId)) {
      console.log('Invalid callerId ObjectId:', callerId);
      return res.status(400).json({ 
        msg: "Invalid caller ID format", 
        status: false 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      console.log('Invalid receiverId ObjectId:', receiverId);
      return res.status(400).json({ 
        msg: "Invalid receiver ID format", 
        status: false 
      });
    }

    // Verify users exist
    const caller = await User.findById(callerId);
    const receiver = await User.findById(receiverId);
    
    if (!caller || !receiver) {
      console.log('Invalid user IDs:', { caller: !!caller, receiver: !!receiver });
      return res.json({ 
        msg: "Invalid user IDs", 
        status: false 
      });
    }

    // Generate conversation ID
    const conversationId = CallHistory.generateConversationId(callerId, receiverId);

    // Create call record
    const callRecord = await CallHistory.create({
      participants: {
        caller: callerId,
        receiver: receiverId,
      },
      callType,
      status,
      duration,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      endedAt: endedAt ? new Date(endedAt) : null,
      quality,
      conversationId,
      technicalInfo,
    });

    console.log('Call record created:', callRecord._id);

    // Populate participants for response
    const populatedCall = await CallHistory.findById(callRecord._id)
      .populate('participants.caller', 'username avatarImage')
      .populate('participants.receiver', 'username avatarImage');

    return res.json({ 
      status: true, 
      call: populatedCall,
      msg: "Call saved successfully" 
    });
  } catch (ex) {
    console.error("Save call error:", ex);
    console.error("Error stack:", ex.stack);
    console.error("Request body that caused error:", req.body);
    return res.status(500).json({ 
      msg: "Failed to save call", 
      status: false,
      error: ex.message 
    });
  }
};

// Get call history for a user
module.exports.getCallHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, callType, status } = req.query;

    if (!userId) {
      return res.json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    // Build filter
    const filter = {
      $or: [
        { "participants.caller": userId },
        { "participants.receiver": userId }
      ]
    };

    if (callType) {
      filter.callType = callType;
    }

    if (status) {
      filter.status = status;
    }

    // Get total count
    const totalCalls = await CallHistory.countDocuments(filter);

    // Get paginated results
    const calls = await CallHistory.find(filter)
      .populate('participants.caller', 'username avatarImage')
      .populate('participants.receiver', 'username avatarImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Process calls to add user-specific information
    const processedCalls = calls.map(call => {
      const isCallerCurrentUser = call.participants.caller._id.toString() === userId;
      const otherParticipant = isCallerCurrentUser 
        ? call.participants.receiver 
        : call.participants.caller;

      return {
        _id: call._id,
        callType: call.callType,
        status: call.status,
        duration: call.calculatedDuration,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        quality: call.quality,
        isIncoming: !isCallerCurrentUser,
        isOutgoing: isCallerCurrentUser,
        contact: {
          _id: otherParticipant._id,
          username: otherParticipant.username,
          avatarImage: otherParticipant.avatarImage,
        },
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      };
    });

    return res.json({
      status: true,
      calls: processedCalls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCalls / limit),
        totalCalls,
        hasNextPage: page < Math.ceil(totalCalls / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (ex) {
    console.error("Get call history error:", ex);
    next(ex);
  }
};

// Get call history between two specific users
module.exports.getCallHistoryBetweenUsers = async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!userId1 || !userId2) {
      return res.json({ 
        msg: "Both user IDs are required", 
        status: false 
      });
    }

    const conversationId = CallHistory.generateConversationId(userId1, userId2);

    const filter = { conversationId };

    // Get total count
    const totalCalls = await CallHistory.countDocuments(filter);

    // Get paginated results
    const calls = await CallHistory.find(filter)
      .populate('participants.caller', 'username avatarImage')
      .populate('participants.receiver', 'username avatarImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return res.json({
      status: true,
      calls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCalls / limit),
        totalCalls,
        hasNextPage: page < Math.ceil(totalCalls / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (ex) {
    console.error("Get call history between users error:", ex);
    next(ex);
  }
};

// Update call status (e.g., when call ends)
module.exports.updateCallStatus = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const { status, endedAt, duration, quality, technicalInfo } = req.body;

    if (!callId) {
      return res.json({ 
        msg: "Call ID is required", 
        status: false 
      });
    }

    const updateData = {};
    
    if (status) updateData.status = status;
    if (endedAt) updateData.endedAt = new Date(endedAt);
    if (duration !== undefined) updateData.duration = duration;
    if (quality) updateData.quality = quality;
    if (technicalInfo) updateData.technicalInfo = technicalInfo;

    const updatedCall = await CallHistory.findByIdAndUpdate(
      callId,
      updateData,
      { new: true }
    ).populate('participants.caller', 'username avatarImage')
     .populate('participants.receiver', 'username avatarImage');

    if (!updatedCall) {
      return res.json({ 
        msg: "Call record not found", 
        status: false 
      });
    }

    return res.json({ 
      status: true, 
      call: updatedCall,
      msg: "Call updated successfully" 
    });
  } catch (ex) {
    console.error("Update call status error:", ex);
    next(ex);
  }
};

// Get call statistics for a user
module.exports.getCallStats = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { period = 'month' } = req.query; // 'week', 'month', 'year'

    if (!userId) {
      return res.json({ 
        msg: "User ID is required", 
        status: false 
      });
    }

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'year':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), 0, 1)
          }
        };
        break;
      default: // month
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth(), 1)
          }
        };
    }

    const baseFilter = {
      $or: [
        { "participants.caller": userId },
        { "participants.receiver": userId }
      ],
      ...dateFilter
    };

    // Aggregate statistics
    const stats = await CallHistory.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          videoCalls: {
            $sum: { $cond: [{ $eq: ["$callType", "video"] }, 1, 0] }
          },
          audioCalls: {
            $sum: { $cond: [{ $eq: ["$callType", "audio"] }, 1, 0] }
          },
          missedCalls: {
            $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] }
          },
          answeredCalls: {
            $sum: { $cond: [{ $eq: ["$status", "answered"] }, 1, 0] }
          },
          rejectedCalls: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          },
          averageDuration: { $avg: "$duration" },
        }
      }
    ]);

    const result = stats[0] || {
      totalCalls: 0,
      totalDuration: 0,
      videoCalls: 0,
      audioCalls: 0,
      missedCalls: 0,
      answeredCalls: 0,
      rejectedCalls: 0,
      averageDuration: 0,
    };

    return res.json({
      status: true,
      stats: {
        ...result,
        period,
        totalDurationFormatted: formatDuration(result.totalDuration),
        averageDurationFormatted: formatDuration(Math.round(result.averageDuration || 0)),
      },
    });
  } catch (ex) {
    console.error("Get call stats error:", ex);
    next(ex);
  }
};

// Delete call history records for current user only (hide from their view)
module.exports.deleteCallHistoryForMe = async (req, res, next) => {
  try {
    const { callHistoryIds, userId } = req.body;
    
    if (!callHistoryIds || !Array.isArray(callHistoryIds) || callHistoryIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "Call History IDs array is required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID is required" 
      });
    }

    console.log(`Deleting ${callHistoryIds.length} call history records for user ${userId} (delete for me)`);

    // Add userId to deletedFor array for each call history record
    // We'll add a deletedFor field to the CallHistory model
    const updateResult = await CallHistory.updateMany(
      { _id: { $in: callHistoryIds } },
      { $addToSet: { deletedFor: userId } }
    );

    console.log(`Updated ${updateResult.modifiedCount} call history records`);

    res.json({
      success: true,
      msg: "Call history deleted for you successfully",
      deletedCount: updateResult.modifiedCount
    });
  } catch (ex) {
    console.error('Error deleting call history for user:', ex);
    next(ex);
  }
};

// Delete call history records for everyone (hard delete)
module.exports.deleteCallHistoryForEveryone = async (req, res, next) => {
  try {
    const { callHistoryIds, userId } = req.body;
    
    if (!callHistoryIds || !Array.isArray(callHistoryIds) || callHistoryIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: "Call History IDs array is required" 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID is required" 
      });
    }

    console.log(`Deleting ${callHistoryIds.length} call history records for everyone by user ${userId}`);

    // Hard delete call history records where the user is either caller or receiver
    const deleteResult = await CallHistory.deleteMany({
      _id: { $in: callHistoryIds },
      $or: [
        { 'participants.caller': userId },
        { 'participants.receiver': userId }
      ]
    });

    console.log(`Deleted ${deleteResult.deletedCount} call history records`);

    res.json({
      success: true,
      msg: "Call history deleted for everyone successfully",
      deletedCount: deleteResult.deletedCount,
      callHistoryIds: callHistoryIds
    });
  } catch (ex) {
    console.error('Error deleting call history for everyone:', ex);
    next(ex);
  }
};

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
