const bcrypt = require("bcrypt");
const User = require('../model/userModal');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require("path");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const { imageDir, resumeDir } = require('../middleware/mullterConfiguration');
const { getImageUrl } = require('../utils/fileHelper'); // Import helper
const sendEmail = require("../utils/sendEmail");

// Updated login with 2FA support
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Received User Data:", req.body);

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const existingUser = await User.findOne({ email });

        console.log("User from DB:", existingUser);

        if (!existingUser) {
            return res.status(404).json({ message: "User with this email is not registered." });
        }

        // const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        // if (!isPasswordValid) {
        //     return res.status(401).json({ message: "Incorrect password." });
        // }

        // Check if user has 2FA enabled
        if (existingUser.is2FAEnabled) {
            return res.json({
                requires2FA: true,
                userId: existingUser._id,
                message: "Please enter your 2FA code to complete login"
            });
        }

        // Normal login without 2FA
        const token = jwt.sign(
            { id: existingUser._id, role: existingUser.role },
            process.env.JWT_SECRET || "default-secret",
            { expiresIn: '7d' }
        );

        // Remove password safely
        const { password: _, ...safeUserData } = existingUser.toObject();

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: safeUserData,
            done: true
        });

    } catch (error) {
        console.error("error during login:", error.message);
        res.status(500).json({
            message: "An error occurred during login. Please try again later.",
        });
    }
};

// NEW: Verify 2FA during login
const verify2FALogin = async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({ message: "User ID and OTP are required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.is2FAEnabled || !user.twoFASecret) {
            return res.status(400).json({ message: "2FA is not enabled for this user." });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: "base32",
            token,
            window: 1, // Allow 1 step tolerance for time drift
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP code. Please try again." });
        }

        // Generate JWT token after successful 2FA
        const jwtToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "default-secret",
            { expiresIn: "7d" }
        );

        // Remove password safely
        const { password: _, ...safeUserData } = user.toObject();

        res.json({
            message: "Login successful with 2FA",
            token: jwtToken,
            user: safeUserData
        });

    } catch (error) {
        console.error("Error during 2FA login verification:", error);
        res.status(500).json({ message: "Error verifying 2FA code" });
    }
};

// NEW: Enable 2FA (Generate QR Code)
const enable2FA = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.is2FAEnabled) {
            return res.status(400).json({ message: "2FA is already enabled for this account" });
        }

        const secret = speakeasy.generateSecret({
            name: `${user.email}`, // User's email
            issuer: "YourApp Name", // Replace with your app name
        });

        // Save the secret temporarily (not enabled yet)
        user.twoFASecret = secret.base32;
        await user.save();

        // Generate QR code
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error("QR Code generation error:", err);
                return res.status(500).json({ message: "Error generating QR code" });
            }

            res.json({
                qrCode: data_url,
                secret: secret.base32,
                message: "Scan the QR code with Google Authenticator and enter the code to complete setup"
            });
        });

    } catch (error) {
        console.error("Error enabling 2FA:", error);
        res.status(500).json({ message: "Error enabling 2FA" });
    }
};

// NEW: Verify OTP to finalize 2FA setup
const verify2FASetup = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!token) {
            return res.status(400).json({ message: "OTP code is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.twoFASecret) {
            return res.status(400).json({ message: "2FA setup not initiated. Please start the setup process again." });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: "base32",
            token,
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP code. Please try again." });
        }

        // Enable 2FA
        user.is2FAEnabled = true;
        await user.save();

        res.json({ message: "2FA has been successfully enabled for your account" });

    } catch (error) {
        console.error("Error verifying 2FA setup:", error);
        res.status(500).json({ message: "Error verifying 2FA setup" });
    }
};

// NEW: Disable 2FA
const disable2FA = async (req, res) => {
    try {
        const { password, token } = req.body;
        const userId = req.user.id;

        if (!password || !token) {
            return res.status(400).json({ message: "Password and current OTP are required to disable 2FA" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.is2FAEnabled) {
            return res.status(400).json({ message: "2FA is not enabled for this account" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        // Verify current OTP
        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: "base32",
            token,
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP code" });
        }

        // Disable 2FA
        user.is2FAEnabled = false;
        user.twoFASecret = null;
        await user.save();

        res.json({ message: "2FA has been disabled for your account" });

    } catch (error) {
        console.error("Error disabling 2FA:", error);
        res.status(500).json({ message: "Error disabling 2FA" });
    }
};

// NEW: Get 2FA status
const get2FAStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('is2FAEnabled');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            is2FAEnabled: user.is2FAEnabled || false
        });

    } catch (error) {
        console.error("Error getting 2FA status:", error);
        res.status(500).json({ message: "Error getting 2FA status" });
    }
};

// ... (keep all your existing functions: deleteAdmin, updateUser, viewUser, forgotPassword, resetPassword, changePassword)

// const deleteAdmin = async (req, res) => {
//     try {
//         const { role } = req.params;

//         // Use findOneAndDelete to get the deleted document
//         const deletedAdmin = await User.findOneAndDelete({ role });

//         if (!deletedAdmin) {
//             return res.status(404).json({ message: "Admin not found" });
//         }

//         res.status(200).json({
//             message: "Admin deleted successfully",
//             data: deletedAdmin
//         });
//     } catch (error) {
//         console.error("Error during deletion:", error.message);
//         res.status(500).json({
//             message: "An error occurred during deletion. Please try again later.",
//         });
//     }
// };

// Update User Controller
const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // user ID from URL
        const { name, email, password, role, bio } = req.body;
        let image;

        // Find the user to update
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Authorization check: users can only update themselves unless admin
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: "Not authorized to update this user" });
        }

        // Handle file upload
        if (req.file) {
            image = req.file.filename;
            console.log('New file uploaded:', image);
            console.log('Old user image:', user.image);

            // Determine correct folder based on the UPLOADING user's role (req.user)
            const folder = req.user.role === 'admin' ? imageDir : resumeDir;

            // If old image exists, delete it from the same folder type
            if (user.image) {
                // The old file should be in the same folder type as the new upload
                const oldFilePath = path.join(folder, user.image);

                fs.unlink(oldFilePath, (err) => {
                    if (err && err.code !== 'ENOENT') { // Ignore "file not found" errors
                        console.error("Error deleting old file:", err);
                    } else if (!err) {
                        console.log("Old file deleted successfully:", oldFilePath);
                    }
                });
            }
        }

        // Prepare update data - only include fields that are provided
        let updateData = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined && req.user.role === 'admin') {
            // Only admins can change roles
            updateData.role = role;
        }
        if (bio !== undefined) updateData.bio = bio;
        if (image) updateData.image = image;

        // If password provided, hash it
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }
            const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for better security
            updateData.password = hashedPassword;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select('-password'); // Don't return password in response

        // Transform response to include full image URL
        const userResponse = updatedUser.toObject();
        if (userResponse.image) {
            userResponse.imageUrl = getImageUrl(userResponse.image);
        }

        res.status(200).json({
            message: "User updated successfully",
            user: userResponse
        });

    } catch (error) {
        console.error("Error updating user:", error);

        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Email already exists",
                error: "Duplicate email"
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Validation error",
                error: error.message
            });
        }

        res.status(500).json({
            message: "Server error",
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
        });
    }
};

// Get single user
const viewUser = async (req, res) => {
    try {
        // Fetch the single admin
        const user = await User.findOne({ role: 'admin' });
        if (!user) {
            return res.status(404).json({ message: "No admin user found" });
        }
        const userResponse = user.toObject();
        if (userResponse.image) {
            userResponse.imageUrl = getImageUrl(userResponse.image);
        }

        // console.log(userResponse)

        res.status(200).json({ data: userResponse });
    } catch (error) {
        console.error("Error fetching admin user:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Step 1: Send Reset Link
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        console.log('email:', email);

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email not found." });
        }

        // Create a reset token (expires in 15 min)
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || "default-secret",
            { expiresIn: "15m" }
        );

        // Fixed: Remove quotes from URL
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        // Send email asynchronously
        setImmediate(async () => {
            try {
                const subject = "Password Reset Request";
                // Fixed: Corrected template literal syntax
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4F46E5;">Password Reset Request</h2>
                        <p>Hi,</p>
                        <p>You requested a password reset. Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p><strong>This link will expire in 15 minutes.</strong></p>
                        <p>If you did not request this password reset, please ignore this email.</p>
                        <p>For security reasons, this link can only be used once.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${resetLink}">${resetLink}</a>
                        </p>
                    </div>
                `;

                await sendEmail(email, subject, html);
                console.log(`✅ Password reset email sent to ${email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send password reset email to ${email}:`, emailError);
            }
        });

        return res.status(200).json({
            message: "Password reset email sent. Please check your inbox."
        });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ message: "Something went wrong. Try again later." });
    }
};

// Step 2: Reset Password with Token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword, confirmPassword } = req.body;

        // Validate input
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "New password and confirmation are required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || "default-secret");
        } catch (tokenError) {
            if (tokenError.name === 'TokenExpiredError') {
                return res.status(400).json({
                    message: "Reset token has expired. Please request a new password reset."
                });
            }
            return res.status(400).json({
                message: "Invalid reset token."
            });
        }

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update user password
        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            // Optional: Add a field to track password reset
            passwordResetAt: new Date()
        });

        // Send confirmation email
        setImmediate(async () => {
            try {
                const subject = "Password Reset Successful";
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">Password Reset Successful</h2>
                        <p>Hi,</p>
                        <p>Your password has been successfully reset.</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                        <p>For security reasons, you may need to log in again on all your devices.</p>
                        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                            <p style="margin: 0; color: #374151;">
                                <strong>Security Tip:</strong> Always use a strong, unique password and consider enabling two-factor authentication if available.
                            </p>
                        </div>
                    </div>
                `;

                await sendEmail(user.email, subject, html);
                console.log(`✅ Password reset confirmation sent to ${user.email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send confirmation email to ${user.email}:`, emailError);
            }
        });

        return res.status(200).json({
            message: "Password has been reset successfully. You can now log in with your new password."
        });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ message: "Something went wrong. Try again later." });
    }
};

// Step 3: Reset Password for Logged-in Users (Change Password)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id; // Assuming you have authentication middleware

        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Current password, new password, and confirmation are required."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "New passwords do not match."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from current password."
            });
        }

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                message: "Current password is incorrect."
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
        });

        // Send notification email
        setImmediate(async () => {
            try {
                const subject = "Password Changed Successfully";
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #059669;">Password Changed Successfully</h2>
                        <p>Hi,</p>
                        <p>Your password has been successfully changed from your account settings.</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                    </div>
                `;

                await sendEmail(user.email, subject, html);
                console.log(`✅ Password change notification sent to ${user.email}`);
            } catch (emailError) {
                console.error(`❌ Failed to send password change notification:`, emailError);
            }
        });

        return res.status(200).json({
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ message: "Something went wrong. Try again later." });
    }
};

module.exports = {
    updateUser,
    viewUser,
    login,
    changePassword,
    forgotPassword,
    resetPassword,
    // NEW 2FA exports
    enable2FA,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
    get2FAStatus
};