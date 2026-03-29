import Labour from '../../labour/models/Labour.model.js';
import User from '../../user/models/User.model.js';
import Request from '../models/Request.model.js';
import Feedback from '../models/Feedback.model.js';
import HireRequest from '../../labour/models/HireRequest.model.js';
import ContractorJob from '../../contractor/models/ContractorJob.model.js';

// @desc    Get all labours
// @route   GET /api/admin/labours
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getAllLabours = async (req, res) => {
    try {
        console.log('\n🔵 ===== GET ALL LABOURS =====');
        const { page = 1, limit = 10, status, trade, search } = req.query;

        const query = {};

        if (status) {
            query.isActive = status === 'Active';
        }

        if (trade) {
            query.skillType = trade; // Labour model uses skillType, not trade
        }

        if (search) {
            // Search in skillType field of Labour model
            query.$or = [
                { skillType: { $regex: search, $options: 'i' } },
                { experience: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('Query:', JSON.stringify(query));

        const labours = await Labour.find(query)
            .populate('user', 'mobileNumber')
            .select('-__v')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        console.log('Found labours:', labours.length);
        if (labours.length > 0) {
            console.log('Sample labour:', JSON.stringify(labours[0], null, 2));
        }

        const total = await Labour.countDocuments(query);

        // Fetch unread feedback counts for each labour
        const laboursWithCounts = await Promise.all(labours.map(async (labour) => {
            const unreadCount = await Feedback.countDocuments({
                entityId: labour._id,
                entityType: 'labour',
                isRead: false
            });
            return {
                ...labour.toObject(),
                unreadFeedbackCount: unreadCount
            };
        }));

        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                labours: laboursWithCounts,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching labours',
            error: error.message
        });
    }
};

// @desc    Get labour by ID
// @route   GET /api/admin/labours/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getLabourById = async (req, res) => {
    try {
        const labour = await Labour.findById(req.params.id)
            .populate('user', 'mobileNumber aadharNumber profilePhoto')
            .select('-__v');

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
        res.status(500).json({
            success: false,
            message: 'Server error fetching labour',
            error: error.message
        });
    }
};

// @desc    Create new labour
// @route   POST /api/admin/labours
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const createLabour = async (req, res) => {
    try {
        const { mobileNumber, firstName, lastName, skillType, gender, city, state, experience } = req.body;

        // Check if user exists with this mobile number
        let user = await User.findOne({ mobileNumber });
        
        if (!user) {
            // Create new user with only mobileNumber and userType
            user = await User.create({
                mobileNumber,
                userType: 'Labour',
                isActive: true
            });
        } else {
            // Only set userType if not already set
            if (!user.userType) {
                user.userType = 'Labour';
                await user.save();
            }
        }

        // Check if labour profile already exists for this user
        const existingLabour = await Labour.findOne({ user: user._id });
        if (existingLabour) {
            return res.status(400).json({
                success: false,
                message: 'Labour profile already exists for this user'
            });
        }

        // Create labour profile with all personal details
        const labour = await Labour.create({
            user: user._id,
            firstName: firstName || '',
            lastName: lastName || '',
            gender: gender || '',
            city: city || '',
            state: state || '',
            skillType: skillType || 'Other',
            experience: experience || '',
            isActive: true
        });

        // Populate user data before sending response
        await labour.populate('user', 'mobileNumber');

        res.status(201).json({
            success: true,
            message: 'Labour created successfully',
            data: { labour }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error creating labour',
            error: error.message
        });
    }
};

// @desc    Update labour
// @route   PUT /api/admin/labours/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const updateLabour = async (req, res) => {
    try {
        const { firstName, lastName, skillType, trade, gender, city, state, isActive, experience } = req.body;

        const labour = await Labour.findById(req.params.id).populate('user');

        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        // Update labour fields directly (not user fields)
        if (firstName !== undefined) labour.firstName = firstName;
        if (lastName !== undefined) labour.lastName = lastName;
        if (gender !== undefined) labour.gender = gender;
        if (city !== undefined) labour.city = city;
        if (state !== undefined) labour.state = state;
        if (skillType !== undefined) labour.skillType = skillType;
        if (trade !== undefined) labour.skillType = trade; // trade maps to skillType
        if (experience !== undefined) labour.experience = experience;
        if (isActive !== undefined) labour.isActive = isActive;

        await labour.save();
        await labour.populate('user', 'mobileNumber');

        res.status(200).json({
            success: true,
            message: 'Labour updated successfully',
            data: { labour }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating labour',
            error: error.message
        });
    }
};

// @desc    Delete labour
// @route   DELETE /api/admin/labours/:id
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const deleteLabour = async (req, res) => {
    try {
        const labour = await Labour.findById(req.params.id);

        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        await labour.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Labour deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error deleting labour',
            error: error.message
        });
    }
};

// @desc    Get labour contractor requests
// @route   GET /api/admin/labours/:id/contractor-requests
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getLabourContractorRequests = async (req, res) => {
    try {
        console.log('\n🔵 ===== GET LABOUR CONTRACTOR REQUESTS =====');
        console.log('👤 Labour ID:', req.params.id);

        // First get the labour to find the user ID
        const labour = await Labour.findById(req.params.id).populate('user');
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        console.log('✅ Found labour:', labour.user?.firstName, labour.user?.lastName);

        // Find all contractor jobs where this labour has applied
        const contractorJobs = await ContractorJob.find({
            'applications.labour': req.params.id
        })
        .populate('contractor', 'businessName mobileNumber city')
        .sort({ createdAt: -1 });

        // Extract application details for this labour
        const requests = contractorJobs.map(job => {
            const application = job.applications.find(
                app => app.labour.toString() === req.params.id
            );
            
            return {
                _id: application._id,
                jobId: job._id,
                contractorName: job.contractorName || job.contractor?.businessName || 'N/A',
                contractorPhone: job.phoneNumber || job.contractor?.mobileNumber || 'N/A',
                contractorCity: job.city || job.contractor?.city || 'N/A',
                businessType: job.businessType || 'N/A',
                businessName: job.businessName || 'N/A',
                labourSkill: job.labourSkill,
                experience: job.experience || 'N/A',
                status: application.status,
                appliedAt: application.appliedAt,
                respondedAt: application.respondedAt,
                message: application.message || '',
                createdAt: job.createdAt,
                updatedAt: job.updatedAt
            };
        });

        console.log('✅ Found', requests.length, 'contractor job applications');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: { 
                requests: requests,
                total: requests.length
            }
        });

    } catch (error) {
        console.error('❌ GET LABOUR CONTRACTOR REQUESTS ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Server error fetching contractor requests',
            error: error.message
        });
    }
};

// @desc    Get labour user requests
// @route   GET /api/admin/labours/:id/user-requests
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getLabourUserRequests = async (req, res) => {
    try {
        console.log('\n🔵 ===== GET LABOUR USER REQUESTS =====');
        console.log('👤 Labour ID:', req.params.id);

        // First get the labour to find the user ID
        const labour = await Labour.findById(req.params.id).populate('user');
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                message: 'Labour not found'
            });
        }

        console.log('✅ Found labour:', labour.user?.firstName, labour.user?.lastName);
        console.log('   User ID:', labour.user?._id);

        // Get hire requests where this labour received requests from users
        const userRequests = await HireRequest.find({
            labourId: req.params.id,
            requesterModel: 'User'
        })
        .sort({ createdAt: -1 });

        console.log('✅ Found', userRequests.length, 'user requests');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: { 
                requests: userRequests,
                total: userRequests.length
            }
        });

    } catch (error) {
        console.error('❌ GET LABOUR USER REQUESTS ERROR:', error.message);
        console.log('===========================\n');
        res.status(500).json({
            success: false,
            message: 'Server error fetching user requests',
            error: error.message
        });
    }
};

// @desc    Get labour feedbacks
// @route   GET /api/admin/labours/:id/feedbacks
// @access  Private (SUPER_ADMIN, ADMIN_LABOUR)
export const getLabourFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({
            entityId: req.params.id,
            entityType: 'labour'
        }).sort({ createdAt: -1 });

        // Mark as read
        await Feedback.updateMany(
            { entityId: req.params.id, entityType: 'labour', isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            data: { feedbacks }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching feedbacks',
            error: error.message
        });
    }
};
