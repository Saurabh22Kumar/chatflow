const { Resend } = require('resend');

// Email configuration
const createResendClient = () => {
  return new Resend(process.env.RESEND_API_KEY);
};

// Fallback to Nodemailer for other services (if needed)
const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Gmail configuration (fallback)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // SMTP configuration (fallback)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  try {
    // Use Resend for email sending
    if (process.env.EMAIL_SERVICE === 'resend') {
      const resend = createResendClient();
      
      const { data, error } = await resend.emails.send({
        from: `ChatFlow <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'ChatFlow - Email Verification',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ChatFlow - Email Verification</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
                text-align: center;
              }
              .otp-container {
                background: #f8f9fa;
                border: 2px dashed #6c757d;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
              }
              .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              @media (max-width: 600px) {
                .container { margin: 10px; }
                .header { padding: 20px; }
                .content { padding: 30px 20px; }
                .otp-code { font-size: 28px; letter-spacing: 4px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚀 ChatFlow</h1>
                <p>Email Verification Required</p>
              </div>
              
              <div class="content">
                <h2>Welcome to ChatFlow, ${username}! 👋</h2>
                <p>We're excited to have you join our community. To complete your registration, please verify your email address using the code below:</p>
                
                <div class="otp-container">
                  <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Verification Code</div>
                  <div class="otp-code">${otp}</div>
                </div>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This code expires in <strong>10 minutes</strong> for your security.
                </div>
                
                <p>If you didn't create an account with ChatFlow, you can safely ignore this email.</p>
              </div>
              
              <div class="footer">
                <p>This email was sent to ${email}</p>
                <p>ChatFlow - Connecting People, One Message at a Time</p>
                <p style="margin-top: 15px;">
                  <strong>Need help?</strong> Contact us at support@chatflow.com
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to ChatFlow, ${username}!

Your verification code is: ${otp}

Please enter this code to complete your registration. This code expires in 10 minutes.

If you didn't create an account with ChatFlow, you can safely ignore this email.

---
ChatFlow - Connecting People, One Message at a Time
        `.trim()
      });

      if (error) {
        console.error('Resend email error:', error);
        throw new Error(`Failed to send email via Resend: ${error.message}`);
      }

      console.log('✅ OTP email sent successfully via Resend:', data.id);
      return { success: true, messageId: data.id };
    }
    
    // Fallback to Nodemailer for other services
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ChatFlow',
        address: process.env.EMAIL_USER || 'onboarding@resend.dev'
      },
      to: email,
      subject: 'ChatFlow - Email Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ChatFlow - Email Verification</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-container {
              background: #f8f9fa;
              border: 2px dashed #6c757d;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              text-align: center;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .warning {
              color: #dc3545;
              font-size: 14px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 ChatFlow</h1>
              <p>Welcome to the future of communication!</p>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Thank you for signing up for ChatFlow. To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-container">
                <div class="otp-code">${otp}</div>
                <p><strong>Your verification code</strong></p>
              </div>
              
              <p>Enter this code in the ChatFlow app to verify your email and activate your account.</p>
              
              <div class="warning">
                ⏱️ This code will expire in 10 minutes for security reasons.
              </div>
            </div>
            <div class="footer">
              <p>If you didn't request this verification code, please ignore this email.</p>
              <p>© 2025 ChatFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to ChatFlow!
        
        Hi ${username},
        
        Thank you for signing up for ChatFlow. To complete your registration, please verify your email address using the OTP code below:
        
        Verification Code: ${otp}
        
        Enter this code in the ChatFlow app to verify your email and activate your account.
        
        This code will expire in 10 minutes for security reasons.
        
        If you didn't request this verification code, please ignore this email.
        
        © 2025 ChatFlow. All rights reserved.
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email after successful registration
const sendWelcomeEmail = async (email, username) => {
  try {
    // Use Resend for email sending
    if (process.env.EMAIL_SERVICE === 'resend') {
      const resend = createResendClient();
      
      const { data, error } = await resend.emails.send({
        from: `ChatFlow <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'Welcome to ChatFlow! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ChatFlow</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #00ff88 0%, #667eea 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              .content {
                padding: 40px 30px;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
              }
              .feature {
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
              }
              .feature-icon {
                font-size: 40px;
                margin-bottom: 10px;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
              }
              @media (max-width: 600px) {
                .container { margin: 10px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .features { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to ChatFlow!</h1>
                <p>Your account has been successfully created</p>
              </div>
              
              <div class="content">
                <h2>Hello ${username}! 👋</h2>
                <p>Congratulations! Your ChatFlow account has been successfully created and verified. You're now part of our amazing community of users connecting and sharing across the globe.</p>
                
                <div class="features">
                  <div class="feature">
                    <div class="feature-icon">💬</div>
                    <h3>Real-time Messaging</h3>
                    <p>Connect instantly with friends and family through our lightning-fast messaging platform.</p>
                  </div>
                  <div class="feature">
                    <div class="feature-icon">🔒</div>
                    <h3>Secure & Private</h3>
                    <p>Your conversations are protected with end-to-end encryption and advanced security features.</p>
                  </div>
                  <div class="feature">
                    <div class="feature-icon">🌟</div>
                    <h3>Modern Experience</h3>
                    <p>Enjoy a beautiful, intuitive interface designed for the best user experience.</p>
                  </div>
                </div>
                
                <p style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">
                    Start Chatting Now 🚀
                  </a>
                </p>
                
                <p><strong>What's next?</strong></p>
                <ul>
                  <li>Set up your profile and avatar</li>
                  <li>Find and connect with friends</li>
                  <li>Start your first conversation</li>
                  <li>Explore ChatFlow's amazing features</li>
                </ul>
                
                <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
              </div>
              
              <div class="footer">
                <p>Welcome aboard, ${username}!</p>
                <p>ChatFlow - Connecting People, One Message at a Time</p>
                <p style="margin-top: 15px;">
                  <strong>Need help?</strong> Contact us at support@chatflow.com
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to ChatFlow, ${username}! 🎉

Congratulations! Your ChatFlow account has been successfully created and verified.

What's next?
- Set up your profile and avatar
- Find and connect with friends  
- Start your first conversation
- Explore ChatFlow's amazing features

Start chatting: ${process.env.FRONTEND_URL || 'http://localhost:3000'}

Need help? Contact us at support@chatflow.com

---
ChatFlow - Connecting People, One Message at a Time
        `.trim()
      });

      if (error) {
        console.error('Resend welcome email error:', error);
        throw new Error(`Failed to send welcome email via Resend: ${error.message}`);
      }

      console.log('✅ Welcome email sent successfully via Resend:', data.id);
      return { success: true, messageId: data.id };
    }
    
    // Fallback to Nodemailer for other services
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ChatFlow',
        address: process.env.EMAIL_USER || 'onboarding@resend.dev'
      },
      to: email,
      subject: 'Welcome to ChatFlow! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ChatFlow</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #00ff88 0%, #667eea 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px 30px;
              text-align: center;
              color: #6c757d;
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ChatFlow!</h1>
              <p>Your account has been successfully created</p>
            </div>
            <div class="content">
              <h2>Hi ${username}! 👋</h2>
              <p>Congratulations! Your ChatFlow account has been successfully created and verified. You're now ready to connect, chat, and flow with friends and colleagues around the world.</p>
              
              <h3>🚀 What's next?</h3>
              <ul>
                <li>Set up your profile and avatar</li>
                <li>Find and add friends</li>
                <li>Start your first conversation</li>
                <li>Explore our amazing features</li>
              </ul>
              
              <p>Get started by logging into your account and discovering all the amazing features ChatFlow has to offer!</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Start Chatting Now!</a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing ChatFlow - Connect, Chat, Flow</p>
              <p>© 2025 ChatFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset OTP Email
const sendPasswordResetOTPEmail = async (email, otp, username) => {
  try {
    // Use Resend for email sending
    if (process.env.EMAIL_SERVICE === 'resend') {
      const resend = createResendClient();
      
      const { data, error } = await resend.emails.send({
        from: `ChatFlow <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'ChatFlow - Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ChatFlow - Password Reset</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #ff6b6b 0%, #e74c3c 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
                text-align: center;
              }
              .otp-container {
                background: #f8f9fa;
                border: 2px dashed #e74c3c;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
              }
              .otp-code {
                font-size: 36px;
                font-weight: bold;
                color: #e74c3c;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .security-note {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              @media (max-width: 600px) {
                .container { margin: 10px; }
                .header { padding: 20px; }
                .content { padding: 30px 20px; }
                .otp-code { font-size: 28px; letter-spacing: 4px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔒 ChatFlow</h1>
                <p>Password Reset Request</p>
              </div>
                            
              <div class="content">
                <h2>Hi ${username}! 👋</h2>
                <p>We received a request to reset your password. Use the code below to reset your password:</p>
                                
                <div class="otp-container">
                  <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Your Password Reset Code</div>
                  <div class="otp-code">${otp}</div>
                </div>
                                
                <div class="warning">
                  <strong>⏰ Important:</strong> This code expires in <strong>10 minutes</strong> for your security.
                </div>

                <div class="security-note">
                  <strong>🛡️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is still secure.
                </div>
                                
                <p><strong>Never share this code with anyone!</strong> ChatFlow support will never ask for your reset code.</p>
              </div>
                            
              <div class="footer">
                <p>This email was sent to ${email}</p>
                <p>ChatFlow - Connecting People, One Message at a Time</p>
                <p style="margin-top: 15px;">
                  <strong>Need help?</strong> Contact us at support@chatflow.com
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Hi ${username}!

We received a request to reset your password for your ChatFlow account.

Your password reset code is: ${otp}

Please enter this code to reset your password. This code expires in 10 minutes.

If you didn't request this password reset, you can safely ignore this email.

NEVER share this code with anyone! ChatFlow support will never ask for your reset code.

---
ChatFlow - Connecting People, One Message at a Time
        `
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      console.log('Password reset OTP email sent successfully via Resend:', data?.id);
      return { success: true, emailId: data?.id };
    }
    
    // Fallback to Nodemailer for other services
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ChatFlow',
        address: process.env.EMAIL_USER || 'onboarding@resend.dev'
      },
      to: email,
      subject: 'ChatFlow - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ChatFlow - Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #e74c3c 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🔒 ChatFlow</h1>
              <p>Password Reset Request</p>
            </div>
            
            <div style="padding: 40px 30px; text-align: center;">
              <h2>Hi ${username}! 👋</h2>
              <p>We received a request to reset your password. Use the code below:</p>
              
              <div style="background: #f8f9fa; border: 2px dashed #e74c3c; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #e74c3c; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
              </div>
              
              <p style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px;">
                <strong>⏰ Important:</strong> This code expires in <strong>10 minutes</strong>.
              </p>
              
              <p style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px;">
                <strong>🛡️ Security Notice:</strong> If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hi ${username}! We received a request to reset your password. Your reset code is: ${otp}. This code expires in 10 minutes. If you didn't request this, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP email sent successfully via Nodemailer:', result.messageId);
    return { success: true, emailId: result.messageId };

  } catch (error) {
    console.error('Error sending password reset OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset Confirmation Email
const sendPasswordResetConfirmationEmail = async (email, username) => {
  try {
    // Use Resend for email sending
    if (process.env.EMAIL_SERVICE === 'resend') {
      const resend = createResendClient();
      
      const { data, error } = await resend.emails.send({
        from: `ChatFlow <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'ChatFlow - Password Successfully Reset',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ChatFlow - Password Reset Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 30px;
                text-align: center;
              }
              .content {
                padding: 40px 30px;
                text-align: center;
              }
              .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .success-icon {
                font-size: 48px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ ChatFlow</h1>
                <p>Password Reset Successful</p>
              </div>
              
              <div class="content">
                <div class="success-icon">🎉</div>
                <h2>Hi ${username}!</h2>
                <p>Your password has been successfully reset. You can now sign in to ChatFlow with your new password.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p><strong>Stay secure!</strong> 🔐</p>
              </div>
              
              <div class="footer">
                <p>This email was sent to ${email}</p>
                <p>ChatFlow - Connecting People, One Message at a Time</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Hi ${username}! Your ChatFlow password has been successfully reset. You can now sign in with your new password. If you didn't make this change, please contact support immediately.`
      });

      if (error) {
        console.error('Resend error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, emailId: data?.id };
    }
    
    // Fallback to Nodemailer
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ChatFlow',
        address: process.env.EMAIL_USER || 'onboarding@resend.dev'
      },
      to: email,
      subject: 'ChatFlow - Password Successfully Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center;">
            <h1>✅ ChatFlow</h1>
            <p>Password Reset Successful</p>
          </div>
          <div style="padding: 40px 30px; text-align: center;">
            <h2>Hi ${username}!</h2>
            <p>Your password has been successfully reset. You can now sign in with your new password.</p>
            <p>If you didn't make this change, please contact support immediately.</p>
          </div>
        </div>
      `,
      text: `Hi ${username}! Your password has been successfully reset. You can now sign in with your new password.`
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, emailId: result.messageId };

  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetOTPEmail,
  sendPasswordResetConfirmationEmail
};
