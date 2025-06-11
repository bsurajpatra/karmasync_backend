const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Log environment variables
console.log('\n=== Environment Variables ===');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

// Verify email configuration on startup
console.log('Checking email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Email templates
const emailTemplates = {
  otp: (user, otp) => ({
    subject: 'Verify Your KarmaSync Account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background: linear-gradient(135deg, #754ea7, #a770ef);
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              letter-spacing: 5px;
              color: #754ea7;
              margin: 20px 0;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 5px;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeeba;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Verify Your Account</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Thank you for signing up with KarmaSync! To complete your registration, please use the following verification code:</p>
            
            <div class="otp-code">${otp}</div>
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This code will expire in 10 minutes</li>
                <li>If you didn't request this code, please ignore this email</li>
                <li>For security, never share this code with anyone</li>
              </ul>
            </div>
            
            <p>Enter this code in the verification page to complete your registration.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The KarmaSync Team</p>
            <p>© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</p>
          </div>
        </body>
      </html>
    `
  }),
  welcome: (user) => ({
    subject: 'Welcome to KarmaSync! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background: linear-gradient(135deg, #754ea7, #a770ef);
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(135deg, #754ea7, #a770ef);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to KarmaSync!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Welcome to KarmaSync! We're excited to have you on board. 🎉</p>
            <p>With KarmaSync, you can:</p>
            <ul>
              <li>Track your daily activities and productivity</li>
              <li>Create and manage projects</li>
              <li>Monitor your progress with analytics</li>
              <li>Stay organized and focused on your goals</li>
            </ul>
            <p>Get started by logging into your account:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to KarmaSync</a>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The KarmaSync Team</p>
            <p>© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</p>
          </div>
        </body>
      </html>
    `
  }),
  resetPassword: (user, resetUrl) => ({
    subject: 'Reset Your KarmaSync Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background: linear-gradient(135deg, #754ea7, #a770ef);
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              color: white;
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border-radius: 0 0 10px 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(135deg, #754ea7, #a770ef);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeeba;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For security, please check that the link starts with "${process.env.FRONTEND_URL || 'http://localhost:3000'}"</li>
              </ul>
            </div>
            <p>If you don't see the button above, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The KarmaSync Team</p>
            <p>© ${new Date().getFullYear()} KarmaSync. Licensed under the MIT License.</p>
          </div>
        </body>
      </html>
    `
  })
};

exports.signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;
    console.log('Signup request received for:', { fullName, username, email });

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email === email ? 'email' : 'username');
      return res.status(400).json({ 
        message: existingUser.email === email ? 
          'Email already registered' : 
          'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      fullName,
      username,
      email,
      password
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    console.log('New user created:', { id: user._id, email: user.email });

    // Send OTP email
    try {
      console.log('Preparing OTP email for:', email);
      const otpEmail = emailTemplates.otp(user, otp);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: otpEmail.subject,
        html: otpEmail.html
      });
      console.log('OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Don't throw error, continue with signup
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification code.',
      userId: user._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: error.message || 'Error creating user'
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    console.log('OTP verification request for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Send welcome email
    try {
      const welcomeEmail = emailTemplates.welcome(user);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html
      });
      console.log('Welcome email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't throw error, continue with verification
    }

    res.json({ 
      message: 'Email verified successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: error.message || 'Error verifying OTP'
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Resend OTP request for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send new OTP email
    try {
      const otpEmail = emailTemplates.otp(user, otp);
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: otpEmail.subject,
        html: otpEmail.html
      });
      console.log('New OTP email sent successfully to:', user.email);
    } catch (emailError) {
      console.error('Error sending new OTP email:', emailError);
      throw new Error('Failed to send new OTP email');
    }

    res.json({ message: 'New verification code sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: error.message || 'Error resending OTP'
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Error logging in'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request received for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'No account found with this email' });
    }

    console.log('User found:', user.username);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    console.log('Reset token saved for user:', user.username);

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    console.log('Reset URL generated:', resetUrl);

    // Send email using template
    const resetEmail = emailTemplates.resetPassword(user, resetUrl);
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: resetEmail.subject,
        html: resetEmail.html
      });
      console.log('Reset email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);
      throw new Error('Failed to send reset email');
    }

    res.json({ message: 'Password reset instructions sent to your email. Please check your spam folder if you don\'t see it in your inbox.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Error processing password reset'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from your current password' });
    }

    // Update password
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: error.message || 'Error resetting password'
    });
  }
}; 