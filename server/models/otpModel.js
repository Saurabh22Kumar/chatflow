const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['registration', 'password_reset'],
    default: 'registration',
  },
  userData: {
    username: {
      type: String,
      required: function() {
        return this.type === 'registration';
      },
    },
    email: {
      type: String,
      required: function() {
        return this.type === 'registration';
      },
    },
    password: {
      type: String,
      required: function() {
        return this.type === 'registration';
      }, // This will be hashed
    },
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Maximum 5 verification attempts
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

// Index for faster queries
otpSchema.index({ email: 1, type: 1, isUsed: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
