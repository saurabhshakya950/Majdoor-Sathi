import Admin from '../models/Admin.model.js';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt.utils.js';

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
export const adminLogin = async (req, res) => {
    try {
        const { username, password, fcmToken, platform } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username and password'
            });
        }

        // Find admin with password field
        const admin = await Admin.findOne({ username }).select('+password');

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Admin account is deactivated'
            });
        }

        // Check password
        const isPasswordMatch = await admin.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate only access token (no refresh token for now to simplify)
        const accessToken = generateAccessToken(admin._id);

        // Update last login
        admin.lastLogin = new Date();

        // Save FCM token if provided (non-blocking)
        try {
            if (fcmToken) {
                const isMobile = ['mobile', 'app', 'android', 'ios'].includes(platform?.toLowerCase());
                const tokenField = isMobile ? 'fcmTokenMobile' : 'fcmTokenWeb';
                // Single Token Refresh Logic: Replace all old tokens with the new one
                admin[tokenField] = [fcmToken];
            }
        } catch (fcmError) {
            console.warn('[WARNING] FCM token save failed (non-critical):', fcmError.message);
        }

        await admin.save();

        // Remove password from response
        const adminData = admin.toObject();
        delete adminData.password;
        delete adminData.refreshToken;

        console.log('✅ Admin Login Success:', admin.username, 'Token generated and set in HttpOnly cookie');

        // Set token in Cookie
        res.cookie('adminToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                admin: adminData,
                token: accessToken // Kept for backward compatibility but optional now
            }
        });

    } catch (error) {
        console.error('❌ Admin Login Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Admin logout
// @route   POST /api/admin/auth/logout
// @access  Private
export const adminLogout = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);
        
        if (admin) {
            admin.refreshToken = null;
            await admin.save();
        }

        // Clear Cookie
        res.clearCookie('adminToken');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during logout',
            error: error.message
        });
    }
};

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get admin with password
        const admin = await Admin.findById(req.admin._id).select('+password');

        // Verify current password
        const isPasswordMatch = await admin.comparePassword(currentPassword);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        admin.password = newPassword;
        await admin.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during password change',
            error: error.message
        });
    }
};

// @desc    Verify admin token
// @route   GET /api/admin/auth/verify-token
// @access  Private
export const verifyToken = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            valid: true,
            data: {
                admin: req.admin
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during token verification',
            error: error.message
        });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/profile
// @access  Private
export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id).select('-password -refreshToken');

        res.status(200).json({
            success: true,
            data: {
                admin: admin
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile',
            error: error.message
        });
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/auth/profile
// @access  Private
export const updateAdminProfile = async (req, res) => {
    try {
        const { name, email, phone, currentPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.admin._id).select('+password');

        // If password change is requested
        if (currentPassword && newPassword) {
            // Verify current password
            const isPasswordMatch = await admin.comparePassword(currentPassword);
            
            if (!isPasswordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters'
                });
            }

            admin.password = newPassword;
        }

        // Update other fields
        if (name) admin.name = name;
        if (email) admin.email = email;
        if (phone) admin.phone = phone;

        await admin.save();

        const updatedAdmin = admin.toObject();
        delete updatedAdmin.password;
        delete updatedAdmin.refreshToken;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                admin: updatedAdmin
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error updating profile',
            error: error.message
        });
    }
};

// @desc    Save admin FCM token for push notifications
// @route   POST /api/admin/auth/fcm-token
// @access  Private
export const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken, platform } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        const admin = await Admin.findById(req.admin._id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMobile = ['mobile', 'app', 'android', 'ios'].includes(platform?.toLowerCase());
        const tokenField = isMobile ? 'fcmTokenMobile' : 'fcmTokenWeb';
        // Single Token Refresh Logic: Replace all old tokens with the new one
        admin[tokenField] = [fcmToken];
        await admin.save();

        res.status(200).json({ success: true, message: 'FCM token saved successfully' });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error saving FCM token',
            error: error.message
        });
    }
};
