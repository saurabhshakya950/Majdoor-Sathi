import express from 'express';
import { login, register, logout, refreshToken, sendOTPToMobile, verifyOTPAndLogin, saveFCMToken } from '../controllers/auth.controller.js';
import { validateMobileNumber, validateRegistration } from '../middleware/validator.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/send-otp', validateMobileNumber, sendOTPToMobile);
router.post('/verify-otp', verifyOTPAndLogin);
router.post('/login', validateMobileNumber, login);
router.post('/register', validateRegistration, register);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.post('/fcm-token', protect, saveFCMToken);

export default router;
