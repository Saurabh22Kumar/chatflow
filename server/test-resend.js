const { Resend } = require('resend');
require('dotenv').config();

// Test Resend email configuration
async function testResendSetup() {
  console.log('🚀 Testing Resend email configuration...');
  
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_your_api_key_here') {
      console.log('❌ Resend API key not configured!');
      console.log('');
      console.log('🔧 Setup Instructions:');
      console.log('1. Go to https://resend.com/api-keys');
      console.log('2. Sign up (free) and create an API key');
      console.log('3. Update your .env file:');
      console.log('   RESEND_API_KEY=re_your_actual_api_key');
      console.log('   EMAIL_FROM=noreply@chatflow.com');
      return;
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Test email address (use your own email for testing)
    const testEmail = 'your-email@example.com'; // Change this to your email
    
    console.log('📧 Sending test OTP email...');
    
    // Send test OTP email
    const otpResult = await resend.emails.send({
      from: `ChatFlow <${process.env.EMAIL_FROM || 'noreply@chatflow.com'}>`,
      to: [testEmail],
      subject: 'ChatFlow - Test OTP Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">🧪 ChatFlow Test Email</h2>
          <p>This is a test email from your ChatFlow application using Resend!</p>
          <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center;">
            <h3>Test OTP Code: <span style="color: #667eea; font-size: 24px;">123456</span></h3>
          </div>
          <p><strong>✅ Success!</strong> Your Resend integration is working perfectly.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Time: ${new Date().toLocaleString()}<br>
            Service: Resend API
          </p>
        </div>
      `,
      text: 'ChatFlow Test Email - Your Resend integration is working! Test OTP: 123456'
    });

    console.log('✅ Test OTP email sent successfully!');
    console.log('📧 Message ID:', otpResult.data.id);
    
    // Send test welcome email
    console.log('📧 Sending test welcome email...');
    
    const welcomeResult = await resend.emails.send({
      from: `ChatFlow <${process.env.EMAIL_FROM || 'noreply@chatflow.com'}>`,
      to: [testEmail],
      subject: 'ChatFlow - Test Welcome Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00ff88;">🎉 Welcome to ChatFlow!</h2>
          <p>This is a test welcome email from your ChatFlow application.</p>
          <p><strong>✅ Success!</strong> Your Resend welcome email is working perfectly.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Time: ${new Date().toLocaleString()}<br>
            Service: Resend API
          </p>
        </div>
      `,
      text: 'Welcome to ChatFlow! This is a test welcome email via Resend.'
    });

    console.log('✅ Test welcome email sent successfully!');
    console.log('📧 Message ID:', welcomeResult.data.id);
    
    console.log('');
    console.log('🎉 Resend Integration Test Complete!');
    console.log('📬 Check your email inbox for both test emails');
    console.log('');
    console.log('🚀 Your ChatFlow app is ready with Resend!');
    console.log('   - Professional email delivery ✅');
    console.log('   - 3,000 emails/month free ✅');
    console.log('   - Better deliverability ✅');
    console.log('   - Analytics dashboard ✅');
    
  } catch (error) {
    console.error('❌ Resend test failed:');
    console.error(error.message);
    
    if (error.message.includes('API key')) {
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure your API key starts with "re_"');
      console.log('2. Check the API key is correctly set in .env');
      console.log('3. Verify the API key is active in Resend dashboard');
    }
    
    if (error.message.includes('domain')) {
      console.log('');
      console.log('💡 Tip: For testing, you can use any email address.');
      console.log('For production, consider verifying your domain in Resend.');
    }
  }
}

// Run the test
testResendSetup();
