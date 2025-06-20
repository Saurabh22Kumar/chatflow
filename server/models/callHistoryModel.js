const mongoose = require("mongoose");

const CallHistorySchema = mongoose.Schema(
  {
    participants: {
      caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
      receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    },
    callType: {
      type: String,
      enum: ["video", "audio"],
      required: true,
    },
    status: {
      type: String,
      enum: ["missed", "rejected", "answered", "ended", "failed", "outgoing", "incoming"],
      required: true,
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    // Additional metadata
    quality: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      default: "good",
    },
    // For grouping calls between same participants
    conversationId: {
      type: String,
      required: true,
    },
    // Network and technical info
    technicalInfo: {
      networkType: String,
      averageBitrate: Number,
      packetsLost: Number,
      connectionType: String,
    },
    // Deletion tracking (similar to messages)
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
CallHistorySchema.index({ "participants.caller": 1, createdAt: -1 });
CallHistorySchema.index({ "participants.receiver": 1, createdAt: -1 });
CallHistorySchema.index({ conversationId: 1, createdAt: -1 });
CallHistorySchema.index({ status: 1 });
CallHistorySchema.index({ callType: 1 });

// Virtual for calculating call duration if not set
CallHistorySchema.virtual('calculatedDuration').get(function() {
  if (this.duration) return this.duration;
  if (this.endedAt && this.startedAt) {
    return Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  return 0;
});

// Method to generate conversation ID between two users
CallHistorySchema.statics.generateConversationId = function(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

module.exports = mongoose.model("CallHistory", CallHistorySchema);
