#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/auth';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'newPassword123';

async function testPasswordResetFlow() {
  console.log('🔄 Testing Password Reset Flow...\n');

  try {
    // Step 1: Request password reset
    console.log('1️⃣ Requesting password reset OTP...');
    const forgotResponse = await axios.post(`${API_BASE}/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log('✅ Forgot password response:', forgotResponse.data);
    
    if (!forgotResponse.data.status) {
      console.log('❌ Failed to send password reset OTP');
      return;
    }

    // Step 2: Try with wrong OTP
    console.log('\n2️⃣ Testing with wrong OTP...');
    const wrongOtpResponse = await axios.post(`${API_BASE}/verify-password-reset-otp`, {
      email: TEST_EMAIL,
      otp: '123456'
    });
    
    console.log('✅ Wrong OTP response:', wrongOtpResponse.data);

    // Step 3: Try reset password without verification (should fail)
    console.log('\n3️⃣ Testing password reset without OTP verification...');
    try {
      const resetResponse = await axios.post(`${API_BASE}/reset-password`, {
        email: TEST_EMAIL,
        newPassword: TEST_PASSWORD
      });
      console.log('❌ Unexpected success:', resetResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('✅ Expected failure:', error.response.data);
      } else {
        console.log('✅ Expected failure: No valid reset token');
      }
    }

    console.log('\n🎉 Password reset flow test completed!');
    console.log('\n📝 Manual Testing Steps:');
    console.log('1. Open http://localhost:3000/login');
    console.log('2. Click "Forgot Password?" link');
    console.log('3. Enter a valid email address and click "Send Reset Code"');
    console.log('4. Check email for OTP and enter it');
    console.log('5. Set new password and confirm');
    console.log('6. Try logging in with the new password');
    console.log('\n📱 In-App Testing Steps:');
    console.log('1. Login to the app');
    console.log('2. Click user avatar → Settings');
    console.log('3. Go to Account → Account Settings');
    console.log('4. Click "Change Password"');
    console.log('5. Follow the OTP verification process');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPasswordResetFlow();
