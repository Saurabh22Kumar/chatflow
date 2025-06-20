// Load environment variables
require('dotenv').config();

const { sendOTPEmail } = require('./utils/emailService');

async function testResendWithCorrectDomain() {
  console.log('🧪 Testing Resend email with correct domain...\n');
  console.log(`🔧 EMAIL_SERVICE: ${process.env.EMAIL_SERVICE}`);
  console.log(`🔧 EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`🔧 RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Set' : 'Not set'}\n`);
  
  try {
    const testEmail = 'myidis2203@gmail.com';
    const testOTP = '123456';
    const testUsername = 'testuser';
    
    console.log(`📧 Sending test email to: ${testEmail}`);
    console.log(`🔑 OTP: ${testOTP}`);
    console.log(`👤 Username: ${testUsername}\n`);
    
    const result = await sendOTPEmail(testEmail, testOTP, testUsername);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Email ID: ${result.emailId}`);
      console.log('🎉 Check your inbox!');
    } else {
      console.log('❌ Email sending failed:');
      console.log(`Error: ${result.error}`);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:');
    console.error(error);
  }
}

testResendWithCorrectDomain();
