import express from 'express';
import {
    adminLogin,
    adminLogout,
    changePassword,
    verifyToken,
    getAdminProfile,
    updateAdminProfile,
    saveFcmToken
} from '../controllers/auth.admin.controller.js';
import { protectAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateAdminLogin,
    validateChangePassword,
    validateUpdateAdminProfile
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', validateAdminLogin, adminLogin);

// Protected routes
router.post('/logout', protectAdmin, adminLogout);
router.put('/change-password', protectAdmin, validateChangePassword, changePassword);
router.get('/verify-token', protectAdmin, verifyToken);
router.get('/profile', protectAdmin, getAdminProfile);
router.put('/profile', protectAdmin, validateUpdateAdminProfile, updateAdminProfile);
router.post('/fcm-token', protectAdmin, saveFcmToken);

export default router;
