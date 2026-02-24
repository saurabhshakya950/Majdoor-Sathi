import express from 'express';
import {
    getAllBroadcasts,
    getBroadcastById,
    createBroadcast,
    updateBroadcast,
    deleteBroadcast,
    sendBroadcast,
    getBroadcastStats,
    getActiveBroadcasts
} from '../controllers/broadcast.admin.controller.js';
import { protectAdmin, isUserAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateCreateBroadcast,
    validateUpdateBroadcast,
    validateObjectIdParam,
    validatePagination
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// Public route for active broadcasts (banners)
router.get('/active', getActiveBroadcasts);

// All other routes require admin authentication and SUPER_ADMIN or ADMIN_USER role
router.use(protectAdmin, isUserAdmin);

// Stats route (must be before :id route)
router.get('/stats', getBroadcastStats);

// CRUD routes
router.get('/', validatePagination, getAllBroadcasts);
router.get('/:id', validateObjectIdParam('id'), getBroadcastById);
router.post('/', validateCreateBroadcast, createBroadcast);
router.put('/:id', validateObjectIdParam('id'), validateUpdateBroadcast, updateBroadcast);
router.delete('/:id', validateObjectIdParam('id'), deleteBroadcast);

// Send broadcast
router.post('/:id/send', validateObjectIdParam('id'), sendBroadcast);

export default router;
