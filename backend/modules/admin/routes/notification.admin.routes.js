import express from 'express';
import { protectAdmin } from '../middleware/admin.auth.middleware.js';
import Notification from '../../../models/Notification.model.js';
import Admin from '../models/Admin.model.js';
import mongoose from 'mongoose';

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

// @desc   Create a contact inquiry notification
// @route  POST /api/admin/notifications/contact-inquiry
// @access Public (No login required to contact support)
router.post('/contact-inquiry', async (req, res) => {
    try {
        const { name, phone, message, senderRole } = req.body;

        if (!name || !phone || !message) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        // Auto-assign to SUPER_ADMIN
        const superAdmin = await Admin.findOne({ role: 'SUPER_ADMIN' });
        if (!superAdmin) {
            return res.status(404).json({ success: false, message: 'Super Admin not found' });
        }

        const notification = new Notification({
            user: superAdmin._id,
            userType: 'ADMIN',
            title: `New Inquiry from ${senderRole || 'User'}`,
            message: message.substring(0, 80) + '...',
            type: 'info',
            priority: 'HIGH',
            metadata: {
                type: 'CONTACT_INQUIRY',
                name,
                phone,
                message,
                senderRole: (senderRole || 'User').toUpperCase()
            }
        });

        await notification.save();
        res.status(201).json({ success: true, message: 'Inquiry sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
});

// @desc   Delete a notification
// @route  DELETE /api/admin/notifications/:id
// @access Private (Admin)
router.delete('/:id', protectAdmin, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete notification', error: error.message });
    }
});

export default router;
