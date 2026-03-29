import User from '../models/User.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.utils.js';
import Notification from '../../../models/Notification.model.js';
import Admin from '../../admin/models/Admin.model.js';

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('-refreshToken -__v');
        
        res.status(200).json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req, res, next) => {
    try {
        console.log('\n🟡 ===== UPDATE PROFILE (GENERAL) =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user._id);
        console.log('🏷️ User Type:', req.user.userType);

        const allowedUpdates = ['firstName', 'middleName', 'lastName', 'city', 'state', 'address', 'profilePhoto', 'userType', 'gender', 'dob', 'aadharNumber'];
        const updates = {};

        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        // 1. Handle profile photo upload to Cloudinary
        if (updates.profilePhoto && updates.profilePhoto.startsWith('data:image')) {
            try {
                const user = await User.findById(req.user._id);
                
                // Delete old profile photo from Cloudinary if exists
                if (user.profilePhoto && user.profilePhoto.includes('cloudinary.com')) {
                    await deleteFromCloudinary(user.profilePhoto);
                }
                
                // Upload new photo to Cloudinary
                const cloudinaryUrl = await uploadToCloudinary(updates.profilePhoto, 'rajghar/profiles');
                updates.profilePhoto = cloudinaryUrl;
                console.log('📸 Profile photo uploaded to Cloudinary:', cloudinaryUrl);
            } catch (error) {
                console.error('Profile photo upload error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload profile photo',
                    error: error.message
                });
            }
        }
        // 2. Identify role
        const userType = req.user.userType;
        const isContractor = userType === 'Contractor';
        const isLabour = userType === 'Labour';

        // Prepare updates (Sync names to both User and Role models)
        const userModelUpdates = { ...updates };
        const roleModelUpdates = { ...updates };

        // 3. Update User model (Names, Location, Type, Gender, etc.)
        const user = await User.findByIdAndUpdate(
            req.user._id,
            userModelUpdates,
            { new: true, runValidators: true }
        ).select('-refreshToken -__v');

        // 4. Update Role-Specific model (Names, etc.)
        if (isContractor) {
            try {
                const Contractor = (await import('../../contractor/models/Contractor.model.js')).default;
                const contractor = await Contractor.findOneAndUpdate(
                    { user: req.user._id },
                    roleModelUpdates,
                    { new: true, upsert: true }
                );
                console.log('✅ Contractor role model updated:', contractor._id);
            } catch (err) {
                console.error('Error updating Contractor role model:', err.message);
            }
        } else if (isLabour) {
            try {
                const Labour = (await import('../../labour/models/Labour.model.js')).default;
                const labour = await Labour.findOneAndUpdate(
                    { user: req.user._id },
                    roleModelUpdates,
                    { new: true, upsert: true }
                );
                console.log('✅ Labour role model updated:', labour._id);
            } catch (err) {
                console.error('Error updating Labour role model:', err.message);
            }
        }

        console.log('✅ Profile update successful');
        console.log('=============================\n');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { 
                user,
                // Include role-specific name if applicable for frontend immediate update
                roleSpecificName: updates.firstName 
            }
        });
    } catch (error) {
        console.error('❌ UPDATE PROFILE ERROR:', error.message);
        console.log('=============================\n');
        next(error);
    }
};

export const getUserVerificationStatus = async (req, res, next) => {
    try {
        const VerificationRequest = (await import('../../admin/models/VerificationRequest.model.js')).default;
        
        const verificationRequest = await VerificationRequest.findOne({
            entityId: req.user._id,
            entityType: 'user'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                isVerified: req.user.isVerified || false,
                verificationRequest: verificationRequest || null
            }
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Submit feedback
// @route   POST /api/users/feedback
// @access  Private
export const submitFeedback = async (req, res, next) => {
    try {
        const Feedback = (await import('../../admin/models/Feedback.model.js')).default;
        const { rating, comment } = req.body;

        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Rating and comment are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const feedback = await Feedback.create({
            entityType: 'user',
            entityId: req.user._id,
            entityModel: 'User',
            rating,
            comment,
            givenBy: req.user._id,
            givenByModel: 'User'
        });

        // Trigger Admin Notification
        try {
            const superAdmin = await Admin.findOne({ role: 'SUPER_ADMIN' });
            if (superAdmin) {
                await Notification.create({
                    user: superAdmin._id,
                    userType: 'ADMIN',
                    title: 'New Feedback Received',
                    message: `${req.user.firstName || 'A user'} has submitted a new feedback.`,
                    type: 'info',
                    priority: 'MEDIUM',
                    metadata: {
                        type: 'FEEDBACK_RECEIVED',
                        senderId: req.user._id,
                        senderRole: 'USER',
                        feedbackId: feedback._id
                    }
                });
            }
        } catch (notifErr) {
            console.error('Error creating admin notification:', notifErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: { feedback }
        });
    } catch (error) {
        next(error);
    }
};
