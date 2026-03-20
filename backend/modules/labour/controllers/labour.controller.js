import Labour from '../models/Labour.model.js';
import HireRequest from '../models/HireRequest.model.js';
import User from '../../user/models/User.model.js';
import Contractor from '../../contractor/models/Contractor.model.js';
import { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary } from '../../../utils/cloudinary.utils.js';
import { sendNotificationToUser } from '../../../utils/notificationHelper.js';

// @desc    Create labour profile during registration
// @route   POST /api/labour/create-profile
// @access  Public
export const createLabourProfile = async (req, res) => {
    try {
        console.log('\n🟢 ===== CREATE LABOUR PROFILE =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User from token:', req.user ? req.user._id : 'No token');

        // Extract data from request body FIRST
        const {
            mobileNumber,
            firstName,
            middleName,
            lastName,
            gender,
            city,
            state,
            skillType,
            experience,
            workPhotos,
            previousWorkLocation,
            aadharNumber
        } = req.body;

        // Get userId from token if available, otherwise from mobileNumber
        let userId = req.user?._id;
        
        if (!userId) {
            // If no token, find user by mobile number
            if (!mobileNumber) {
                console.log('❌ No userId or mobileNumber provided');
                return res.status(400).json({
                    success: false,
                    message: 'Authentication required or mobile number must be provided'
                });
            }

            const user = await User.findOne({ mobileNumber });
            if (!user) {
                console.log('❌ User not found with mobile:', mobileNumber);
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please register first.'
                });
            }
            
            userId = user._id;
            console.log('✅ Found user by mobile:', userId);
        }

        // Update User model with basic details only if needed (don't sync names to avoid leakage)
        const user = await User.findById(userId);
        if (user) {
            // Only update userType if not set
            if (!user.userType) user.userType = 'Labour';
            
            // Sync city/state as general location info is usually shared
            if (city) user.city = city;
            if (state) user.state = state;
            
            await user.save();
            console.log('✅ User model updated (Type/Location):', {
                city: user.city,
                userType: user.userType
            });
        }

        // Handle work photos upload to Cloudinary
        let uploadedWorkPhotos = [];
        if (workPhotos && Array.isArray(workPhotos) && workPhotos.length > 0) {
            try {
                const base64Images = workPhotos.filter(photo => 
                    typeof photo === 'string' && photo.startsWith('data:image')
                );
                
                if (base64Images.length > 0) {
                    uploadedWorkPhotos = await uploadMultipleToCloudinary(base64Images, 'rajghar/work-photos');
                }
            } catch (error) {
                console.error('Work photos upload error:', error);
                // Continue with profile creation even if photo upload fails
            }
        }

        // Check if labour profile already exists
        const existingLabour = await Labour.findOne({ user: userId });
        if (existingLabour) {
            console.log('⚠️ Labour profile already exists, updating...');

            // Update Labour model with all fields
            if (firstName) existingLabour.firstName = firstName;
            if (middleName) existingLabour.middleName = middleName;
            if (lastName) existingLabour.lastName = lastName;
            if (gender) existingLabour.gender = gender;
            if (city) existingLabour.city = city;
            if (state) existingLabour.state = state;
            if (skillType) existingLabour.skillType = skillType;
            if (experience) existingLabour.experience = experience;
            if (uploadedWorkPhotos.length > 0) existingLabour.workPhotos = uploadedWorkPhotos;
            if (previousWorkLocation) existingLabour.previousWorkLocation = previousWorkLocation;
            if (aadharNumber) existingLabour.aadharNumber = aadharNumber;
            await existingLabour.save();

            console.log('✅ Labour profile updated:', existingLabour._id);
            console.log('===========================\n');

            return res.status(200).json({
                success: true,
                message: 'Labour profile updated successfully',
                data: { labour: existingLabour }
            });
        }

        // Create labour profile with all personal details
        const labour = await Labour.create({
            user: userId,
            firstName: firstName || '',
            middleName: middleName || '',
            lastName: lastName || '',
            gender: gender || '',
            city: city || '',
            state: state || '',
            skillType: skillType || 'Other',
            experience: experience || '',
            workPhotos: uploadedWorkPhotos,
            previousWorkLocation: previousWorkLocation || '',
            aadharNumber: aadharNumber || ''
        });

        console.log('✅ Labour profile created:', labour._id);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Labour profile created successfully',
            data: { labour }
        });
    } catch (error) {
        console.error('❌ CREATE LABOUR PROFILE ERROR:', error.message);
        console.error('Stack trace:', error.stack);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to create labour profile',
            error: error.message
        });
    }
};

// @desc    Update work details
// @route   PUT /api/labour/work-details
// @access  Private
export const updateWorkDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { skillType, experience, previousWorkLocation, workPhotos, availabilityStatus, availability } = req.body;

        const labour = await Labour.findOne({ user: userId });
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Handle work photos upload to Cloudinary
        if (workPhotos && Array.isArray(workPhotos) && workPhotos.length > 0) {
            try {
                // Filter only base64 images (new uploads)
                const base64Images = workPhotos.filter(photo => 
                    typeof photo === 'string' && photo.startsWith('data:image')
                );
                
                // Keep existing Cloudinary URLs
                const existingUrls = workPhotos.filter(photo => 
                    typeof photo === 'string' && photo.includes('cloudinary.com')
                );

                // Upload new images to Cloudinary
                let newUrls = [];
                if (base64Images.length > 0) {
                    newUrls = await uploadMultipleToCloudinary(base64Images, 'rajghar/work-photos');
                }

                // Combine existing and new URLs
                labour.workPhotos = [...existingUrls, ...newUrls];
            } catch (error) {
                console.error('Work photos upload error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload work photos',
                    error: error.message
                });
            }
        }

        // Update other fields
        if (skillType) labour.skillType = skillType;
        if (experience) labour.experience = experience;
        if (previousWorkLocation) labour.previousWorkLocation = previousWorkLocation;
        if (availabilityStatus) labour.availabilityStatus = availabilityStatus;
        if (availability) labour.availability = availability;

        await labour.save();

        res.status(200).json({
            success: true,
            message: 'Work details updated successfully',
            data: { labour }
        });
    } catch (error) {
        console.error('Update work details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update work details',
            error: error.message
        });
    }
};

// @desc    Create labour card
// @route   POST /api/labour/card
// @access  Private
export const createLabourCard = async (req, res) => {
    try {
        console.log('\n🟢 ===== CREATE LABOUR CARD =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        
        const userId = req.user._id;
        const { 
            labourCardDetails, 
            skillType, 
            experience, 
            previousWorkLocation, 
            availability, 
            availabilityStatus, 
            rating 
        } = req.body;

        const labour = await Labour.findOne({ user: userId });
        if (!labour) {
            console.log('❌ Labour profile not found');
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Handle labour card photo upload to Cloudinary
        if (labourCardDetails && labourCardDetails.photo) {
            if (labourCardDetails.photo.startsWith('data:image')) {
                try {
                    // Delete old photo if exists
                    if (labour.labourCardDetails?.photo && labour.labourCardDetails.photo.includes('cloudinary.com')) {
                        await deleteFromCloudinary(labour.labourCardDetails.photo);
                    }
                    
                    // Upload new photo to Cloudinary
                    const cloudinaryUrl = await uploadToCloudinary(labourCardDetails.photo, 'rajghar/labour-cards');
                    labourCardDetails.photo = cloudinaryUrl;
                } catch (error) {
                    console.error('Labour card photo upload error:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload labour card photo',
                        error: error.message
                    });
                }
            }
        }

        // Update labour card details
        labour.hasLabourCard = true;
        
        // Update labourCardDetails object
        if (labourCardDetails) {
            labour.labourCardDetails = {
                fullName: labourCardDetails.fullName,
                gender: labourCardDetails.gender,
                mobileNumber: labourCardDetails.mobileNumber,
                city: labourCardDetails.city,
                address: labourCardDetails.address,
                skills: labourCardDetails.skills,
                photo: labourCardDetails.photo
            };
        }
        
        // Update other labour fields
        if (skillType) labour.skillType = skillType;
        if (experience) labour.experience = experience;
        if (previousWorkLocation) labour.previousWorkLocation = previousWorkLocation;
        if (availability) labour.availability = availability;
        if (availabilityStatus) labour.availabilityStatus = availabilityStatus;
        if (rating !== undefined) labour.rating = rating;

        await labour.save();

        console.log('✅ Labour card created successfully');
        console.log('Updated labour:', JSON.stringify(labour, null, 2));
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Labour card created successfully',
            data: { labour }
        });
    } catch (error) {
        console.error('❌ CREATE LABOUR CARD ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to create labour card',
            error: error.message
        });
    }
};

// @desc    Get labour profile
// @route   GET /api/labour/profile
// @access  Private
export const getLabourProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const labour = await Labour.findOne({ user: userId }).populate('user', 'firstName lastName middleName mobileNumber city state gender profilePhoto');
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { 
                labour,
                user: labour.user,
                // Prioritize labour profile name, then user model name, fallback to 'Labour'
                displayName: labour.firstName || (labour.user && labour.user.firstName) || 'Labour'
            }
        });
    } catch (error) {
        console.error('Get labour profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get labour profile',
            error: error.message
        });
    }
};

// @desc    Browse labour cards
// @route   GET /api/labour/browse
// @access  Public
export const browseLabourCards = async (req, res) => {
    try {
        const { skillType, city, page = 1, limit = 10 } = req.query;

        const query = { hasLabourCard: true, isActive: true };
        
        if (skillType) query.skillType = skillType;
        if (city) query['labourCardDetails.city'] = city;

        const labours = await Labour.find(query)
            .populate('user', 'firstName lastName mobileNumber city profilePhoto')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Labour.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                labours,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                count
            }
        });
    } catch (error) {
        console.error('Browse labour cards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to browse labour cards',
            error: error.message
        });
    }
};

// @desc    Get labour by ID
// @route   GET /api/labour/:id
// @access  Private
export const getLabourById = async (req, res) => {
    try {
        const { id } = req.params;

        const labour = await Labour.findById(id).populate('user', 'firstName lastName mobileNumber city profilePhoto');
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { labour }
        });
    } catch (error) {
        console.error('Get labour by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get labour',
            error: error.message
        });
    }
};

// @desc    Get labour verification status
// @route   GET /api/labour/verification-status
// @access  Private
export const getLabourVerificationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const labour = await Labour.findOne({ user: userId });
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        const VerificationRequest = (await import('../../admin/models/VerificationRequest.model.js')).default;
        const verificationRequest = await VerificationRequest.findOne({
            entityId: labour._id,
            entityType: 'labour'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                verificationStatus: labour.verificationStatus,
                isVerified: labour.isVerified,
                verificationRequest: verificationRequest || null
            }
        });
    } catch (error) {
        console.error('Get verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get verification status',
            error: error.message
        });
    }
};

// @desc    Create hire request
// @route   POST /api/labour/hire-request
// @access  Private
export const createHireRequest = async (req, res) => {
    try {
        const { labourId, requesterModel } = req.body;
        const userId = req.user._id;

        // Validate requester model
        if (!['User', 'Contractor'].includes(requesterModel)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid requester model'
            });
        }

        // Get labour details
        const labour = await Labour.findById(labourId).populate('user');
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        // Get requester details
        let requester;
        if (requesterModel === 'User') {
            requester = await User.findById(userId);
        } else {
            requester = await Contractor.findOne({ user: userId }).populate('user');
            if (requester) {
                requester = requester.user;
            }
        }

        if (!requester) {
            return res.status(404).json({
                success: false,
                message: 'Requester not found'
            });
        }

        // Check if request already exists
        const existingRequest = await HireRequest.findOne({
            labourId,
            requesterId: userId,
            requesterModel,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Hire request already exists'
            });
        }

        // Create hire request
        const hireRequest = await HireRequest.create({
            labourId,
            labourName: labour.labourCardDetails?.fullName || `${labour.user.firstName} ${labour.user.lastName}`,
            labourSkill: labour.skillType || 'General',
            labourPhone: labour.labourCardDetails?.mobileNumber || labour.user.mobileNumber,
            labourCity: labour.labourCardDetails?.city || labour.user.city || 'N/A',
            requesterId: userId,
            requesterModel,
            requesterName: `${requester.firstName} ${requester.lastName}`,
            requesterPhone: requester.mobileNumber,
            requesterLocation: requester.city || 'N/A'
        });

        // Send push notification to Labour
        if (labour.user && labour.user._id) {
            await sendNotificationToUser(labour.user._id.toString(), {
                title: 'New Hire Request',
                body: `${requester.firstName} ${requester.lastName} wants to hire you for ${labour.skillType || 'General'} work.`,
                data: {
                    type: 'hire_request',
                    id: hireRequest._id.toString(),
                    link: '/labour/requests'
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Hire request created successfully',
            data: { hireRequest }
        });
    } catch (error) {
        console.error('Create hire request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hire request',
            error: error.message
        });
    }
};

// @desc    Get labour hire requests (received by labour)
// @route   GET /api/labour/hire-requests
// @access  Private
export const getLabourHireRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        // Find labour profile
        const labour = await Labour.findOne({ user: userId });
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Build query
        const query = { labourId: labour._id };
        if (status) query.status = status;

        const hireRequests = await HireRequest.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                hireRequests,
                count: hireRequests.length
            }
        });
    } catch (error) {
        console.error('Get labour hire requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get hire requests',
            error: error.message
        });
    }
};

// @desc    Get sent hire requests (sent by user/contractor)
// @route   GET /api/labour/hire-requests/sent
// @access  Private
export const getSentHireRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { requesterModel } = req.query;

        // Build query
        const query = { requesterId: userId };
        if (requesterModel) query.requesterModel = requesterModel;

        const hireRequests = await HireRequest.find(query)
            .select('labourId status chatId createdAt updatedAt')
            .sort({ createdAt: -1 });

        // Convert labourId to string for frontend mapping
        const formattedRequests = hireRequests.map(req => ({
            _id: req._id,
            labourId: req.labourId.toString(),
            status: req.status,
            chatId: req.chatId,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                hireRequests: formattedRequests,
                count: formattedRequests.length
            }
        });
    } catch (error) {
        console.error('Get sent hire requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sent hire requests',
            error: error.message
        });
    }
};

// @desc    Update hire request status (accept/decline)
// @route   PATCH /api/labour/hire-request/:id
// @desc    Update hire request status (accept/decline)
// @route   PATCH /api/labour/hire-request/:id
// @access  Private
export const updateHireRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        console.log('\n🟡 ===== UPDATE HIRE REQUEST STATUS =====');
        console.log('Request ID:', id);
        console.log('New Status:', status);
        console.log('Labour User ID:', userId);

        // Validate status
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Find hire request
        const hireRequest = await HireRequest.findById(id);
        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        // Verify labour owns this request
        const labour = await Labour.findOne({ user: userId }).populate('user');
        if (!labour || labour._id.toString() !== hireRequest.labourId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this request'
            });
        }

        // Update status
        hireRequest.status = status;
        hireRequest.respondedAt = new Date();

        // ✅ CREATE CHAT AUTOMATICALLY when status is accepted
        if (status === 'accepted') {
            console.log('✅ Status is accepted, creating chat...');
            
            try {
                // Import chat controller
                const { createChatFromRequest } = await import('../../../controllers/chat.controller.js');

                // Get requester details (base user record)
                let requester;
                let requesterType = hireRequest.requesterModel;
                let requesterName;

                if (requesterType === 'User') {
                    requester = await User.findById(hireRequest.requesterId);
                    requesterName = `${requester?.firstName || ''} ${requester?.lastName || ''}`.trim() || 'User';
                } else if (requesterType === 'Contractor') {
                    // For Contractor, get BOTH the Contractor profile (for name) and base user (for phone/photo)
                    const contractorProfile = await Contractor.findOne({ user: hireRequest.requesterId });
                    requester = await User.findById(hireRequest.requesterId);
                    // Use role-specific name from Contractor profile (identity isolation)
                    const cFirstName = (contractorProfile && contractorProfile.firstName) || requester?.firstName || 'Contractor';
                    const cLastName = (contractorProfile && contractorProfile.lastName) || requester?.lastName || '';
                    requesterName = `${cFirstName || ''} ${cLastName || ''}`.trim() || 'Contractor';
                    if (requesterName === 'null null') requesterName = 'Contractor';
                }

                if (!requester) {
                    console.log('❌ Requester not found');
                    // Non-blocking: log and continue without chat
                    console.error('⚠️ Requester not found, skipping chat creation');
                } else {
                    // Get labour name from Labour model (role-specific identity)
                    const labourFirstName = labour.firstName || labour.user.firstName || 'Labour';
                    const labourLastName = labour.lastName || labour.user.lastName || '';
                    let labourName = `${labourFirstName || ''} ${labourLastName || ''}`.trim() || 'Labour';
                    if (labourName === 'null null') labourName = 'Labour';

                    // Prepare chat data
                    const chatData = {
                        participant1: {
                            userId: labour.user._id,
                            userType: 'Labour',
                            name: labourName,
                            profilePhoto: labour.user.profilePhoto || '',
                            mobileNumber: labour.user.mobileNumber
                        },
                        participant2: {
                            userId: requester._id,
                            userType: requesterType,
                            name: requesterName,
                            profilePhoto: requester.profilePhoto || '',
                            mobileNumber: requester.mobileNumber
                        },
                        relatedRequest: {
                            requestId: hireRequest._id,
                            requestType: 'HireRequest'  // ✅ Matches Chat.model.js enum
                        }
                    };

                    console.log('📦 Chat Data:', JSON.stringify(chatData, null, 2));

                    // Create chat
                    const chat = await createChatFromRequest(chatData);

                    // Link chat to hire request
                    hireRequest.chatId = chat._id;
                    console.log('✅ Chat created and linked:', chat._id);
                }
            } catch (chatError) {
                // Log error but don't block the acceptance — chat can be created later
                console.error('⚠️ Chat creation failed (non-blocking):', chatError.message);
            }
        }

        await hireRequest.save();

        // Send push notification to Requester (User/Contractor)
        if (hireRequest.requesterId) {
            await sendNotificationToUser(hireRequest.requesterId.toString(), {
                title: `Hire Request ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
                body: `${labour.user.firstName} ${labour.user.lastName} has ${status} your hire request.`,
                data: {
                    type: 'hire_request_update',
                    requestId: hireRequest._id.toString(),
                    status: status,
                    link: hireRequest.requesterModel === 'User' ? '/user/requests' : '/contractor/requests'
                }
            });
        }

        console.log('✅ Hire request updated successfully');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: `Hire request ${status} successfully`,
            data: { hireRequest }
        });
    } catch (error) {
        console.error('❌ Update hire request status error:', error);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to update hire request status',
            error: error.message
        });
    }
};

// @desc    Delete hire request
// @route   DELETE /api/labour/hire-request/:id
// @access  Private
export const deleteHireRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const hireRequest = await HireRequest.findById(id);
        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        // Verify user owns this request
        if (hireRequest.requesterId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this request'
            });
        }

        await hireRequest.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Hire request deleted successfully'
        });
    } catch (error) {
        console.error('Delete hire request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hire request',
            error: error.message
        });
    }
};


// @desc    Get labour's application history (accepted/rejected applications)
// @route   GET /api/labour/application-history
// @access  Private
export const getLabourApplicationHistory = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET LABOUR APPLICATION HISTORY =====');
        console.log('User ID:', req.user._id);

        // Find labour profile
        const labour = await Labour.findOne({ user: req.user._id });
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Import Job and ContractorJob models
        const Job = (await import('../../user/models/Job.model.js')).default;
        const ContractorJob = (await import('../../contractor/models/ContractorJob.model.js')).default;

        console.log('✅ Labour profile found:', labour._id);

        // Find all user jobs where labour applied
        const userJobs = await Job.find({ isActive: true });
        
        // Find all contractor jobs where labour applied
        const contractorJobs = await ContractorJob.find({ isActive: true });

        console.log('✅ Searching through', userJobs.length, 'user jobs and', contractorJobs.length, 'contractor jobs');

        const history = [];

        // Extract accepted/rejected applications from user jobs
        userJobs.forEach(job => {
            job.applications.forEach(app => {
                if ((app.status === 'Accepted' || app.status === 'Rejected') && 
                    app.applicant && app.applicant.toString() === req.user._id.toString()) {
                    
                    // Format date and time
                    const appliedDate = new Date(app.appliedAt);
                    const formattedDate = appliedDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                    const formattedTime = appliedDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    history.push({
                        id: app._id.toString(),
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: job.jobTitle,
                        category: job.category,
                        userName: app.applicantName,
                        phoneNumber: app.phoneNumber,
                        location: app.location || 'Not specified',
                        message: app.message,
                        appliedAt: app.appliedAt,
                        date: formattedDate,
                        time: formattedTime,
                        status: app.status.toLowerCase(),
                        type: 'user'
                    });
                }
            });
        });

        // Extract accepted/rejected applications from contractor jobs
        contractorJobs.forEach(job => {
            job.applications.forEach(app => {
                if ((app.status === 'Accepted' || app.status === 'Rejected') && 
                    app.labour && app.labour.toString() === labour._id.toString()) {
                    
                    // Format date and time
                    const appliedDate = new Date(app.appliedAt);
                    const formattedDate = appliedDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                    const formattedTime = appliedDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    history.push({
                        id: app._id.toString(),
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: `${job.labourSkill} - ${job.city}`,
                        category: job.labourSkill,
                        contractorName: job.contractorName,
                        phoneNumber: job.phoneNumber,
                        location: job.city || 'Not specified',
                        message: app.message,
                        appliedAt: app.appliedAt,
                        date: formattedDate,
                        time: formattedTime,
                        status: app.status.toLowerCase(),
                        type: 'contractor'
                    });
                }
            });
        });

        // Sort by most recent first
        history.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        console.log('✅ Found', history.length, 'history items');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                history,
                count: history.length
            }
        });
    } catch (error) {
        console.error('❌ GET LABOUR APPLICATION HISTORY ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};


// @desc    Submit feedback
// @route   POST /api/labour/feedback
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

        // Find labour profile for this user
        const labour = await Labour.findOne({ userId: req.user._id });
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        const feedback = await Feedback.create({
            entityType: 'labour',
            entityId: labour._id,
            entityModel: 'Labour',
            rating,
            comment,
            givenBy: req.user._id,
            givenByModel: 'User'
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: { feedback }
        });
    } catch (error) {
        next(error);
    }
};
