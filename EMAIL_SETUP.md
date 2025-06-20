# Email + OTP Setup Guide

This guide will help you configure email functionality for the ChatFlow OTP verification system.

## 🚀 Overview

ChatFlow now includes a robust email verification system that requires users to verify their email address with a 6-digit OTP before account creation is finalized. This significantly improves security and ensures valid email addresses.

## 📧 Email Service Configuration

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to Google Account settings
   - Security → 2-Step Verification
   - Enable it if not already enabled

2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate a password
   - Copy the 16-character password

3. **Update Environment Variables**:
   ```bash
   # In server/.env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

### Option 2: Other Email Services

For production, consider using dedicated email services:

#### SendGrid
```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_USER=your_verified_sender@yourdomain.com
```

#### AWS SES
```bash
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
EMAIL_USER=your_verified_sender@yourdomain.com
```

#### Custom SMTP
```bash
EMAIL_SERVICE=smtp
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your_smtp_password
```

## 🔧 Environment Setup

### Server Configuration

Create or update `server/.env` with the following variables:

```bash
# Existing configuration
PORT=5001
MONGO_URL=your_mongodb_connection_string

# Email Configuration for OTP System
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Optional: Custom SMTP settings
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
```

### Frontend Configuration

No additional frontend configuration is required. The API routes are already configured.

## 🧪 Testing the Setup

### 1. Start the Backend
```bash
cd server
npm install
npm start
```

### 2. Start the Frontend
```bash
cd public
npm install
npm start
```

### 3. Test Registration Flow
1. Navigate to `http://localhost:3000/register`
2. Fill in the registration form
3. Submit to receive OTP email
4. Check your email for the 6-digit code
5. Enter the code to complete registration

## 🛡️ Security Features

### OTP System
- **6-digit secure codes** generated with cryptographic randomness
- **10-minute expiration** for security
- **Maximum 5 attempts** per OTP to prevent brute force
- **Rate limiting** on resend requests (60-second cooldown)
- **Automatic cleanup** of expired OTP records

### Email Security
- **HTML and text** email formats for better compatibility
- **Professional templates** with branding
- **Secure password handling** with bcrypt hashing
- **Input validation** for all fields

## 📱 User Experience

### Registration Flow
1. **User enters details** → Username, email, password
2. **Server validates** → Checks uniqueness, sends OTP
3. **User receives email** → Professional OTP email with code
4. **User enters OTP** → 6-digit verification interface
5. **Account created** → Welcome email sent, user logged in

### Features
- **Real-time validation** of username availability
- **Progressive feedback** during registration
- **Accessible OTP input** with auto-focus and paste support
- **Clear error messages** and retry mechanisms
- **Responsive design** for all devices

## 🚨 Troubleshooting

### Common Issues

#### "Authentication failed" error
- Ensure you're using an App Password, not your regular Gmail password
- Verify 2-Factor Authentication is enabled
- Check that the email address is correct

#### "Connection refused" error
- Check your internet connection
- Verify SMTP settings are correct
- Some networks block outbound SMTP connections

#### OTP emails not received
- Check spam/junk folders
- Verify the EMAIL_USER is correct
- Test with a different email address

#### "OTP expired" errors
- OTPs expire after 10 minutes for security
- Request a new OTP if needed
- Check server logs for timing issues

### Debug Mode

Enable debug logging by adding to `server/.env`:
```bash
DEBUG=email,otp
```

This will log detailed information about email sending and OTP generation.

## 🔄 Migration from Old System

If you're upgrading from a system without OTP verification:

1. **Existing users** are not affected - they can continue logging in normally
2. **New registrations** will use the OTP flow
3. **No database migration** is required
4. **Backward compatibility** is maintained

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Refer to the troubleshooting section above

## 🎯 Next Steps

After setting up email verification:

1. Consider implementing password reset via email
2. Add email notifications for important events
3. Implement email preferences for users
4. Set up monitoring for email delivery rates

---

**Note**: For production deployments, always use dedicated email services like SendGrid, AWS SES, or similar services instead of Gmail for better deliverability and reliability.
