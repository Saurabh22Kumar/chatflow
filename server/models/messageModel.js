const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema(
  {
    message: {
      text: { type: String, required: true },
      type: { 
        type: String, 
        enum: ["text", "image", "file", "audio", "video", "voice", "emoji", "call", "call-system"], 
        default: "text" 
      },
      // For file/media messages
      fileUrl: { type: String },
      fileName: { type: String },
      fileSize: { type: Number },
      // For call messages
      callType: { type: String, enum: ["video", "audio"] },
      callDuration: { type: Number }, // in seconds
      callStatus: { type: String, enum: ["ended", "missed", "rejected", "cancelled"] },
    },
    users: Array,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Enhanced ChatFlow features
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      emoji: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Messages",
    },
    edited: {
      isEdited: {
        type: Boolean,
        default: false,
      },
      editedAt: Date,
      originalText: String,
    },
    metadata: {
      sentiment: {
        type: String,
        enum: ["positive", "negative", "neutral"],
      },
      language: String,
      priority: {
        type: String,
        enum: ["low", "normal", "high"],
        default: "normal",
      },
    },
    // Self-destructing messages
    expiresAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    // WhatsApp-style deletion
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    deletedForEveryone: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
MessageSchema.index({ users: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Messages", MessageSchema);
