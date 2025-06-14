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
  welcome: (user) => ({
    subject: 'Welcome to KarmaSync!',
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
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
            .feature-list {
              margin: 20px 0;
              padding-left: 20px;
            }
            .feature-list li {
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to KarmaSync!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Welcome to KarmaSync - Your Collaborative Workspace for Smarter Project Management!</p>
            <p>KarmaSync is a modern, lightweight project management tool built for teams and individuals to stay organized, productive, and in sync. Whether you're working solo or managing a group project, KarmaSync helps you plan tasks, track progress, and collaborate effectively — all in one streamlined dashboard.</p>
            
            <h3>🚀 Key Features</h3>
            <ul class="feature-list">
              <li>📁 Create and manage multiple projects</li>
              <li>👥 Collaborate with team members via roles (Project Manager, Developer)</li>
              <li>🗂️ Track tasks in a visual Kanban board (To Do, Doing, Done)</li>
              <li>🧩 Assign tasks with deadlines, type (tech/design), and comments</li>
              <li>📝 Maintain a personal daily to-do list for productivity</li>
            </ul>
            
            <p>We're excited to have you on board! If you have any questions or need assistance, feel free to reach out to our support team.</p>
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
                <li>If you didn't request this reset, please ignore this email</li>
                <li>For security, never share this link with anyone</li>
              </ul>
            </div>
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

// Store temporary user data
const tempUserData = new Map();

// Check username availability
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    console.log('Checking username availability:', username);

    if (!username || username.length < 3) {
      return res.status(400).json({ 
        available: false,
        message: 'Username must be at least 3 characters long'
      });
    }

    if (username.length > 20) {
      return res.status(400).json({
        available: false,
        message: 'Username cannot be more than 20 characters'
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({
        available: false,
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      });
    }

    const existingUser = await User.findOne({ username: username });
    
    res.json({
      available: !existingUser,
      message: existingUser ? 'Username is already taken' : 'Username is available'
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ message: 'Server error while checking username' });
  }
};

// Check email availability
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Checking email availability:', email);

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({
        available: false,
        message: 'Please enter a valid email address'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      available: !existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Server error while checking email' });
  }
};

exports.signup = async (req, res) => {
  try {
    const { fullName, username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store user data temporarily with OTP
    tempUserData.set(email, {
      fullName,
      username,
      email,
      password,
      otp,
      otpExpiry
    });

    // Send OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - KarmaSync',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to KarmaSync!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thank you for signing up. To complete your registration, please use the following OTP to verify your email address:
          </p>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            This OTP will expire in 5 minutes. If you didn't request this verification, please ignore this email.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} KarmaSync. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent successfully. Please check your email to verify your account.',
      email
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error in signup process' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Get temporary user data
    const userData = tempUserData.get(email);

    if (!userData) {
      return res.status(400).json({ message: 'Invalid or expired OTP request' });
    }

    // Check if OTP is valid and not expired
    if (userData.otp !== otp || userData.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Create new user
    const newUser = new User({
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      isVerified: true
    });

    await newUser.save();

    // Clear temporary data
    tempUserData.delete(email);

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to KarmaSync!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Welcome to KarmaSync!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thank you for verifying your email. Your account has been successfully created and is ready to use.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login to Your Account
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            If you have any questions or need assistance, feel free to contact our support team.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} KarmaSync. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'Email verified successfully. You can now login to your account.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Error in OTP verification process' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Get temporary user data
    const userData = tempUserData.get(email);

    if (!userData) {
      return res.status(400).json({ message: 'No pending verification found for this email' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update temporary data with new OTP
    tempUserData.set(email, {
      ...userData,
      otp,
      otpExpiry
    });

    // Send new OTP email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New OTP for Email Verification - KarmaSync',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
          <h2 style="color: #333; text-align: center; margin-bottom: 20px;">New OTP for KarmaSync</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Here is your new OTP to verify your email address:
          </p>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            This OTP will expire in 5 minutes. If you didn't request this verification, please ignore this email.
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} KarmaSync. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'New OTP sent successfully. Please check your email.',
      email
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Error in resending OTP' });
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
    const { token } = req.params;
    const { password } = req.body;

    console.log('Reset password request received for token:', token);

    // Find user with valid reset token
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if new password is same as old password
    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword) {
      console.log('New password is same as current password');
      return res.status(400).json({ message: 'New password must be different from your current password' });
    }

    // Update password
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    console.log('Password reset successful for user:', user.email);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: error.message || 'Error resetting password'
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    console.log('getCurrentUser - Request headers:', req.headers);
    console.log('getCurrentUser - User from request:', req.user);
    
    const userId = req.user.userId || req.user.id;
    console.log('getCurrentUser - User ID:', userId);
    
    const user = await User.findById(userId).select('-password');
    console.log('getCurrentUser - Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    } : 'No user found');

    if (!user) {
      console.log('getCurrentUser - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    console.error('getCurrentUser - Error:', error);
    console.error('getCurrentUser - Error stack:', error.stack);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('updateProfile - Request body:', req.body);
    console.log('updateProfile - User from request:', req.user);
    
    const { fullName, username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user.id;
    console.log('updateProfile - User ID:', userId);

    const user = await User.findById(userId);
    console.log('updateProfile - Found user:', user ? {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName
    } : 'No user found');

    if (!user) {
      console.log('updateProfile - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Track if any changes were made
    let isModified = false;

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      console.log('updateProfile - Checking username:', username);
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        console.log('updateProfile - Username already taken:', username);
        return res.status(400).json({ message: 'Username is already taken' });
      }
      console.log('updateProfile - Updating username from', user.username, 'to', username);
      user.username = username;
      isModified = true;
    }

    // Check if email is being changed and if it's already registered
    if (email && email !== user.email) {
      console.log('updateProfile - Checking email:', email);
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        console.log('updateProfile - Email already registered:', email);
        return res.status(400).json({ message: 'Email is already registered' });
      }
      console.log('updateProfile - Updating email from', user.email, 'to', email);
      user.email = email;
      isModified = true;
    }

    // Update full name if provided and different
    if (fullName && fullName !== user.fullName) {
      console.log('updateProfile - Updating full name from', user.fullName, 'to', fullName);
      user.fullName = fullName;
      isModified = true;
    }

    // Update password if provided
    if (newPassword) {
      console.log('updateProfile - Password update requested');
      if (!currentPassword) {
        console.log('updateProfile - Current password not provided');
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      console.log('updateProfile - Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('updateProfile - Current password is incorrect');
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      console.log('updateProfile - Updating password');
      user.password = newPassword;
      isModified = true;
    }

    // Only save if changes were made
    if (isModified) {
      console.log('updateProfile - Saving changes to database');
      await user.save();
      console.log('updateProfile - User saved successfully');
    } else {
      console.log('updateProfile - No changes detected');
    }

    res.json({
      message: isModified ? 'Profile updated successfully' : 'No changes made',
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('updateProfile - Error:', error);
    console.error('updateProfile - Error stack:', error.stack);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    console.log('deleteAccount - Request received');
    const userId = req.user.userId || req.user.id;
    console.log('deleteAccount - User ID:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log('deleteAccount - No user found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    console.log('deleteAccount - User deleted successfully:', userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('deleteAccount - Error:', error);
    console.error('deleteAccount - Error stack:', error.stack);
    res.status(500).json({ message: 'Error deleting account' });
  }
}; 