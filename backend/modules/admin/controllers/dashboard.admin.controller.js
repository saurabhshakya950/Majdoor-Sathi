import User from '../../user/models/User.model.js';
import Labour from '../../labour/models/Labour.model.js';
import Contractor from '../../contractor/models/Contractor.model.js';
import Request from '../models/Request.model.js';
import VerificationRequest from '../models/VerificationRequest.model.js';
import HireRequest from '../../labour/models/HireRequest.model.js';
import ContractorHireRequest from '../../contractor/models/ContractorHireRequest.model.js';
import ContractorJob from '../../contractor/models/ContractorJob.model.js';

// @desc    Get dashboard analytics
// @route   GET /api/admin/dashboard/analytics
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
    try {
        console.log('📊 Fetching dashboard analytics...');

        // Get counts - Only count actual users (not Labour or Contractor)
        const totalUsers = await User.countDocuments({ 
            userType: { $in: ['User', null] }
        });
        const totalLabours = await Labour.countDocuments();
        const totalContractors = await Contractor.countDocuments();
        
        // Count active requests from all sources
        const activeLabourHireRequests = await HireRequest.countDocuments({ 
            status: { $regex: /^pending$/i } 
        });
        const activeContractorHireRequests = await ContractorHireRequest.countDocuments({ 
            status: { $regex: /^pending$/i } 
        });
        
        // Count pending job applications
        const jobsWithPendingApplications = await ContractorJob.countDocuments({
            'applications': {
                $elemMatch: { status: { $regex: /^pending$/i } }
            }
        });

        const activeRequests = activeLabourHireRequests + activeContractorHireRequests + jobsWithPendingApplications;

        // Count completed requests (ACCEPTED)
        const completedLabourRequests = await HireRequest.countDocuments({ 
            status: { $regex: /^accepted$/i } 
        });
        const completedContractorRequests = await ContractorHireRequest.countDocuments({ 
            status: { $regex: /^accepted$/i } 
        });
        const jobsWithAcceptedApplications = await ContractorJob.countDocuments({
            'applications': {
                $elemMatch: { status: { $regex: /^accepted$/i } }
            }
        });
        const completedRequests = completedLabourRequests + completedContractorRequests + jobsWithAcceptedApplications;

        // Count today's requests
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLabourRequests = await HireRequest.countDocuments({ createdAt: { $gte: today } });
        const todayContractorRequests = await ContractorHireRequest.countDocuments({ createdAt: { $gte: today } });
        const todayRequests = todayLabourRequests + todayContractorRequests;

        // Count this week's requests
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekLabourRequests = await HireRequest.countDocuments({ createdAt: { $gte: weekAgo } });
        const weekContractorRequests = await ContractorHireRequest.countDocuments({ createdAt: { $gte: weekAgo } });
        const weekRequests = weekLabourRequests + weekContractorRequests;

        // Calculate success rate
        const totalAllRequests = await HireRequest.countDocuments() + await ContractorHireRequest.countDocuments();
        const successRate = totalAllRequests > 0 ? Math.round((completedRequests / totalAllRequests) * 100) : 0;

        console.log('📈 Analytics:', {
            totalUsers,
            totalLabours,
            totalContractors,
            activeRequests,
            completedRequests,
            todayRequests,
            weekRequests,
            successRate
        });

        // Get actual verification queue count
        const verificationQueueCount = await VerificationRequest.countDocuments({ 
            status: 'Pending' 
        });

        // Get disputes (mock data for now)
        const disputes = {
            openCases: 5
        };

        // Get revenue (mock data for now)
        const revenue = {
            total: 150000,
            weeklyData: [10000, 20000, 15000, 40000, 70000]
        };

        res.status(200).json({
            success: true,
            data: {
                analytics: {
                    totalUsers,
                    totalLabours,
                    totalContractors,
                    activeRequests,
                    completedRequests,
                    todayRequests,
                    weekRequests,
                    successRate,
                    verificationQueue: verificationQueueCount,
                    disputes,
                    revenue
                }
            }
        });

    } catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching dashboard analytics',
            error: error.message
        });
    }
};

// @desc    Get all interactions/requests
// @route   GET /api/admin/dashboard/interactions
// @access  Private
export const getAllInteractions = async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;

        console.log('📊 Fetching interactions for dashboard...');

        // Fetch all types of interactions
        const interactions = [];

        // 1. Labour Hire Requests (User/Contractor → Labour)
        const labourHireRequests = await HireRequest.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        for (const req of labourHireRequests) {
            // Manually populate requester based on requesterModel
            let requester = null;
            if (req.requesterModel === 'User') {
                requester = await User.findById(req.requesterId).select('firstName lastName mobileNumber').lean();
            } else if (req.requesterModel === 'Contractor') {
                const contractor = await Contractor.findById(req.requesterId).select('businessName businessType').lean();
                if (contractor) {
                    requester = { firstName: contractor.businessName, lastName: '', mobileNumber: '' };
                }
            }

            // Get labour info
            const labour = await Labour.findById(req.labourId).select('skillType experience').lean();

            interactions.push({
                _id: req._id,
                senderType: req.requesterModel || 'USER',
                senderId: requester || { firstName: 'Unknown', lastName: '', mobileNumber: '' },
                receiverType: 'LABOUR',
                receiverId: { 
                    firstName: labour?.skillType || 'Labour', 
                    lastName: `(${labour?.experience || 0} yrs)` 
                },
                requestType: 'LABOUR_HIRE',
                requestContext: req.message || 'Hire request for labour',
                status: req.status,
                createdAt: req.createdAt
            });
        }

        // 2. Contractor Hire Requests (User → Contractor)
        const contractorHireRequests = await ContractorHireRequest.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        for (const req of contractorHireRequests) {
            const requester = await User.findById(req.requesterId).select('firstName lastName mobileNumber').lean();
            const contractor = await Contractor.findById(req.contractorId).select('businessName businessType').lean();

            interactions.push({
                _id: req._id,
                senderType: 'USER',
                senderId: requester || { firstName: 'Unknown', lastName: '', mobileNumber: '' },
                receiverType: 'CONTRACTOR',
                receiverId: { 
                    firstName: contractor?.businessName || 'Contractor', 
                    lastName: contractor?.businessType || '' 
                },
                requestType: 'CONTRACTOR_HIRE',
                requestContext: req.message || 'Hire request for contractor',
                status: req.status,
                createdAt: req.createdAt
            });
        }

        // 3. Contractor Job Applications (Labour → Contractor Job)
        const contractorJobs = await ContractorJob.find({ 'applications.0': { $exists: true } })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        for (const job of contractorJobs) {
            const contractor = await Contractor.findById(job.contractorId).select('businessName businessType').lean();
            
            for (const app of job.applications) {
                const labour = await Labour.findById(app.labourId).select('skillType experience').lean();
                
                interactions.push({
                    _id: `${job._id}_${app.labourId}`,
                    senderType: 'LABOUR',
                    senderId: { 
                        firstName: labour?.skillType || 'Labour', 
                        lastName: '', 
                        mobileNumber: '' 
                    },
                    receiverType: 'CONTRACTOR',
                    receiverId: { 
                        firstName: contractor?.businessName || 'Contractor', 
                        lastName: '' 
                    },
                    requestType: 'JOB_APPLICATION',
                    requestContext: app.message || `Applied for: ${job.title || 'job'}`,
                    status: app.status,
                    createdAt: app.appliedAt
                });
            }
        }

        // Sort all interactions by date
        interactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedInteractions = interactions.slice(startIndex, endIndex);

        console.log(`✅ Found ${interactions.length} total interactions`);

        res.status(200).json({
            success: true,
            data: {
                interactions: paginatedInteractions,
                total: interactions.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(interactions.length / limit)
            }
        });

    } catch (error) {
        console.error('❌ Error fetching interactions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching interactions',
            error: error.message
        });
    }
};

// @desc    Get verification queue
// @route   GET /api/admin/dashboard/verification-queue
// @access  Private
export const getVerificationQueue = async (req, res) => {
    try {
        const queue = await VerificationRequest.find({ 
            status: 'Pending' 
        })
        .populate('entityId', 'firstName lastName mobileNumber')
        .sort({ createdAt: -1 })
        .limit(10);

        res.status(200).json({
            success: true,
            data: { queue }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching verification queue',
            error: error.message
        });
    }
};

// @desc    Get disputes
// @route   GET /api/admin/dashboard/disputes
// @access  Private
export const getDisputes = async (req, res) => {
    try {
        // Mock data for now - implement actual dispute model later
        const disputes = {
            openCases: 5,
            disputes: []
        };

        res.status(200).json({
            success: true,
            data: { disputes }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching disputes',
            error: error.message
        });
    }
};

// @desc    Get revenue data
// @route   GET /api/admin/dashboard/revenue
// @access  Private
export const getRevenue = async (req, res) => {
    try {
        const { period = 'week' } = req.query;

        // Mock data for now - implement actual revenue tracking later
        let revenue = {
            total: 150000,
            data: []
        };

        if (period === 'week') {
            revenue.data = [10000, 20000, 15000, 40000, 70000];
        } else if (period === 'month') {
            revenue.data = [50000, 60000, 70000, 80000];
        }

        res.status(200).json({
            success: true,
            data: { revenue }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching revenue',
            error: error.message
        });
    }
};

// @desc    Get audio logs statistics
// @route   GET /api/admin/dashboard/audio-logs
// @access  Private
export const getAudioLogs = async (req, res) => {
    try {
        // Count requests with audio
        const audioRequests = await Request.countDocuments({ 
            requestContext: 'Audio',
            audioUrl: { $ne: null }
        });

        // Mock total hours calculation
        const totalHours = (audioRequests * 2.5).toFixed(2); // Assuming avg 2.5 min per audio

        res.status(200).json({
            success: true,
            data: {
                audioLogs: {
                    totalRequests: audioRequests,
                    totalHours: `${totalHours} hours`
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching audio logs',
            error: error.message
        });
    }
};
