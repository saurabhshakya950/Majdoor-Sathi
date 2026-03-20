import VerificationRequest from '../models/VerificationRequest.model.js';
import User from '../../user/models/User.model.js';
import Labour from '../../labour/models/Labour.model.js';
import Contractor from '../../contractor/models/Contractor.model.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.utils.js';
import { sendNotificationToUser, sendNotificationToAdmin } from '../../../utils/notificationHelper.js';
import Notification from '../../../models/Notification.model.js';

// @desc    Get all verification requests
// @route   GET /api/admin/verification/requests
// @access  Private (SUPER_ADMIN)
export const getAllVerificationRequests = async (req, res) => {
    try {
        const { category, status, page = 1, limit = 10 } = req.query;

        const query = {};

        if (category) {
            query.entityType = category;
        }

        if (status) {
            query.status = status;
        }

        const requests = await VerificationRequest.find(query)
            .populate('entityId', 'firstName lastName mobileNumber')
            .populate('verifiedBy', 'name username')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await VerificationRequest.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                requests,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching verification requests',
            error: error.message
        });
    }
};

// @desc    Get verification request by ID
// @route   GET /api/admin/verification/requests/:id
// @access  Private (SUPER_ADMIN)
export const getVerificationRequestById = async (req, res) => {
    try {
        const request = await VerificationRequest.findById(req.params.id)
            .populate('entityId', 'firstName lastName mobileNumber city state')
            .populate('verifiedBy', 'name username');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Verification request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { request }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching verification request',
            error: error.message
        });
    }
};

// @desc    Create verification request
// @route   POST /api/admin/verification/requests
// @access  Private (SUPER_ADMIN)
export const createVerificationRequest = async (req, res) => {
    try {
        const { 
            entityType, 
            entityId, 
            name, 
            phone, 
            aadhaarNumber,
            aadhaarFrontUrl,
            aadhaarBackUrl,
            trade,
            company
        } = req.body;

        // Determine entity model
        let entityModel;
        if (entityType === 'user') entityModel = 'User';
        else if (entityType === 'labour') entityModel = 'Labour';
        else if (entityType === 'contractor') entityModel = 'Contractor';

        const verificationRequest = await VerificationRequest.create({
            entityType,
            entityId,
            entityModel,
            name,
            phone,
            aadhaarNumber,
            aadhaarFrontUrl,
            aadhaarBackUrl,
            trade,
            company
        });

        res.status(201).json({
            success: true,
            message: 'Verification request created successfully',
            data: { request: verificationRequest }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error creating verification request',
            error: error.message
        });
    }
};

// @desc    Approve verification request
// @route   PUT /api/admin/verification/requests/:id/approve
// @access  Private (SUPER_ADMIN)
export const approveVerificationRequest = async (req, res) => {
    try {
        const request = await VerificationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Verification request not found'
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        request.status = 'Approved';
        request.verifiedBy = req.admin._id;
        request.verifiedAt = new Date();
        await request.save();

        // Update entity verification status
        let Model;
        if (request.entityType === 'user') Model = User;
        else if (request.entityType === 'labour') Model = Labour;
        else if (request.entityType === 'contractor') Model = Contractor;

        if (Model) {
            // 1. Update the main entity (User, Labour, or Contractor profile)
            await Model.findByIdAndUpdate(request.entityId, {
                isVerified: true,
                aadharNumber: request.aadhaarNumber
            });

            // 2. SYNC WITH PRIMARY USER COLLECTION
            // If it's a labour or contractor, we must also update their base User record
            try {
                let mainUserId = request.entityId; // For 'user' type, it's the same

                if (request.entityType === 'labour') {
                    const labour = await Labour.findById(request.entityId);
                    if (labour) mainUserId = labour.user;
                } else if (request.entityType === 'contractor') {
                    const contractor = await Contractor.findById(request.entityId);
                    if (contractor) mainUserId = contractor.user;
                }

                if (mainUserId) {
                    await User.findByIdAndUpdate(mainUserId, {
                        isVerified: true,
                        aadharNumber: request.aadhaarNumber
                    });
                    console.log(`[SYNC] Updated User ${mainUserId} with verified status and Aadhaar`);
                }
            } catch (syncError) {
                console.error('[ERROR] Failed to sync verified status to User model:', syncError);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Verification request approved successfully',
            data: { request }
        });

        // SEND NOTIFICATION TO USER
        try {
            let actualUserId = request.entityId;
            
            // If it's a labour or contractor, we need to get their main User record ID for Firebase tokens
            if (request.entityType === 'labour') {
                const labour = await Labour.findById(request.entityId);
                if (labour) actualUserId = labour.user;
            } else if (request.entityType === 'contractor') {
                const contractor = await Contractor.findById(request.entityId);
                if (contractor) actualUserId = contractor.user;
            }

            if (actualUserId) {
                const notificationTitle = "Verification Successful! 🎉";
                const notificationMessage = "Congratulations! Your legal documents are verified. You are now a verified member of Majdoor Sathii.";
                
                // 1. Create In-App Notification (Bell Icon)
                await Notification.create({
                    user: actualUserId,
                    userType: request.entityType.toUpperCase(),
                    title: notificationTitle,
                    message: notificationMessage,
                    type: 'VERIFICATION',
                    priority: 'HIGH',
                    metadata: { requestId: request._id, status: 'Approved' }
                });

                // 2. Send Push Notification (FCM)
                await sendNotificationToUser(actualUserId, {
                    title: notificationTitle,
                    body: notificationMessage,
                    data: { 
                        type: 'VERIFICATION_UPDATE',
                        status: 'Approved',
                        requestId: request._id.toString()
                    }
                });

                console.log(`[SUCCESS] Verification approval notification sent to user ${actualUserId}`);
            }
        } catch (notifError) {
            console.error('[ERROR] Failed to send verification approval notification:', notifError);
            // Non-blocking error, we don't return to res.status
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error approving verification request',
            error: error.message
        });
    }
};

// @desc    Reject verification request
// @route   PUT /api/admin/verification/requests/:id/reject
// @access  Private (SUPER_ADMIN)
export const rejectVerificationRequest = async (req, res) => {
    try {
        const { reason } = req.body;

        const request = await VerificationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Verification request not found'
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: 'Request has already been processed'
            });
        }

        request.status = 'Rejected';
        request.rejectionReason = reason || 'Documents not valid';
        request.verifiedBy = req.admin._id;
        request.verifiedAt = new Date();
        await request.save();

        res.status(200).json({
            success: true,
            message: 'Verification request rejected',
            data: { request }
        });

        // SEND NOTIFICATION TO USER
        try {
            let actualUserId = request.entityId;
            
            // If it's a labour or contractor, we need to get their main User record ID for Firebase tokens
            if (request.entityType === 'labour') {
                const labour = await Labour.findById(request.entityId);
                if (labour) actualUserId = labour.user;
            } else if (request.entityType === 'contractor') {
                const contractor = await Contractor.findById(request.entityId);
                if (contractor) actualUserId = contractor.user;
            }

            if (actualUserId) {
                const notificationTitle = "Verification Rejected ⚠️";
                const notificationMessage = `Your documents were rejected. Reason: ${reason || 'Documents not valid'}. Please re-upload clear copies.`;
                
                // 1. Create In-App Notification (Bell Icon)
                await Notification.create({
                    user: actualUserId,
                    userType: request.entityType.toUpperCase(),
                    title: notificationTitle,
                    message: notificationMessage,
                    type: 'VERIFICATION',
                    priority: 'MEDIUM',
                    metadata: { requestId: request._id, status: 'Rejected' }
                });

                // 2. Send Push Notification (FCM)
                await sendNotificationToUser(actualUserId, {
                    title: notificationTitle,
                    body: notificationMessage,
                    data: { 
                        type: 'VERIFICATION_UPDATE',
                        status: 'Rejected',
                        requestId: request._id.toString()
                    }
                });

                console.log(`[SUCCESS] Verification rejection notification sent to user ${actualUserId}`);
            }
        } catch (notifError) {
            console.error('[ERROR] Failed to send verification rejection notification:', notifError);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error rejecting verification request',
            error: error.message
        });
    }
};

// @desc    Upload verification document
// @route   POST /api/admin/verification/upload-document
// @access  Private (SUPER_ADMIN)
export const uploadVerificationDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Upload file to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'rajghar/verification-documents');

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                url: cloudinaryUrl
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error uploading document',
            error: error.message
        });
    }
};

// @desc    Submit verification request (for labour/user/contractor)
// @route   POST /api/admin/verification/submit
// @access  Private (authenticated user)
export const submitVerificationRequest = async (req, res) => {
    try {
        const { 
            entityType, 
            name, 
            phone, 
            aadhaarNumber,
            aadhaarFrontUrl,
            aadhaarBackUrl,
            trade,
            company
        } = req.body;

        console.log('\n🟢 ===== SUBMIT VERIFICATION REQUEST =====');
        console.log('Entity Type:', entityType);
        console.log('User ID:', req.user._id);

        // Determine entity model and get entity ID
        let entityModel, entityId;
        
        if (entityType === 'labour') {
            entityModel = 'Labour';
            const labour = await Labour.findOne({ user: req.user._id });
            if (!labour) {
                return res.status(404).json({
                    success: false,
                    message: 'Labour profile not found'
                });
            }
            entityId = labour._id;
        } else if (entityType === 'contractor') {
            entityModel = 'Contractor';
            const contractor = await Contractor.findOne({ user: req.user._id });
            if (!contractor) {
                return res.status(404).json({
                    success: false,
                    message: 'Contractor profile not found'
                });
            }
            entityId = contractor._id;
        } else {
            entityModel = 'User';
            entityId = req.user._id;
        }

        // Check if verification request already exists
        const existingRequest = await VerificationRequest.findOne({
            entityId,
            status: 'Pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Verification request already submitted. Please wait for admin approval.'
            });
        }

        // Handle Aadhaar images upload to Cloudinary
        let uploadedAadhaarFront = aadhaarFrontUrl;
        let uploadedAadhaarBack = aadhaarBackUrl;

        try {
            if (aadhaarFrontUrl && aadhaarFrontUrl.startsWith('data:image')) {
                uploadedAadhaarFront = await uploadToCloudinary(aadhaarFrontUrl, 'rajghar/aadhaar-documents');
            }
            
            if (aadhaarBackUrl && aadhaarBackUrl.startsWith('data:image')) {
                uploadedAadhaarBack = await uploadToCloudinary(aadhaarBackUrl, 'rajghar/aadhaar-documents');
            }
        } catch (error) {
            console.error('Aadhaar upload error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to upload Aadhaar documents',
                error: error.message
            });
        }

        const verificationRequest = await VerificationRequest.create({
            entityType,
            entityId,
            entityModel,
            name,
            phone,
            aadhaarNumber,
            aadhaarFrontUrl: uploadedAadhaarFront,
            aadhaarBackUrl: uploadedAadhaarBack,
            trade,
            company
        });

        console.log('✅ Verification request created:', verificationRequest.requestId);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Verification request submitted successfully',
            data: { verificationRequest }
        });

        // NOTIFY ALL ADMINS (Non-blocking — runs after response is sent)
        try {
            const entityLabel = entityType === 'labour' ? 'Labour' :
                entityType === 'contractor' ? 'Contractor' : 'User';
            const submitterName = name || 'Someone';
            const notifTitle = `New ${entityLabel} Verification Request 🔔`;
            const notifMessage = `${submitterName} has submitted documents for verification. Please review.`;

            // 1. In-App Bell Notification for all active admins
            const Admin = (await import('../models/Admin.model.js')).default;
            const admins = await Admin.find({ isActive: true });
            const adminNotifications = admins.map(admin =>
                Notification.create({
                    user: admin._id,
                    userType: 'ADMIN',
                    title: notifTitle,
                    message: notifMessage,
                    type: 'VERIFICATION',
                    priority: 'HIGH',
                    metadata: {
                        requestId: verificationRequest._id,
                        entityType,
                        submitterName: name
                    }
                })
            );
            await Promise.allSettled(adminNotifications);

            // 2. Push Notification to admin browsers
            await sendNotificationToAdmin({
                title: notifTitle,
                body: notifMessage,
                data: {
                    type: 'NEW_VERIFICATION_REQUEST',
                    entityType,
                    requestId: verificationRequest._id.toString()
                }
            });

            console.log(`[ADMIN NOTIFY] Verification submit notification sent for ${entityType} (${name})`);
        } catch (notifError) {
            console.error('[ERROR] Failed to send admin notification on submit:', notifError);
        }

    } catch (error) {
        console.error('❌ SUBMIT VERIFICATION ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Server error submitting verification request',
            error: error.message
        });
    }
};
