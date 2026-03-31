import Contractor from '../models/Contractor.model.js';
import ContractorJob from '../models/ContractorJob.model.js';
import User from '../../user/models/User.model.js';
import Labour from '../../labour/models/Labour.model.js';
import { sendNotificationToUser, sendNotificationToMultipleUsers } from '../../../utils/notificationHelper.js';
import ContractorHireRequest from '../models/ContractorHireRequest.model.js';
import Notification from '../../../models/Notification.model.js';
import Admin from '../../admin/models/Admin.model.js';
import Feedback from '../../admin/models/Feedback.model.js';

// @desc    Create contractor profile (during registration)
// @route   POST /api/contractor/profile
// @access  Private
export const createContractorProfile = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== CREATE CONTRACTOR PROFILE =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user._id);

        const {
            firstName,
            middleName,
            lastName,
            gender,
            dob,
            city,
            state,
            address,
            mobileNumber,
            aadharNumber
        } = req.body;

        // Update User model with personal details so push notifications and admin panel work correctly
        const user = await User.findById(req.user._id);
        if (user) {
            // Sync name fields — required for push notifications (e.g. "Raju has accepted your request")
            if (firstName) user.firstName = firstName;
            if (middleName !== undefined) user.middleName = middleName;
            if (lastName) user.lastName = lastName;
            if (gender) user.gender = gender;
            if (dob) user.dob = dob;

            // Sync location info
            if (city) user.city = city;
            if (state) user.state = state;
            if (address) user.address = address;
            if (!user.userType) user.userType = 'Contractor';

            await user.save();
            console.log('✅ User details updated (Name/Location/Type):', {
                firstName: user.firstName,
                lastName: user.lastName,
                city: user.city,
                userType: user.userType
            });
        }

        // Check if contractor profile already exists
        let contractor = await Contractor.findOne({ user: req.user._id });

        if (!contractor) {
            console.log('✨ Creating new contractor profile...');
            contractor = await Contractor.create({
                user: req.user._id,
                firstName: firstName || '',
                middleName: middleName || '',
                lastName: lastName || '',
                city: city || '',
                state: state || '',
                isActive: true,
                profileCompletionStatus: 'basic'
            });
            console.log('✅ Contractor profile created:', contractor._id);
        } else {
            console.log('🔄 Contractor profile already exists:', contractor._id);
            // Update basic info if provided
            if (firstName) contractor.firstName = firstName;
            if (middleName) contractor.middleName = middleName;
            if (lastName) contractor.lastName = lastName;
            if (city) contractor.city = city;
            if (state) contractor.state = state;
            if (aadharNumber) contractor.aadharNumber = aadharNumber;
            if (contractor.profileCompletionStatus === 'incomplete') {
                contractor.profileCompletionStatus = 'basic';
            }
            await contractor.save();
        }

        // Populate user data
        await contractor.populate('user', 'firstName lastName mobileNumber city state gender');

        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Contractor profile created successfully',
            data: { contractor }
        });
    } catch (error) {
        console.error('❌ CREATE CONTRACTOR PROFILE ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const updateBusinessDetails = async (req, res, next) => {
    try {
        console.log('\n🟡 ===== UPDATE CONTRACTOR BUSINESS DETAILS =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user._id);
        
        const {
            businessType,
            businessName,
            city,
            state,
            addressLine1,
            landmark,
            aadharNumber
        } = req.body;

        let contractor = await Contractor.findOne({ user: req.user._id });

        if (!contractor) {
            console.log('✨ Creating new contractor profile...');
            contractor = await Contractor.create({
                user: req.user._id,
                businessType,
                businessName,
                city,
                state,
                addressLine1,
                landmark,
                profileCompletionStatus: 'complete'
            });
            console.log('✅ Contractor profile created:', contractor._id);
        } else {
            console.log('🔄 Updating existing contractor profile:', contractor._id);
            if (businessType) contractor.businessType = businessType;
            if (businessName) contractor.businessName = businessName;
            if (city) contractor.city = city;
            if (state) contractor.state = state;
            if (addressLine1) contractor.addressLine1 = addressLine1;
            if (landmark) contractor.landmark = landmark;
            if (aadharNumber) contractor.aadharNumber = aadharNumber;
            
            // Update profile completion status
            if (businessName && addressLine1) {
                contractor.profileCompletionStatus = 'complete';
            } else if (businessName || addressLine1) {
                contractor.profileCompletionStatus = 'basic';
            }

            await contractor.save();
            console.log('✅ Contractor profile updated');
        }

        // Populate user data
        await contractor.populate('user', 'firstName lastName mobileNumber');

        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Business details updated successfully',
            data: { contractor }
        });
    } catch (error) {
        console.error('❌ UPDATE BUSINESS DETAILS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getContractorProfile = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET CONTRACTOR PROFILE =====');
        console.log('👤 User ID:', req.user._id);
        
        const contractor = await Contractor.findOne({ user: req.user._id })
            .populate('user', 'firstName lastName mobileNumber profileImage city state');

        if (!contractor) {
            console.log('❌ Contractor profile not found');
            console.log('===========================\n');
            return res.status(404).json({
                success: false,
                message: 'Contractor profile not found'
            });
        }

        console.log('✅ Contractor profile found:', contractor._id);
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: { 
                contractor,
                user: contractor.user,
                // Prioritize contractor profile name, then user model name, fallback to 'Contractor'
                displayName: contractor.firstName || (contractor.user && contractor.user.firstName) || 'Contractor'
            }
        });
    } catch (error) {
        console.error('❌ GET CONTRACTOR PROFILE ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const browseContractors = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== BROWSE CONTRACTORS =====');
        
        const { city, businessType, page = 1, limit = 20 } = req.query;

        const query = { isActive: true };
        
        if (city) {
            query.city = new RegExp(city, 'i');
        }
        if (businessType) {
            query.businessType = businessType;
        }

        const contractors = await Contractor.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'firstName lastName mobileNumber profileImage');

        const total = await Contractor.countDocuments(query);

        console.log('✅ Found', contractors.length, 'contractors');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                contractors: contractors.map(c => ({
                    contractor: c,
                    user: c.user
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ BROWSE CONTRACTORS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const createContractorJob = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== CREATE CONTRACTOR JOB =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user._id);
        
        const {
            contractorName,
            phoneNumber,
            city,
            address,
            businessType,
            businessName,
            labourSkill,
            experience,
            workDuration,
            budgetType,
            budgetAmount,
            profileStatus,
            rating,
            targetAudience
        } = req.body;

        console.log('🎯 Target Audience from request:', targetAudience);

        let contractor = await Contractor.findOne({ user: req.user._id });
        
        if (!contractor) {
            console.log('✨ Creating contractor profile automatically...');
            // Create a basic contractor profile with default businessType
            contractor = await Contractor.create({
                user: req.user._id,
                businessType: 'Proprietorship', // Use valid enum value from Contractor model
                businessName: businessName || contractorName,
                city: city,
                isActive: true
            });
            console.log('✅ Contractor profile created:', contractor._id);
        }

        const contractorJob = await ContractorJob.create({
            contractor: contractor._id,
            user: req.user._id,
            contractorName,
            phoneNumber,
            city,
            address,
            businessType,
            businessName,
            labourSkill,
            experience,
            workDuration,
            budgetType,
            budgetAmount: budgetType === 'Fixed Amount' ? budgetAmount : 0,
            profileStatus: profileStatus || 'Active',
            rating: rating || 0,
            targetAudience: targetAudience || 'Both'
        });

        console.log('✅ Contractor job created:', contractorJob._id);
        console.log('🎯 Saved with Target Audience:', contractorJob.targetAudience);

        // Notify matching labourers if audience includes 'Labour'
        if (contractorJob.targetAudience === 'Labour' || contractorJob.targetAudience === 'Both') {
            try {
                const matchingLabours = await Labour.find({
                    isActive: true,
                    $or: [
                        { skillType: contractorJob.labourSkill },
                        { 'labourCardDetails.skills': new RegExp(contractorJob.labourSkill, 'i') }
                    ]
                }).populate('user', '_id');

                if (matchingLabours.length > 0) {
                    const userIds = matchingLabours
                        .filter(l => l.user && l.user._id)
                        .map(l => l.user._id.toString());
                    
                    if (userIds.length > 0) {
                        await sendNotificationToMultipleUsers(userIds, {
                            title: 'New Requirement from Contractor!',
                            body: `${contractorJob.contractorName} is looking for a ${contractorJob.labourSkill} in ${contractorJob.city}`,
                            data: {
                                type: 'new_contractor_job',
                                jobId: contractorJob._id.toString(),
                                link: '/labour/dashboard'
                            }
                        });
                        console.log(`📡 Broadcasted contractor job alert to ${userIds.length} matching labourers`);
                    }
                }
            } catch (notifierError) {
                console.error('❌ Contractor job notification error:', notifierError.message);
            }
        }

        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Contractor job created successfully',
            data: { contractorJob }
        });
    } catch (error) {
        console.error('❌ CREATE CONTRACTOR JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getContractorJobs = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET CONTRACTOR JOBS =====');
        console.log('👤 User ID:', req.user._id);
        
        const { page = 1, limit = 20, targetAudience } = req.query;
        console.log('🎯 Target Audience Filter:', targetAudience);

        // Build query
        const query = { user: req.user._id };
        
        // Filter by targetAudience if provided
        if (targetAudience) {
            query.targetAudience = targetAudience;
            console.log('✅ Filtering by targetAudience:', targetAudience);
        }

        const jobs = await ContractorJob.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ContractorJob.countDocuments(query);

        console.log('✅ Found', jobs.length, 'contractor jobs');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ GET CONTRACTOR JOBS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const browseContractorJobs = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== BROWSE CONTRACTOR JOBS =====');
        
        const { city, labourSkill, profileStatus = 'Active', page = 1, limit = 100, audience = 'Labour' } = req.query;

        const query = { isActive: true };
        
        if (city) {
            query.city = new RegExp(city, 'i');
        }
        if (labourSkill) {
            query.labourSkill = labourSkill;
        }
        if (profileStatus) {
            query.profileStatus = profileStatus;
        }
        
        // Filter by targetAudience based on who is browsing
        if (audience === 'User') {
            // User should see 'User' or 'Both' cards
            query.$or = [
                { targetAudience: 'User' },
                { targetAudience: 'Both' },
                { targetAudience: { $exists: false } } // For old data
            ];
        } else {
            // Labour should see 'Labour' or 'Both' cards (default)
            query.$or = [
                { targetAudience: 'Labour' },
                { targetAudience: 'Both' },
                { targetAudience: { $exists: false } } // For old data
            ];
        }

        const jobs = await ContractorJob.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('user', 'firstName lastName mobileNumber')
            .populate('contractor', 'businessName businessType');

        const total = await ContractorJob.countDocuments(query);

        console.log('✅ Found', jobs.length, 'contractor jobs');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('❌ BROWSE CONTRACTOR JOBS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const updateContractorJob = async (req, res, next) => {
    try {
        console.log('\n🟡 ===== UPDATE CONTRACTOR JOB =====');
        console.log('Job ID:', req.params.id);
        console.log('👤 User ID:', req.user._id);
        
        const job = await ContractorJob.findById(req.params.id);

        if (!job) {
            console.log('❌ Contractor job not found');
            console.log('===========================\n');
            return res.status(404).json({
                success: false,
                message: 'Contractor job not found'
            });
        }

        if (job.user.toString() !== req.user._id.toString()) {
            console.log('❌ Not authorized to update this job');
            console.log('===========================\n');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        const updatedJob = await ContractorJob.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        console.log('✅ Contractor job updated');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Contractor job updated successfully',
            data: { job: updatedJob }
        });
    } catch (error) {
        console.error('❌ UPDATE CONTRACTOR JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const deleteContractorJob = async (req, res, next) => {
    try {
        console.log('\n🔴 ===== DELETE CONTRACTOR JOB =====');
        console.log('Job ID:', req.params.id);
        console.log('👤 User ID:', req.user._id);
        
        const job = await ContractorJob.findById(req.params.id);

        if (!job) {
            console.log('❌ Contractor job not found');
            console.log('===========================\n');
            return res.status(404).json({
                success: false,
                message: 'Contractor job not found'
            });
        }

        if (job.user.toString() !== req.user._id.toString()) {
            console.log('❌ Not authorized to delete this job');
            console.log('===========================\n');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        await job.deleteOne();

        console.log('✅ Contractor job deleted');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Contractor job deleted successfully'
        });
    } catch (error) {
        console.error('❌ DELETE CONTRACTOR JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getContractorVerificationStatus = async (req, res, next) => {
    try {
        const contractor = await Contractor.findOne({ user: req.user._id });
        
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor profile not found'
            });
        }

        const VerificationRequest = (await import('../../admin/models/VerificationRequest.model.js')).default;
        
        const verificationRequest = await VerificationRequest.findOne({
            entityId: contractor._id,
            entityType: 'contractor'
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                isVerified: contractor.isVerified || false,
                verificationRequest: verificationRequest || null
            }
        });
    } catch (error) {
        next(error);
    }
};


// ==================== CONTRACTOR HIRE REQUEST FUNCTIONS ====================

// @desc    Create contractor hire request (User hires Contractor)
// @route   POST /api/contractor/hire-request
// @access  Private
export const createContractorHireRequest = async (req, res) => {
    try {
        const { contractorId } = req.body;
        const userId = req.user._id;

        console.log('\n🟢 ===== CREATE CONTRACTOR HIRE REQUEST =====');
        console.log('📦 contractorJobId received:', contractorId);
        console.log('👤 userId:', userId);

        // contractorId is actually the ContractorJob ID from frontend
        const contractorJob = await ContractorJob.findById(contractorId).populate('contractor');
        
        if (!contractorJob) {
            console.log('❌ ContractorJob not found');
            return res.status(404).json({
                success: false,
                message: 'Contractor job not found'
            });
        }

        const contractor = contractorJob.contractor;

        // Populate contractor user details if not already populated
        let contractorWithUser = contractor;
        if (!contractor.user || !contractor.user.firstName) {
            contractorWithUser = await Contractor.findById(contractor._id).populate('user');
        }

        console.log('✅ ContractorJob found:', contractorJob._id);
        console.log('✅ Contractor found:', contractorWithUser._id);

        // Get requester (user) details
        const requester = await User.findById(userId);
        if (!requester) {
            console.log('❌ User not found');
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ Requester found:', requester._id);

        // Check if request already exists for this specific ContractorJob
        const existingRequest = await ContractorHireRequest.findOne({
            contractorJobId: contractorJob._id,
            requesterId: userId,
            status: 'pending'
        });

        if (existingRequest) {
            console.log('⚠️ Request already exists for this job');
            return res.status(400).json({
                success: false,
                message: 'Hire request already exists for this contractor job'
            });
        }

        // Create hire request with both contractor ID and contractorJob ID
        const getSafeName = (u, defaultName = 'User') => {
            const first = u.firstName || '';
            const last = u.lastName || '';
            const full = `${first || ''} ${last || ''}`.trim();
            return (full && full !== 'null null') ? full : defaultName;
        };

        const hireRequest = await ContractorHireRequest.create({
            contractorId: contractorWithUser._id,
            contractorJobId: contractorJob._id,
            contractorName: getSafeName(contractorWithUser.user, 'Contractor'),
            contractorPhone: contractorWithUser.user.mobileNumber,
            contractorBusiness: contractorWithUser.businessName || 'N/A',
            contractorCity: contractorWithUser.user.city || 'N/A',
            requesterId: userId,
            requesterName: getSafeName(requester, 'User'),
            requesterPhone: requester.mobileNumber,
            requesterLocation: requester.city || 'N/A'
        });

        // Send push notification to Contractor
        if (contractorWithUser.user && contractorWithUser.user._id) {
            await sendNotificationToUser(contractorWithUser.user._id.toString(), {
                title: 'New Hire Request',
                body: `${requester.firstName} ${requester.lastName} wants to hire you for a project.`,
                data: {
                    type: 'contractor_hire_request',
                    id: hireRequest._id.toString(),
                    link: '/contractor/requests'
                }
            });
        }

        console.log('✅ Hire request created:', hireRequest._id);
        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Contractor hire request created successfully',
            data: { hireRequest }
        });
    } catch (error) {
        console.error('❌ Create contractor hire request error:', error);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to create contractor hire request',
            error: error.message
        });
    }
};

// @desc    Get contractor hire requests (received by contractor)
// @route   GET /api/contractor/hire-requests
// @access  Private
export const getContractorHireRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        // Find contractor profile
        const contractor = await Contractor.findOne({ user: userId });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor profile not found'
            });
        }

        // Build query
        const query = { contractorId: contractor._id };
        if (status) query.status = status;

        const hireRequests = await ContractorHireRequest.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                hireRequests,
                count: hireRequests.length
            }
        });
    } catch (error) {
        console.error('Get contractor hire requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get contractor hire requests',
            error: error.message
        });
    }
};

// @desc    Get sent contractor hire requests (sent by user)
// @route   GET /api/contractor/hire-requests/sent
// @access  Private
export const getSentContractorHireRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log('\n🔵 ===== GET SENT CONTRACTOR HIRE REQUESTS =====');
        console.log('👤 userId:', userId);

        const hireRequests = await ContractorHireRequest.find({ requesterId: userId })
            .select('contractorId contractorJobId status chatId createdAt updatedAt')
            .sort({ createdAt: -1 });

        console.log('📊 Found', hireRequests.length, 'hire requests');

        // Return contractorJobId for frontend matching
        const formattedRequests = hireRequests.map((req) => {
            console.log(`Request: ContractorJob ${req.contractorJobId} → status: ${req.status}`);

            return {
                _id: req._id,
                contractorId: req.contractorJobId.toString(), // Return ContractorJob ID for frontend matching
                status: req.status,
                chatId: req.chatId,
                createdAt: req.createdAt,
                updatedAt: req.updatedAt
            };
        });

        console.log('✅ Formatted requests:', formattedRequests.length);
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                hireRequests: formattedRequests,
                count: formattedRequests.length
            }
        });
    } catch (error) {
        console.error('❌ Get sent contractor hire requests error:', error);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to get sent contractor hire requests',
            error: error.message
        });
    }
};

// @desc    Update contractor hire request status (accept/decline)
// @route   PATCH /api/contractor/hire-request/:id
// @desc    Update contractor hire request status (accept/decline)
// @route   PATCH /api/contractor/hire-request/:id
// @access  Private
export const updateContractorHireRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        console.log('\n🟡 ===== UPDATE CONTRACTOR HIRE REQUEST STATUS =====');
        console.log('Request ID:', id);
        console.log('New Status:', status);
        console.log('Contractor User ID:', userId);

        // Validate status
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Find hire request
        const hireRequest = await ContractorHireRequest.findById(id);
        if (!hireRequest) {
            return res.status(404).json({
                success: false,
                message: 'Hire request not found'
            });
        }

        // Verify contractor owns this request
        const contractor = await Contractor.findOne({ user: userId }).populate('user');
        if (!contractor || contractor._id.toString() !== hireRequest.contractorId.toString()) {
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

            // Import chat controller
            const { createChatFromRequest } = await import('../../../controllers/chat.controller.js');

            // Get requester (User) details
            const requester = await User.findById(hireRequest.requesterId);

            if (!requester) {
                console.log('❌ Requester not found');
                return res.status(404).json({
                    success: false,
                    message: 'Requester not found'
                });
            }

            // Prepare chat data
            const getSafeName = (u, defaultName = 'User') => {
                const first = u.firstName || '';
                const last = u.lastName || '';
                const full = `${first || ''} ${last || ''}`.trim();
                return (full && full !== 'null null') ? full : defaultName;
            };

            const chatData = {
                participant1: {
                    userId: contractor.user._id,
                    userType: 'Contractor',
                    name: getSafeName(contractor.user, 'Contractor'),
                    profilePhoto: contractor.user.profilePhoto || '',
                    mobileNumber: contractor.user.mobileNumber
                },
                participant2: {
                    userId: requester._id,
                    userType: 'User',
                    name: getSafeName(requester, 'User'),
                    profilePhoto: requester.profilePhoto || '',
                    mobileNumber: requester.mobileNumber
                },
                relatedRequest: {
                    requestId: hireRequest._id,
                    requestType: 'ContractorHireRequest'
                }
            };

            console.log('📦 Chat Data:', JSON.stringify(chatData, null, 2));

            // Create chat
            const chat = await createChatFromRequest(chatData);

            // Link chat to hire request
            hireRequest.chatId = chat._id;
            console.log('✅ Chat created and linked:', chat._id);
        }

        await hireRequest.save();

        // Send push notification to Requester (User)
        if (hireRequest.requesterId) {
            await sendNotificationToUser(hireRequest.requesterId.toString(), {
                title: `Hire Request ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
                body: `${contractor.user.firstName} ${contractor.user.lastName} has ${status} your hire request.`,
                data: {
                    type: 'contractor_hire_request_update',
                    requestId: hireRequest._id.toString(),
                    status: status,
                    link: '/user/requests'
                }
            });
        }

        console.log('✅ Contractor hire request updated successfully');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: `Contractor hire request ${status} successfully`,
            data: { hireRequest }
        });
    } catch (error) {
        console.error('❌ Update contractor hire request status error:', error);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Failed to update contractor hire request status',
            error: error.message
        });
    }
};

// @desc    Delete contractor hire request
// @route   DELETE /api/contractor/hire-request/:id
// @access  Private
export const deleteContractorHireRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const hireRequest = await ContractorHireRequest.findById(id);
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
            message: 'Contractor hire request deleted successfully'
        });
    } catch (error) {
        console.error('Delete contractor hire request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete contractor hire request',
            error: error.message
        });
    }
};

// ==================== CONTRACTOR JOB APPLICATION FUNCTIONS ====================


// @desc    Apply to contractor job (Labour applies to contractor's job)
// @route   POST /api/contractor/jobs/:id/apply
// @access  Private
export const applyToContractorJob = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== APPLY TO CONTRACTOR JOB =====');
        console.log('Job ID:', req.params.id);
        console.log('Labour ID:', req.user._id);

        const job = await ContractorJob.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Contractor job not found'
            });
        }

        if (job.profileStatus !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications'
            });
        }

        // Find labour profile
        const labour = await Labour.findOne({ user: req.user._id }).populate('user');
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Check if already applied
        const alreadyApplied = job.applications.some(
            app => app.labour && app.labour.toString() === labour._id.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job'
            });
        }

        // Add application
        job.applications.push({
            labour: labour._id,
            status: 'Pending',
            message: req.body.message || ''
        });

        await job.save();

        // Send push notification to Contractor (Job Owner)
        if (job.user) {
            await sendNotificationToUser(job.user.toString(), {
                title: 'New Job Application',
                body: `${labour.user.firstName} ${labour.user.lastName} has applied for your requirement: ${job.labourSkill}`,
                data: {
                    type: 'contractor_job_application',
                    jobId: job._id.toString(),
                    link: '/contractor/requests'
                }
            });
        }

        console.log('✅ Application submitted successfully');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Application submitted successfully',
            data: { job }
        });
    } catch (error) {
        console.error('❌ APPLY TO CONTRACTOR JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

// @desc    Get labour applications for contractor's jobs
// @route   GET /api/contractor/job-applications
// @access  Private
export const getContractorJobApplications = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET CONTRACTOR JOB APPLICATIONS =====');
        console.log('User ID:', req.user._id);

        // Find all jobs posted by this contractor
        const jobs = await ContractorJob.find({ user: req.user._id, isActive: true })
            .populate({
                path: 'applications.labour',
                populate: { path: 'user', select: 'firstName lastName mobileNumber city' }
            });

        console.log('✅ Found', jobs.length, 'jobs');

        // Extract all pending applications
        const applications = [];
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                if (app.status === 'Pending' && app.labour) {
                    // Fetch data from Labour model directly, not from User model
                    const labourFirstName = app.labour.firstName || app.labour.user?.firstName || '';
                    const labourLastName = app.labour.lastName || app.labour.user?.lastName || '';
                    const labourCity = app.labour.city || app.labour.user?.city || 'Not specified';
                    const labourPhone = app.labour.user?.mobileNumber || '5555555555';
                    
                    applications.push({
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: `${job.labourSkill} - ${job.city}`,
                        labourId: app.labour._id,
                        labourName: `${labourFirstName} ${labourLastName}`.trim() || 'Labour',
                        phoneNumber: labourPhone,
                        location: labourCity,
                        skillType: app.labour.skillType || 'Not specified',
                        experience: app.labour.experience || 'Not specified',
                        message: app.message,
                        appliedAt: app.appliedAt,
                        status: app.status
                    });
                }
            });
        });

        console.log('✅ Found', applications.length, 'pending applications');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                applications,
                count: applications.length
            }
        });
    } catch (error) {
        console.error('❌ GET CONTRACTOR JOB APPLICATIONS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

// @desc    Get labour's own applications to contractor jobs
// @route   GET /api/contractor/my-applications
// @access  Private
export const getLabourApplications = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET LABOUR APPLICATIONS =====');
        console.log('User ID:', req.user._id);

        // Find labour profile
        const labour = await Labour.findOne({ user: req.user._id });
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour profile not found'
            });
        }

        // Find all contractor jobs and filter applications by this labour
        const jobs = await ContractorJob.find({ isActive: true });

        console.log('✅ Searching through', jobs.length, 'contractor jobs');

        // Extract applications made by this labour
        const myApplications = {};
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                if (app.labour && app.labour.toString() === labour._id.toString()) {
                    myApplications[job._id.toString()] = {
                        jobId: job._id.toString(),
                        applicationId: app._id.toString(),
                        status: app.status,
                        appliedAt: app.appliedAt,
                        chatId: app.chatId || null  // ✅ Include chatId
                    };
                }
            });
        });

        console.log('✅ Found', Object.keys(myApplications).length, 'applications by this labour');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                applications: myApplications,
                count: Object.keys(myApplications).length
            }
        });
    } catch (error) {
        console.error('❌ GET LABOUR APPLICATIONS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

// @desc    Update contractor job application status
// @route   PATCH /api/contractor/jobs/:jobId/applications/:applicationId
// @access  Private
export const updateContractorJobApplicationStatus = async (req, res, next) => {
    try {
        console.log('\n🟡 ===== UPDATE CONTRACTOR JOB APPLICATION STATUS =====');
        console.log('Job ID:', req.params.jobId);
        console.log('Application ID:', req.params.applicationId);
        console.log('New Status:', req.body.status);

        const job = await ContractorJob.findById(req.params.jobId)
            .populate('contractor')
            .populate({
                path: 'applications.labour',
                populate: { path: 'user', select: 'firstName lastName mobileNumber profilePhoto' }
            });

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Contractor job not found'
            });
        }

        // Check if user owns this job
        if (job.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update applications for this job'
            });
        }

        // Find and update application
        const application = job.applications.id(req.params.applicationId);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.status = req.body.status;

        // ✅ CREATE CHAT AUTOMATICALLY when status is Accepted
        if (req.body.status === 'Accepted' && !application.chatId) {
            console.log('✅ Status is Accepted, creating chat...');

            try {
                // Import chat controller
                const { createChatFromRequest } = await import('../../../controllers/chat.controller.js');

                // Get contractor user details (base user for mobile/photo)
                const contractorUser = await User.findById(job.user);
                if (!contractorUser) {
                    console.log('❌ Contractor user not found');
                    return res.status(404).json({
                        success: false,
                        message: 'Contractor user not found'
                    });
                }

                // Get contractor profile for role-specific name (identity isolation)
                const contractorProfile = await Contractor.findOne({ user: job.user });
                const contractorFirstName = (contractorProfile && contractorProfile.firstName) || contractorUser.firstName || 'Contractor';
                const contractorLastName = (contractorProfile && contractorProfile.lastName) || contractorUser.lastName || '';
                const contractorName = `${contractorFirstName} ${contractorLastName}`.trim();

                // Get labour details
                const labour = application.labour;
                if (!labour || !labour.user) {
                    console.log('❌ Labour not found in application');
                    return res.status(404).json({
                        success: false,
                        message: 'Labour not found'
                    });
                }

                // Get labour name from Labour model (identity isolation)
                const labourFirstName = labour.firstName || labour.user.firstName || 'Labour';
                const labourLastName = labour.lastName || labour.user.lastName || '';
                const labourName = `${labourFirstName} ${labourLastName}`.trim();

                // Prepare chat data - requestType MUST match Chat.model.js enum
                const chatData = {
                    participant1: {
                        userId: contractorUser._id,
                        userType: 'Contractor',
                        name: contractorName,
                        profilePhoto: contractorUser.profilePhoto || '',
                        mobileNumber: contractorUser.mobileNumber
                    },
                    participant2: {
                        userId: labour.user._id,
                        userType: 'Labour',
                        name: labourName,
                        profilePhoto: labour.user.profilePhoto || '',
                        mobileNumber: labour.user.mobileNumber
                    },
                    relatedRequest: {
                        requestId: application._id,
                        requestType: 'ContractorHireRequest'  // ✅ Must match Chat.model.js enum
                    }
                };

                console.log('📦 Chat Data:', JSON.stringify(chatData, null, 2));

                // Create chat
                const chat = await createChatFromRequest(chatData);

                // Link chat to application
                application.chatId = chat._id;
                console.log('✅ Chat created and linked:', chat._id);
            } catch (chatError) {
                // Log error but don't block the acceptance — chat can be created later
                console.error('⚠️ Chat creation failed (non-blocking):', chatError.message);
            }
        }

        await job.save();

        // Send push notification to Applicant (Labour)
        if (application.labour && application.labour.user) {
            await sendNotificationToUser(application.labour.user._id.toString(), {
                title: `Application ${req.body.status}`,
                body: `Your application for ${job.labourSkill} has been ${req.body.status.toLowerCase()}.`,
                data: {
                    type: 'contractor_job_application_update',
                    jobId: job._id.toString(),
                    applicationId: application._id.toString(),
                    status: req.body.status,
                    link: '/labour/requests'
                }
            });
        }

        console.log('✅ Application status updated');
        console.log('📤 Returning application with chatId:', application.chatId);
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            data: { 
                application: {
                    _id: application._id,
                    status: application.status,
                    chatId: application.chatId,
                    appliedAt: application.appliedAt
                }
            }
        });
    } catch (error) {
        console.error('❌ UPDATE APPLICATION STATUS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

// @desc    Get contractor's application history
// @route   GET /api/contractor/application-history
// @access  Private
export const getContractorApplicationHistory = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET CONTRACTOR APPLICATION HISTORY =====');
        console.log('User ID:', req.user._id);

        // Find contractor profile
        const contractor = await Contractor.findOne({ user: req.user._id });
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor profile not found'
            });
        }

        // Find all jobs posted by this contractor
        const jobs = await ContractorJob.find({ user: req.user._id, isActive: true })
            .populate({
                path: 'applications.labour',
                populate: { path: 'user', select: 'firstName lastName mobileNumber city' }
            });

        console.log('✅ Found', jobs.length, 'jobs');

        // Extract all accepted/rejected applications from workers
        const history = [];
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                if ((app.status === 'Accepted' || app.status === 'Rejected') && app.labour) {
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

                    // Fetch data from Labour model directly, not from User model
                    const labourFirstName = app.labour.firstName || app.labour.user?.firstName || '';
                    const labourLastName = app.labour.lastName || app.labour.user?.lastName || '';
                    const labourCity = app.labour.city || app.labour.user?.city || 'Not specified';
                    const labourPhone = app.labour.user?.mobileNumber || '5555555555';

                    history.push({
                        id: app._id.toString(),
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: `${job.labourSkill} - ${job.city}`,
                        labourId: app.labour._id,
                        workerName: `${labourFirstName} ${labourLastName}`.trim() || 'Labour',
                        phoneNumber: labourPhone,
                        location: labourCity,
                        skillType: app.labour.skillType || 'Not specified',
                        category: app.labour.skillType || 'Not specified',
                        experience: app.labour.experience || 'Not specified',
                        message: app.message,
                        appliedAt: app.appliedAt,
                        date: formattedDate,
                        time: formattedTime,
                        status: app.status.toLowerCase(),
                        chatId: app.chatId,
                        applicantUserId: app.labour.user?._id,
                        type: 'worker'
                    });
                }
            });
        });

        // Get all accepted/declined user hire requests for this contractor
        const userHireRequests = await ContractorHireRequest.find({
            contractorId: contractor._id,
            status: { $in: ['accepted', 'declined'] }
        }).sort({ updatedAt: -1 });

        console.log('✅ Found', userHireRequests.length, 'user hire requests');

        // Add user hire requests to history
        userHireRequests.forEach(req => {
            const requestDate = new Date(req.createdAt);
            const formattedDate = requestDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            const formattedTime = requestDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            history.push({
                id: req._id.toString(),
                _id: req._id,
                requestId: req._id,
                userName: req.requesterName,
                workerName: req.requesterName, // For consistent UI
                phoneNumber: req.requesterPhone,
                location: req.requesterLocation,
                appliedAt: req.createdAt,
                date: formattedDate,
                time: formattedTime,
                status: req.status,
                chatId: req.chatId,
                requesterUserId: req.requesterId,
                type: 'user'
            });
        });

        // Sort by most recent first
        history.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        console.log('✅ Total history items:', history.length);
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                history,
                count: history.length
            }
        });
    } catch (error) {
        console.error('❌ GET CONTRACTOR APPLICATION HISTORY ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};


// @desc    Submit feedback
// @route   POST /api/contractor/feedback
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

        // Find contractor profile for this user
        const contractor = await Contractor.findOne({ userId: req.user._id });
        
        if (!contractor) {
            return res.status(404).json({
                success: false,
                message: 'Contractor profile not found'
            });
        }

        const feedback = await Feedback.create({
            entityType: 'contractor',
            entityId: contractor._id,
            entityModel: 'Contractor',
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
                    title: 'New Feedback Received (Contractor)',
                    message: `${contractor.businessName || contractor.firstName || 'A contractor'} has submitted a new feedback.`,
                    type: 'info',
                    priority: 'MEDIUM',
                    metadata: {
                        type: 'FEEDBACK_RECEIVED',
                        senderId: contractor._id, // Send contractor model Id as they represent the entity in management
                        senderRole: 'CONTRACTOR',
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
