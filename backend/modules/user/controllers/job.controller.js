import Job from '../models/Job.model.js';
import Labour from '../../labour/models/Labour.model.js';
import { sendNotificationToUser, sendNotificationToMultipleUsers } from '../../../utils/notificationHelper.js';

export const createJob = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== CREATE JOB =====');
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user._id);

        const job = await Job.create({
            user: req.user._id,
            ...req.body
        });

        console.log('✅ Job created:', job._id);

        // Notify matching labourers (by category/skillType)
        try {
            const matchingLabours = await Labour.find({
                isActive: true,
                $or: [
                    { skillType: job.category },
                    { 'labourCardDetails.skills': new RegExp(job.category, 'i') }
                ]
            }).populate('user', '_id');

            if (matchingLabours.length > 0) {
                const userIds = matchingLabours
                    .filter(l => l.user && l.user._id)
                    .map(l => l.user._id.toString());
                
                if (userIds.length > 0) {
                    await sendNotificationToMultipleUsers(userIds, {
                        title: 'New Job Opportunity!',
                        body: `${job.userName} is looking for a ${job.category} in ${job.city || 'your area'}.`,
                        data: {
                            type: 'new_job_alert',
                            jobId: job._id.toString(),
                            link: '/labour/dashboard'
                        }
                    });
                    console.log(`📡 Broadcasted new job alert to ${userIds.length} matching labourers`);
                }
            }
        } catch (notifierError) {
            console.error('❌ New job notification error:', notifierError.message);
            // Don't fail the request if notification fails
        }

        console.log('===========================\n');

        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            data: { job }
        });
    } catch (error) {
        console.error('❌ CREATE JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getUserJobs = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET USER JOBS =====');
        console.log('👤 User ID:', req.user._id);

        const { page = 1, limit = 20 } = req.query;

        const jobs = await Job.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments({ user: req.user._id });

        console.log('✅ Found', jobs.length, 'jobs');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                jobs,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ GET USER JOBS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getJobById = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this job'
            });
        }

        res.status(200).json({
            success: true,
            data: { job }
        });
    } catch (error) {
        next(error);
    }
};

export const updateJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
        }

        const updatedJob = await Job.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            data: { job: updatedJob }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
        }

        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const browseJobs = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== BROWSE JOBS =====');

        const { city, category, status = 'Open', page = 1, limit = 100 } = req.query;

        const query = { isActive: true };

        if (city) {
            query.city = new RegExp(city, 'i');
        }
        if (category) {
            query.category = category;
        }
        if (status) {
            query.status = status;
        }

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Job.countDocuments(query);

        console.log('✅ Found', jobs.length, 'jobs');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                jobs,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ BROWSE JOBS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const applyToJob = async (req, res, next) => {
    try {
        console.log('\n🟢 ===== APPLY TO JOB =====');
        console.log('Job ID:', req.params.id);
        console.log('Applicant ID:', req.user._id);
        console.log('Application Data:', req.body);

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.status !== 'Open') {
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications'
            });
        }

        // Check if already applied
        const alreadyApplied = job.applications.some(
            app => app.applicant.toString() === req.user._id.toString()
        );

        if (alreadyApplied) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied to this job'
            });
        }

        // Add application
        job.applications.push({
            applicant: req.user._id,
            applicantType: req.body.applicantType || req.user.userType, // 'Labour' or 'Contractor'
            applicantName: req.body.applicantName,
            phoneNumber: req.body.phoneNumber,
            location: req.body.location,
            message: req.body.message,
            status: 'Pending'
        });

        await job.save();

        // Send push notification to Job Owner (User)
        if (job.user) {
            await sendNotificationToUser(job.user.toString(), {
                title: 'New Job Application',
                body: `${req.body.applicantName} has applied for your job: ${job.jobTitle}`,
                data: {
                    type: 'job_application',
                    jobId: job._id.toString(),
                    link: '/user/requests' // Assuming this is where users see applications
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
        console.error('❌ APPLY TO JOB ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getJobApplications = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET JOB APPLICATIONS =====');
        console.log('Job ID:', req.params.id);
        console.log('User ID:', req.user._id);

        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Check if user owns this job
        if (job.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view applications for this job'
            });
        }

        console.log('✅ Found', job.applications.length, 'applications');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                applications: job.applications,
                jobTitle: job.jobTitle,
                jobStatus: job.status
            }
        });
    } catch (error) {
        console.error('❌ GET JOB APPLICATIONS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getContractorApplications = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET CONTRACTOR APPLICATIONS =====');
        console.log('User ID:', req.user._id);

        // Find all jobs posted by this user
        const jobs = await Job.find({ user: req.user._id, isActive: true });

        console.log('✅ Found', jobs.length, 'jobs');

        // Extract all contractor applications from all jobs
        const contractorApplications = [];
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                if (app.applicantType === 'Contractor' && app.status === 'Pending') {
                    contractorApplications.push({
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: job.jobTitle,
                        jobCategory: job.category,
                        applicantName: app.applicantName,
                        phoneNumber: app.phoneNumber,
                        location: app.location,
                        message: app.message,
                        appliedAt: app.appliedAt,
                        status: app.status,
                        chatId: app.chatId,
                        applicantUserId: app.applicant,
                    });
                }
            });
        });

        console.log('✅ Found', contractorApplications.length, 'contractor applications');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                applications: contractorApplications,
                count: contractorApplications.length
            }
        });
    } catch (error) {
        console.error('❌ GET CONTRACTOR APPLICATIONS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getMyApplications = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET MY APPLICATIONS =====');
        console.log('User ID:', req.user._id);

        // Find all jobs and filter applications by this user
        const jobs = await Job.find({ isActive: true });

        console.log('✅ Searching through', jobs.length, 'jobs');

        // Extract applications made by this contractor
        const myApplications = {};
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                // Check if this application is from the current user (contractor)
                if (app.applicant && app.applicant.toString() === req.user._id.toString()) {
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

        console.log('✅ Found', Object.keys(myApplications).length, 'applications by this contractor');
        console.log('===========================\n');

        res.status(200).json({
            success: true,
            data: {
                applications: myApplications,
                count: Object.keys(myApplications).length
            }
        });
    } catch (error) {
        console.error('❌ GET MY APPLICATIONS ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const getApplicationHistory = async (req, res, next) => {
    try {
        console.log('\n🔵 ===== GET APPLICATION HISTORY =====');
        console.log('User ID:', req.user._id);

        // Find all jobs posted by this user
        const jobs = await Job.find({ user: req.user._id, isActive: true });

        console.log('✅ Found', jobs.length, 'jobs');

        // Extract all accepted/rejected applications
        const history = [];
        
        jobs.forEach(job => {
            job.applications.forEach(app => {
                if (app.status === 'Accepted' || app.status === 'Rejected') {
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

                    const historyItem = {
                        id: app._id.toString(),
                        _id: app._id,
                        jobId: job._id,
                        jobTitle: job.jobTitle,
                        jobCategory: job.category,
                        applicantType: app.applicantType,
                        applicantName: app.applicantName,
                        phoneNumber: app.phoneNumber,
                        location: app.location || 'Not specified',
                        message: app.message,
                        appliedAt: app.appliedAt,
                        date: formattedDate,
                        time: formattedTime,
                        status: app.status.toLowerCase(),
                        chatId: app.chatId,
                        applicantUserId: app.applicant,
                        type: app.applicantType === 'Contractor' ? 'contractor' : 'worker'
                    };

                    // Add type-specific fields for compatibility with card components
                    if (app.applicantType === 'Contractor') {
                        historyItem.contractorName = app.applicantName;
                    } else {
                        historyItem.workerName = app.applicantName;
                        historyItem.category = job.category;
                    }

                    history.push(historyItem);
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
        console.error('❌ GET APPLICATION HISTORY ERROR:', error.message);
        console.log('===========================\n');
        next(error);
    }
};

export const updateApplicationStatus = async (req, res, next) => {
    try {
        console.log('\n🟡 ===== UPDATE APPLICATION STATUS =====');
        console.log('Job ID:', req.params.id);
        console.log('Application ID:', req.params.applicationId);
        console.log('New Status:', req.body.status);
        console.log('User ID:', req.user._id);

        const job = await Job.findById(req.params.id).populate('user');

        if (!job) {
            console.log('❌ Job not found');
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        console.log('✅ Job found:', job._id);
        console.log('   Job owner:', job.user._id);
        console.log('   Request user:', req.user._id);

        // Check if user owns this job
        if (job.user._id.toString() !== req.user._id.toString()) {
            console.log('❌ Not authorized - user does not own this job');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update applications for this job'
            });
        }

        // Find and update application
        const application = job.applications.id(req.params.applicationId);

        if (!application) {
            console.log('❌ Application not found in job');
            console.log('   Available application IDs:', job.applications.map(a => a._id.toString()));
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        console.log('✅ Application found:', application._id);
        console.log('   Applicant ID:', application.applicant);
        console.log('   Applicant Type:', application.applicantType);
        console.log('   Current Status:', application.status);

        application.status = req.body.status;

        // ✅ CREATE CHAT AUTOMATICALLY when status is Accepted
        if (req.body.status === 'Accepted' && !application.chatId) {
            console.log('✅ Status is Accepted, creating chat...');

            try {
                // Import chat controller and models
                const { createChatFromRequest } = await import('../../../controllers/chat.controller.js');
                const Labour = (await import('../../labour/models/Labour.model.js')).default;
                const Contractor = (await import('../../contractor/models/Contractor.model.js')).default;
                const User = (await import('../models/User.model.js')).default;

                // Get applicant details based on type
                let applicantUser = null;
                let applicantUserType = application.applicantType;

                console.log('🔍 Looking for applicant user...');
                console.log('   Applicant ID:', application.applicant);
                console.log('   Applicant Type:', application.applicantType);

                if (application.applicantType === 'Labour') {
                    // application.applicant contains User ID, not Labour ID
                    // So we need to find Labour by user field
                    console.log('   Searching Labour by user field...');
                    const labour = await Labour.findOne({ user: application.applicant }).populate('user');
                    
                    if (labour && labour.user) {
                        console.log('   ✅ Found Labour profile with user');
                        applicantUser = labour.user;
                    } else {
                        console.log('   ⚠️ Labour profile not found, trying direct User lookup...');
                        // If Labour profile not found, applicant might be the User directly
                        applicantUser = await User.findById(application.applicant);
                        if (applicantUser) {
                            console.log('   ✅ Found User directly');
                        }
                    }
                } else if (application.applicantType === 'Contractor') {
                    // application.applicant contains User ID, not Contractor ID
                    // So we need to find Contractor by user field
                    console.log('   Searching Contractor by user field...');
                    const contractor = await Contractor.findOne({ user: application.applicant }).populate('user');
                    
                    if (contractor && contractor.user) {
                        console.log('   ✅ Found Contractor profile with user');
                        applicantUser = contractor.user;
                    } else {
                        console.log('   ⚠️ Contractor profile not found, trying direct User lookup...');
                        // If Contractor profile not found, applicant might be the User directly
                        applicantUser = await User.findById(application.applicant);
                        if (applicantUser) {
                            console.log('   ✅ Found User directly');
                        }
                    }
                }

                if (!applicantUser) {
                    console.log('❌ Applicant user not found after all attempts');
                    console.log('   Application applicant ID:', application.applicant);
                    console.log('   Application applicant type:', application.applicantType);
                    
                    // Don't fail the accept operation, just skip chat creation
                    console.log('⚠️ Skipping chat creation, but accepting application');
                    await job.save();
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Application accepted successfully (chat will be created later)',
                        data: { 
                            application: {
                                _id: application._id,
                                status: application.status,
                                chatId: null,
                                appliedAt: application.appliedAt
                            }
                        }
                    });
                }

                console.log('✅ Applicant user found:', applicantUser._id);
                console.log('   Name:', `${applicantUser.firstName} ${applicantUser.lastName}`);

                // Helper for robust name fetching
                const getSafeName = (u, defaultName = 'User') => {
                    const first = u.firstName || '';
                    const last = u.lastName || '';
                    const full = `${first} ${last}`.trim();
                    return (full && full !== 'null null') ? full : defaultName;
                };

                // Prepare chat data
                const chatData = {
                    participant1: {
                        userId: job.user._id,
                        userType: 'User',
                        name: getSafeName(job.user, 'User'),
                        profilePhoto: job.user.profilePhoto || '',
                        mobileNumber: job.user.mobileNumber
                    },
                    participant2: {
                        userId: applicantUser._id,
                        userType: applicantUserType,
                        name: getSafeName(applicantUser, applicantUserType || 'User'),
                        profilePhoto: applicantUser.profilePhoto || '',
                        mobileNumber: applicantUser.mobileNumber
                    },
                    relatedRequest: {
                        requestId: application._id,
                        requestType: 'JobApplication'
                    }
                };

                console.log('📦 Chat Data prepared');

                // Create chat
                const chat = await createChatFromRequest(chatData);

                // Link chat to application
                application.chatId = chat._id;
                console.log('✅ Chat created and linked:', chat._id);
            } catch (chatError) {
                console.error('❌ Error creating chat:', chatError.message);
                console.error('   Stack:', chatError.stack);
                // Don't fail the accept, just log the error
                console.log('⚠️ Continuing with accept despite chat error');
            }
        }

        await job.save();

        // Send push notification to Applicant
        if (application.applicant) {
            await sendNotificationToUser(application.applicant.toString(), {
                title: `Application ${req.body.status}`,
                body: `Your application for ${job.jobTitle} has been ${req.body.status.toLowerCase()}.`,
                data: {
                    type: 'job_application_update',
                    jobId: job._id.toString(),
                    applicationId: application._id.toString(),
                    status: req.body.status,
                    link: application.applicantType === 'Labour' ? '/labour/requests' : '/contractor/requests'
                }
            });
        }

        console.log('✅ Application status updated successfully');
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
        console.error('   Stack:', error.stack);
        console.log('===========================\n');
        next(error);
    }
};
