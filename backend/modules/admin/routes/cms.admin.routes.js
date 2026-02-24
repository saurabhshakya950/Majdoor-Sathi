import express from 'express';
import {
    getAllCMSContent,
    getCMSContentBySection,
    updateCMSContent,
    updateCMSSection
} from '../controllers/cms.admin.controller.js';
import { protectAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateUpdateCMSContent,
    validateUpdateCMSSection
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// Public route for getting CMS content
router.get('/:section', getCMSContentBySection);

// Protected routes
router.get('/', protectAdmin, getAllCMSContent);
router.put('/', protectAdmin, validateUpdateCMSContent, updateCMSContent);
router.put('/:section', protectAdmin, validateUpdateCMSSection, updateCMSSection);

export default router;
