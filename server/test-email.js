const nodemailer = require('nodemailer');
require('dotenv').config();

// Test email configuration
async function testEmailSetup() {
  console.log('🧪 Testing email configuration...');
  
  try {
    // Create transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify connection
    console.log('📡 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: {
        name: 'ChatFlow Test',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'ChatFlow Email Test - Success!',
      html: `
        <h2>🎉 Email Configuration Successful!</h2>
        <p>Your ChatFlow email setup is working perfectly.</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Service:</strong> Gmail via Nodemailer</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is a test email from your ChatFlow application.</p>
      `,
      text: 'ChatFlow Email Test - Success! Your email configuration is working.'
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your inbox for the test email');
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error(error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure 2-Factor Authentication is enabled');
      console.log('2. Use App Password, not your regular Gmail password');
      console.log('3. Check EMAIL_USER and EMAIL_PASS in .env file');
    }
  }
}

// Run the test
testEmailSetup();
