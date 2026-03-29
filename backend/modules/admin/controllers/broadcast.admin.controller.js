import Broadcast from '../models/Broadcast.model.js';
import User from '../../user/models/User.model.js';
import Labour from '../../labour/models/Labour.model.js';
import Contractor from '../../contractor/models/Contractor.model.js';
import Notification from '../../../models/Notification.model.js';
import { sendNotificationToMultipleUsers, broadcastNotification } from '../../../utils/notificationHelper.js';

// @desc    Get all broadcasts
// @route   GET /api/admin/broadcasts
// @access  Private
export const getAllBroadcasts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, targetAudience } = req.query;

        const query = {};
        if (status) query.status = status;
        if (targetAudience) query.targetAudience = targetAudience;

        const broadcasts = await Broadcast.find(query)
            .populate('createdBy', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Broadcast.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                broadcasts,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching broadcasts',
            error: error.message
        });
    }
};

// @desc    Get broadcast by ID
// @route   GET /api/admin/broadcasts/:id
// @access  Private
export const getBroadcastById = async (req, res) => {
    try {
        const broadcast = await Broadcast.findById(req.params.id)
            .populate('createdBy', 'username email');

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: 'Broadcast not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { broadcast }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching broadcast',
            error: error.message
        });
    }
};

// @desc    Create new broadcast
// @route   POST /api/admin/broadcasts
// @access  Private
export const createBroadcast = async (req, res) => {
    try {
        const { title, message, targetAudience, priority, scheduledAt, expiresAt } = req.body;

        console.log('📢 Creating broadcast:', { title, targetAudience, priority });
        console.log('👤 Admin ID:', req.admin?._id);

        // Validation
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        if (!req.admin || !req.admin._id) {
            return res.status(401).json({
                success: false,
                message: 'Admin authentication required'
            });
        }

        // Calculate recipient count based on target audience
        let recipientCount = 0;
        switch (targetAudience) {
            case 'USERS':
                recipientCount = await User.countDocuments({ userType: { $in: ['User', null] } });
                break;
            case 'LABOUR':
                recipientCount = await Labour.countDocuments();
                break;
            case 'CONTRACTORS':
                recipientCount = await Contractor.countDocuments();
                break;
            case 'ALL':
            default:
                const userCount = await User.countDocuments();
                const labourCount = await Labour.countDocuments();
                const contractorCount = await Contractor.countDocuments();
                recipientCount = userCount + labourCount + contractorCount;
                break;
        }

        console.log('📊 Recipient count:', recipientCount);

        const broadcast = await Broadcast.create({
            title,
            message,
            targetAudience: targetAudience || 'ALL',
            priority: priority || 'MEDIUM',
            scheduledAt: scheduledAt || null,
            expiresAt: expiresAt || null,
            recipientCount,
            createdBy: req.admin._id,
            status: scheduledAt ? 'SCHEDULED' : 'DRAFT'
        });

        const populatedBroadcast = await Broadcast.findById(broadcast._id)
            .populate('createdBy', 'username email');

        console.log('✅ Broadcast created:', populatedBroadcast._id);

        res.status(201).json({
            success: true,
            message: 'Broadcast created successfully',
            data: { broadcast: populatedBroadcast }
        });

    } catch (error) {
        console.error('❌ Error creating broadcast:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating broadcast',
            error: error.message
        });
    }
};

// @desc    Update broadcast
// @route   PUT /api/admin/broadcasts/:id
// @access  Private
export const updateBroadcast = async (req, res) => {
    try {
        const { title, message, targetAudience, priority, scheduledAt, expiresAt } = req.body;

        const broadcast = await Broadcast.findById(req.params.id);

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: 'Broadcast not found'
            });
        }

        // Can't update if already sent
        if (broadcast.status === 'SENT') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a broadcast that has already been sent'
            });
        }

        // Update fields
        if (title) broadcast.title = title;
        if (message) broadcast.message = message;
        if (targetAudience) broadcast.targetAudience = targetAudience;
        if (priority) broadcast.priority = priority;
        if (scheduledAt !== undefined) broadcast.scheduledAt = scheduledAt;
        if (expiresAt !== undefined) broadcast.expiresAt = expiresAt;

        // Recalculate recipient count if target audience changed
        if (targetAudience) {
            let recipientCount = 0;
            switch (targetAudience) {
                case 'USERS':
                    recipientCount = await User.countDocuments();
                    break;
                case 'LABOUR':
                    recipientCount = await Labour.countDocuments();
                    break;
                case 'CONTRACTORS':
                    recipientCount = await Contractor.countDocuments();
                    break;
                case 'ALL':
                default:
                    const userCount = await User.countDocuments();
                    const labourCount = await Labour.countDocuments();
                    const contractorCount = await Contractor.countDocuments();
                    recipientCount = userCount + labourCount + contractorCount;
                    break;
            }
            broadcast.recipientCount = recipientCount;
        }

        await broadcast.save();

        const updatedBroadcast = await Broadcast.findById(broadcast._id)
            .populate('createdBy', 'username email');

        res.status(200).json({
            success: true,
            message: 'Broadcast updated successfully',
            data: { broadcast: updatedBroadcast }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating broadcast',
            error: error.message
        });
    }
};

// @desc    Delete broadcast
// @route   DELETE /api/admin/broadcasts/:id
// @access  Private
export const deleteBroadcast = async (req, res) => {
    try {
        const broadcast = await Broadcast.findById(req.params.id);

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: 'Broadcast not found'
            });
        }

        // Broadcast can now be deleted even if it was sent, to allow history cleanup
        /* 
        if (broadcast.status === 'SENT') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a broadcast that has already been sent'
            });
        }
        */

        await broadcast.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Broadcast deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error deleting broadcast',
            error: error.message
        });
    }
};

// @desc    Send broadcast immediately
// @route   POST /api/admin/broadcasts/:id/send
// @access  Private
export const sendBroadcast = async (req, res) => {
    try {
        // Atomically mark as sending to prevent duplicate executions from concurrent requests
        const broadcast = await Broadcast.findOneAndUpdate(
            { _id: req.params.id, status: { $ne: 'SENT' } },
            { $set: { status: 'SENDING' } },
            { new: true }
        );
        
        if (!broadcast) {
            return res.status(400).json({
                success: false,
                message: 'Broadcast not found or already sent/sending'
            });
        }

        // Get recipients based on target audience
        let recipients = [];
        
        console.log('🎯 Target Audience:', broadcast.targetAudience);
        
        switch (broadcast.targetAudience) {
            case 'USERS':
                const usersOnly = await User.find({ userType: { $in: ['User', null] } }, '_id');
                recipients = usersOnly.map(u => ({ userId: u._id, userType: 'USER' }));
                console.log('👥 USER recipients:', recipients.length);
                break;

            case 'LABOUR':
                const usersForLabour = await User.find({ userType: 'Labour' }, '_id');
                recipients = usersForLabour.map(u => ({ userId: u._id, userType: 'LABOUR' }));
                console.log('🔨 LABOUR recipients:', recipients.length);
                break;

            case 'CONTRACTORS':
                const contractorsOnly = await User.find({ userType: 'Contractor' }, '_id');
                recipients = contractorsOnly.map(u => ({ userId: u._id, userType: 'CONTRACTOR' }));
                console.log('🏗️ CONTRACTOR recipients:', recipients.length);
                break;

            case 'ALL':
            default:
                const allUsers = await User.find({}, '_id');
                console.log('👥 Total users in database:', allUsers.length);
                
                // For 'ALL', we send to everyone in all three roles so they see it wherever they are
                const userRecipients = allUsers.map(u => ({ userId: u._id, userType: 'USER' }));
                const labourRecipients = allUsers.map(u => ({ userId: u._id, userType: 'LABOUR' }));
                const contractorRecipients = allUsers.map(u => ({ userId: u._id, userType: 'CONTRACTOR' }));
                
                recipients = [...userRecipients, ...labourRecipients, ...contractorRecipients];
                console.log('📊 Total recipients (3x users):', recipients.length);
                break;
        }

        console.log('📧 Creating notifications for', recipients.length, 'recipients');

        // Create notifications for all recipients
        let deliveredCount = 0;
        let failedCount = 0;

        const notificationPromises = recipients.map(async (recipient) => {
            try {
                const notification = await Notification.create({
                    user: recipient.userId,
                    userType: recipient.userType,
                    title: broadcast.title,
                    message: broadcast.message,
                    type: 'BROADCAST',
                    priority: broadcast.priority,
                    metadata: {
                        broadcastId: broadcast._id
                    }
                });
                console.log(`✅ Created notification for ${recipient.userType}:`, recipient.userId);
                deliveredCount++;
            } catch (error) {
                console.error(`❌ Failed to create notification for ${recipient.userType}:`, recipient.userId, error.message);
                failedCount++;
            }
        });

        await Promise.all(notificationPromises);

        // Send Push Notifications
        const userIds = recipients.map(r => r.userId.toString());
        const uniqueUserIds = [...new Set(userIds)];
        
        // Use broadcastNotification if it's for everyone, otherwise target specific IDs
        if (broadcast.targetAudience === 'ALL') {
            await broadcastNotification({
                title: broadcast.title,
                body: broadcast.message,
                data: {
                    type: 'BROADCAST',
                    broadcastId: broadcast._id.toString()
                },
                broadcastId: broadcast._id.toString()
            });
        } else {
            await sendNotificationToMultipleUsers(uniqueUserIds, {
                title: broadcast.title,
                body: broadcast.message,
                data: {
                    type: 'BROADCAST',
                    broadcastId: broadcast._id.toString()
                }
            });
        }

        // Update broadcast status
        broadcast.status = 'SENT';
        broadcast.sentAt = new Date();
        broadcast.deliveredCount = deliveredCount;
        broadcast.failedCount = failedCount;
        await broadcast.save();

        const updatedBroadcast = await Broadcast.findById(broadcast._id)
            .populate('createdBy', 'username email');

        res.status(200).json({
            success: true,
            message: `Broadcast sent successfully to ${deliveredCount} recipients`,
            data: { broadcast: updatedBroadcast }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error sending broadcast',
            error: error.message
        });
    }
};

// @desc    Get broadcast statistics
// @route   GET /api/admin/broadcasts/stats
// @access  Private
export const getBroadcastStats = async (req, res) => {
    try {
        const totalBroadcasts = await Broadcast.countDocuments();
        const sentBroadcasts = await Broadcast.countDocuments({ status: 'SENT' });
        const scheduledBroadcasts = await Broadcast.countDocuments({ status: 'SCHEDULED' });
        const draftBroadcasts = await Broadcast.countDocuments({ status: 'DRAFT' });

        const totalRecipients = await Broadcast.aggregate([
            { $match: { status: 'SENT' } },
            { $group: { _id: null, total: { $sum: '$recipientCount' } } }
        ]);

        const totalDelivered = await Broadcast.aggregate([
            { $match: { status: 'SENT' } },
            { $group: { _id: null, total: { $sum: '$deliveredCount' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    total: totalBroadcasts,
                    sent: sentBroadcasts,
                    scheduled: scheduledBroadcasts,
                    draft: draftBroadcasts,
                    totalRecipients: totalRecipients[0]?.total || 0,
                    totalDelivered: totalDelivered[0]?.total || 0
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching broadcast stats',
            error: error.message
        });
    }
};

// @desc    Get active broadcasts for public display (banners/ads)
// @route   GET /api/broadcasts/active
// @access  Public
export const getActiveBroadcasts = async (req, res) => {
    try {
        const { targetAudience = 'ALL' } = req.query;

        console.log('🎯 Fetching active broadcasts for audience:', targetAudience);

        const now = new Date();

        // Find broadcasts that are:
        // 1. Status is SENT
        // 2. Target audience matches or is ALL
        // 3. Not expired (expiresAt is null or in future)
        const query = {
            status: 'SENT',
            $or: [
                { targetAudience: targetAudience },
                { targetAudience: 'ALL' }
            ],
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        };

        const broadcasts = await Broadcast.find(query)
            .select('title message priority targetAudience sentAt expiresAt')
            .sort({ priority: -1, sentAt: -1 })
            .limit(10);

        console.log('✅ Found', broadcasts.length, 'active broadcasts');

        res.status(200).json({
            success: true,
            data: {
                broadcasts,
                total: broadcasts.length
            }
        });

    } catch (error) {
        console.error('❌ Error fetching active broadcasts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching active broadcasts',
            error: error.message
        });
    }
};
