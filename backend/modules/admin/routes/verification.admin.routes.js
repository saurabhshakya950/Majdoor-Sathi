import express from 'express';
import multer from 'multer';
import {
    getAllVerificationRequests,
    getVerificationRequestById,
    createVerificationRequest,
    approveVerificationRequest,
    rejectVerificationRequest,
    uploadVerificationDocument,
    submitVerificationRequest
} from '../controllers/verification.admin.controller.js';
import { protectAdmin, isSuperAdmin } from '../middleware/admin.auth.middleware.js';
import { protect } from '../../../middleware/auth.middleware.js';
import {
    validateCreateVerification,
    validateSubmitVerification,
    validateRejectVerification,
    validateObjectIdParam,
    validatePagination
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

// Public route for users to submit verification (requires user authentication)
router.post('/submit', protect, validateSubmitVerification, submitVerificationRequest);

// All routes below are protected and require SUPER_ADMIN role
router.use(protectAdmin, isSuperAdmin);

router.route('/requests')
    .get(validatePagination, getAllVerificationRequests)
    .post(validateCreateVerification, createVerificationRequest);

router.get('/requests/:id', validateObjectIdParam('id'), getVerificationRequestById);
router.put('/requests/:id/approve', validateObjectIdParam('id'), approveVerificationRequest);
router.put('/requests/:id/reject', validateObjectIdParam('id'), validateRejectVerification, rejectVerificationRequest);

router.post('/upload-document', upload.single('file'), uploadVerificationDocument);

export default router;
