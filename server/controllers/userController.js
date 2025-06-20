const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const bcrypt = require("bcrypt");
const { generateSecureOTP, isValidOTP, isOTPExpired, generateOTP } = require("../utils/otpUtils");
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetOTPEmail, sendPasswordResetConfirmationEmail } = require("../utils/emailService");

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    
    delete user.password;
    return res.json({ status: true, user });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.json({ 
        msg: "Username, email, and password are required", 
        status: false 
      });
    }
    
    // Check if username already exists
    const usernameCheck = await User.findOne({ username });
    if (usernameCheck) {
      return res.json({ msg: "Username already used", status: false });
    }
    
    // Check if email already exists
    const emailCheck = await User.findOne({ email });
    if (emailCheck) {
      return res.json({ msg: "Email already used", status: false });
    }
    
    // Clean up any existing OTP records for this email
    await OTP.deleteMany({ email: email.toLowerCase() });
    
    // Hash password for storage in OTP record
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP
    const otp = generateSecureOTP();
    
    // Create OTP record with user data
    const otpRecord = await OTP.create({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      userData: {
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });
    
    // Send OTP email
    await sendOTPEmail(email, otp, username);
    
    return res.json({ 
      status: true, 
      msg: "Verification code sent to your email", 
      requiresOTP: true,
      email: email.toLowerCase()
    });
  } catch (ex) {
    console.error("Registration error:", ex);
    return res.json({ 
      msg: "Registration failed. Please try again.", 
      status: false 
    });
  }
};

module.exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    // Validate required fields
    if (!email || !otp) {
      return res.json({ 
        msg: "Email and OTP are required", 
        status: false 
      });
    }
    
    // Validate OTP format
    if (!isValidOTP(otp)) {
      return res.json({ 
        msg: "Invalid OTP format", 
        status: false 
      });
    }
    
    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      type: 'registration',
      isUsed: false 
    });
    
    if (!otpRecord) {
      return res.json({ 
        msg: "Invalid or expired verification code", 
        status: false 
      });
    }
    
    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.json({ 
        msg: "Verification code has expired. Please request a new one.", 
        status: false,
        expired: true
      });
    }
    
    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.json({ 
        msg: "Maximum verification attempts exceeded. Please request a new code.", 
        status: false,
        maxAttemptsExceeded: true
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await OTP.updateOne(
        { _id: otpRecord._id },
        { $inc: { attempts: 1 } }
      );
      
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return res.json({ 
        msg: `Invalid verification code. ${remainingAttempts} attempts remaining.`, 
        status: false,
        remainingAttempts
      });
    }
    
    // OTP is valid, create user account
    const { userData } = otpRecord;
    
    // Double-check that username and email are still available
    const usernameCheck = await User.findOne({ username: userData.username });
    if (usernameCheck) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.json({ 
        msg: "Username is no longer available", 
        status: false 
      });
    }
    
    const emailCheck = await User.findOne({ email: userData.email });
    if (emailCheck) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.json({ 
        msg: "Email is no longer available", 
        status: false 
      });
    }
    
    // Create user account
    const user = await User.create({
      email: userData.email,
      username: userData.username,
      password: userData.password,
    });
    
    // Mark OTP as used and delete it
    await OTP.deleteOne({ _id: otpRecord._id });
    
    // Send welcome email
    try {
      await sendWelcomeEmail(userData.email, userData.username);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if welcome email fails
    }
    
    // Remove password from response
    const userResponse = { ...user._doc };
    delete userResponse.password;
    
    return res.json({ 
      status: true, 
      user: userResponse,
      msg: "Account created successfully! Welcome to ChatFlow!"
    });
  } catch (ex) {
    console.error("OTP verification error:", ex);
    return res.json({ 
      msg: "Verification failed. Please try again.", 
      status: false 
    });
  }
};

module.exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!email) {
      return res.json({ 
        msg: "Email is required", 
        status: false 
      });
    }
    
    // Find existing OTP record
    const existingOTP = await OTP.findOne({ 
      email: email.toLowerCase(), 
      type: 'registration',
      isUsed: false 
    });
    
    if (!existingOTP) {
      return res.json({ 
        msg: "No pending verification found. Please start registration again.", 
        status: false 
      });
    }
    
    // Check if it's too soon to resend (prevent spam)
    const timeSinceCreated = Date.now() - existingOTP.createdAt.getTime();
    const minResendInterval = 60 * 1000; // 1 minute
    
    if (timeSinceCreated < minResendInterval) {
      const waitTime = Math.ceil((minResendInterval - timeSinceCreated) / 1000);
      return res.json({ 
        msg: `Please wait ${waitTime} seconds before requesting a new code`, 
        status: false,
        waitTime
      });
    }
    
    // Generate new OTP
    const newOTP = generateSecureOTP();
    
    // Update existing record with new OTP and reset attempts
    await OTP.updateOne(
      { _id: existingOTP._id },
      { 
        otp: newOTP, 
        attempts: 0, 
        createdAt: new Date() 
      }
    );
    
    // Send new OTP email
    await sendOTPEmail(email, newOTP, existingOTP.userData.username);
    
    return res.json({ 
      status: true, 
      msg: "New verification code sent to your email"
    });
  } catch (ex) {
    console.error("Resend OTP error:", ex);
    return res.json({ 
      msg: "Failed to resend verification code. Please try again.", 
      status: false 
    });
  }
};

module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ _id: { $ne: req.params.id } }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const avatarImage = req.body.image;
    const userData = await User.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};

module.exports.checkUsernameAvailability = async (req, res, next) => {
  try {
    const { username } = req.params;

    // Basic validation
    if (!username || username.length < 3) {
      return res.json({
        available: false,
        msg: "Username must be at least 3 characters long",
      });
    }

    if (username.length > 20) {
      return res.json({
        available: false,
        msg: "Username must be less than 20 characters",
      });
    }

    // Check for valid characters (alphanumeric and underscore only)
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!validUsernameRegex.test(username)) {
      return res.json({
        available: false,
        msg: "Username can only contain letters, numbers, and underscores",
      });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.json({
        available: false,
        msg: "Username is already taken",
      });
    }

    return res.json({
      available: true,
      msg: "Username is available!",
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.params;
    const { userId } = req.params; // Current user ID to exclude from results
    
    // Basic validation
    if (!query || query.length < 2) {
      return res.json({ 
        users: [], 
        msg: "Search query must be at least 2 characters long" 
      });
    }
    
    // Search for users by username (case-insensitive, partial match)
    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        { username: { $regex: searchRegex } } // Match username
      ]
    }).select([
      "username",
      "email", 
      "avatarImage",
      "isAvatarImageSet",
      "profile.firstName",
      "profile.lastName",
      "profile.statusMessage",
      "_id"
    ]).limit(20); // Limit results to 20 users
    
    return res.json({ 
      users, 
      msg: `Found ${users.length} user(s)` 
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.deleteAccount = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ msg: "User not found", status: false });
    }
    
    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ msg: "Incorrect password", status: false });
    }
    
    // HARD DELETE: Permanently remove all user data
    console.log(`🗑️ Starting hard delete for user: ${user.username} (${userId})`);
    
    // Import required models for cleanup
    const Message = require("../models/messageModel");
    
    try {
      // 1. Delete all messages sent by this user
      const deletedMessages = await Message.deleteMany({ 
        $or: [
          { "users.0": userId },
          { "users.1": userId }
        ]
      });
      console.log(`📧 Deleted ${deletedMessages.deletedCount} messages`);
      
      // 2. Remove user from other users' friend lists
      const friendUpdates = await User.updateMany(
        { friends: userId },
        { $pull: { friends: userId } }
      );
      console.log(`👥 Removed from ${friendUpdates.modifiedCount} friend lists`);
      
      // 3. Remove user from friend requests (sent and received)
      const friendRequestUpdates = await User.updateMany(
        { 
          $or: [
            { "friendRequestsSent.user": userId },
            { "friendRequestsReceived.user": userId }
          ]
        },
        { 
          $pull: { 
            friendRequestsSent: { user: userId },
            friendRequestsReceived: { user: userId }
          }
        }
      );
      console.log(`📝 Cleaned ${friendRequestUpdates.modifiedCount} friend request records`);
      
      // 4. Remove from blocked users lists
      const blockedUpdates = await User.updateMany(
        { "blockedUsers.user": userId },
        { $pull: { blockedUsers: { user: userId } } }
      );
      console.log(`🚫 Removed from ${blockedUpdates.modifiedCount} blocked lists`);
      
      // 5. Finally, delete the user account permanently
      await User.findByIdAndDelete(userId);
      console.log(`✅ User account permanently deleted: ${user.username}`);
      
      return res.json({ 
        status: true, 
        msg: "Account and all associated data permanently deleted" 
      });
      
    } catch (cleanupError) {
      console.error("Error during data cleanup:", cleanupError);
      // If cleanup fails, still try to delete the user account
      await User.findByIdAndDelete(userId);
      return res.json({ 
        status: true, 
        msg: "Account deleted (some associated data may remain)" 
      });
    }
    
  } catch (ex) {
    console.error("Delete account error:", ex);
    return res.json({ 
      msg: "Failed to delete account. Please try again.", 
      status: false 
    });
  }
};

// Password Reset Controllers

// Forgot Password - Send OTP to email
module.exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ 
        msg: "Email is required", 
        status: false 
      });
    }

    // Check if user exists with this email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ 
        msg: "No account found with this email address", 
        status: false 
      });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database (use password reset type)
    await OTP.findOneAndUpdate(
      { email },
      { 
        email, 
        otp, 
        expiresAt: otpExpiry,
        attempts: 0,
        type: 'password_reset' // Different type for password reset
      },
      { upsert: true, new: true }
    );

    // Send OTP email
    const emailResult = await sendPasswordResetOTPEmail(email, otp, user.username);
    
    if (!emailResult.success) {
      return res.json({ 
        msg: "Failed to send OTP email. Please try again.", 
        status: false 
      });
    }

    res.json({
      status: true,
      msg: "Password reset code sent to your email",
      email: email
    });

  } catch (ex) {
    next(ex);
  }
};

// Verify Password Reset OTP
module.exports.verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.json({ 
        msg: "Email and OTP are required", 
        status: false 
      });
    }

    // Find OTP record for password reset
    const otpRecord = await OTP.findOne({ 
      email, 
      type: 'password_reset' 
    });

    if (!otpRecord) {
      return res.json({ 
        msg: "No password reset request found for this email", 
        status: false 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ email, type: 'password_reset' });
      return res.json({ 
        msg: "Password reset code has expired. Please request a new one.", 
        status: false,
        expired: true 
      });
    }

    // Check if maximum attempts exceeded
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ email, type: 'password_reset' });
      return res.json({ 
        msg: "Maximum attempts exceeded. Please request a new password reset code.", 
        status: false,
        maxAttemptsExceeded: true 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();
      
      const remainingAttempts = 5 - otpRecord.attempts;
      return res.json({ 
        msg: `Invalid code. ${remainingAttempts} attempts remaining.`, 
        status: false,
        remainingAttempts 
      });
    }

    // OTP is valid - generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset token
    await User.findOneAndUpdate(
      { email },
      { 
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry 
      }
    );

    // Delete the OTP record
    await OTP.deleteOne({ email, type: 'password_reset' });

    res.json({
      status: true,
      msg: "Password reset code verified successfully",
      resetToken: resetToken
    });

  } catch (ex) {
    next(ex);
  }
};

// Reset Password with token
module.exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.json({ 
        msg: "Email, reset token, and new password are required", 
        status: false 
      });
    }

    if (newPassword.length < 8) {
      return res.json({ 
        msg: "Password should be equal or greater than 8 characters", 
        status: false 
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      email,
      passwordResetToken: resetToken,
      passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.json({ 
        msg: "Invalid or expired reset token", 
        status: false 
      });
    }

    // Hash new password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await User.findOneAndUpdate(
      { email },
      { 
        password: encryptedPassword,
        $unset: { 
          passwordResetToken: 1,
          passwordResetExpiry: 1 
        }
      }
    );

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(email, user.username);
    } catch (emailError) {
      console.log('Failed to send confirmation email:', emailError);
      // Don't fail the password reset if email fails
    }

    res.json({
      status: true,
      msg: "Password reset successfully! You can now login with your new password."
    });

  } catch (ex) {
    next(ex);
  }
};

// Remove contact from user's friend list (for delete chat)
module.exports.removeContact = async (req, res, next) => {
  try {
    const { userId, contactId } = req.body;
    
    if (!userId || !contactId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID and Contact ID are required" 
      });
    }

    console.log(`Removing contact relationship between ${userId} and ${contactId}`);

    // Remove each user from the other's friends list
    const user1Update = await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: contactId } },
      { new: true }
    );

    const user2Update = await User.findByIdAndUpdate(
      contactId,
      { $pull: { friends: userId } },
      { new: true }
    );

    if (!user1Update || !user2Update) {
      return res.status(404).json({
        success: false,
        msg: "One or both users not found"
      });
    }

    console.log(`Contact relationship removed successfully`);

    res.json({
      success: true,
      msg: "Contact removed successfully"
    });
  } catch (ex) {
    console.error('Error removing contact:', ex);
    next(ex);
  }
};

// Block/unblock user functionality
module.exports.blockUser = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!userId || !targetUserId) {
      return res.status(400).json({ 
        success: false, 
        msg: "User ID and Target User ID are required" 
      });
    }

    // Check if user is already blocked
    const user = await User.findById(userId);
    const isBlocked = user.blockedUsers.some(blocked => blocked.user.toString() === targetUserId);

    if (isBlocked) {
      // Unblock user
      await User.findByIdAndUpdate(
        userId,
        { $pull: { blockedUsers: { user: targetUserId } } }
      );
      
      res.json({
        success: true,
        msg: "User unblocked successfully",
        isBlocked: false
      });
    } else {
      // Block user
      await User.findByIdAndUpdate(
        userId,
        { 
          $push: { 
            blockedUsers: { 
              user: targetUserId, 
              blockedAt: new Date() 
            } 
          },
          $pull: { friends: targetUserId } // Remove from friends when blocking
        }
      );

      // Remove current user from target user's friends list
      await User.findByIdAndUpdate(
        targetUserId,
        { $pull: { friends: userId } }
      );
      
      res.json({
        success: true,
        msg: "User blocked successfully",
        isBlocked: true
      });
    }
  } catch (ex) {
    console.error('Error blocking/unblocking user:', ex);
    next(ex);
  }
};
