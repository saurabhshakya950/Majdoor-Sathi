import express from 'express';
import { protectAdmin } from '../middleware/admin.auth.middleware.js';
import Notification from '../../../models/Notification.model.js';

const router = express.Router();

// @desc   Get admin notifications (bell icon data)
// @route  GET /api/admin/notifications
// @access Private (Admin)
router.get('/', protectAdmin, async (req, res) => {
    try {
        const { limit = 20, unreadOnly } = req.query;

        const query = { user: req.admin._id, userType: 'ADMIN' };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            user: req.admin._id,
            userType: 'ADMIN',
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { notifications, unreadCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
});

// @desc   Mark a notification as read
// @route  PATCH /api/admin/notifications/:id/read
// @access Private (Admin)
router.patch('/:id/read', protectAdmin, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark notification', error: error.message });
    }
});

// @desc   Mark all admin notifications as read
// @route  PATCH /api/admin/notifications/read-all
// @access Private (Admin)
router.patch('/read-all', protectAdmin, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.admin._id, userType: 'ADMIN', isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to mark all notifications', error: error.message });
    }
});

export default router;
