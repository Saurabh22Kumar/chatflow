const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    type: String,
    default: "",
  },
  // New ChatFlow features
  profile: {
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 150,
      default: "",
    },
    statusMessage: {
      type: String,
      maxlength: 100,
      default: "Hey there! I'm using ChatFlow 🚀",
    },
    theme: {
      type: String,
      default: "default",
      enum: ["default", "dark", "ocean", "sunset"],
    },
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      default: "en",
    },
    privacy: {
      lastSeenVisible: {
        type: Boolean,
        default: true,
      },
      profilePhotoVisible: {
        type: Boolean,
        default: true,
      },
    },
  },
  activity: {
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
      default: "",
    },
  },
  security: {
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpiry: {
    type: Date,
    default: null,
  },
  
  // Friend Request System
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users'
  }],
  
  friendRequestsSent: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  friendRequestsReceived: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  blockedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Hidden contacts (friends but not shown in contacts list)
  hiddenContacts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    hiddenAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = mongoose.model("Users", userSchema);
