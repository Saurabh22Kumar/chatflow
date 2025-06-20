const crypto = require('crypto');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a more secure OTP using crypto
const generateSecureOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

// Validate OTP format
const isValidOTP = (otp) => {
  return /^[0-9]{6}$/.test(otp);
};

// Check if OTP is expired (10 minutes)
const isOTPExpired = (createdAt) => {
  const now = new Date();
  const otpTime = new Date(createdAt);
  const diffInMinutes = (now - otpTime) / (1000 * 60);
  return diffInMinutes > 10;
};

// Generate expiry time (10 minutes from now)
const getOTPExpiryTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
};

// Format time remaining for OTP
const getTimeRemaining = (expiryTime) => {
  const now = new Date();
  const diff = expiryTime - now;
  
  if (diff <= 0) return null;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return {
    minutes,
    seconds,
    total: diff
  };
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  isValidOTP,
  isOTPExpired,
  getOTPExpiryTime,
  getTimeRemaining
};
