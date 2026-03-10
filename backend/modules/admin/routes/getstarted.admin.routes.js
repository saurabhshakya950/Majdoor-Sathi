import express from 'express';
import {
    getAllSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    toggleSlideStatus,
    getActiveSlides
} from '../controllers/getstarted.admin.controller.js';
import { protectAdmin, isUserAdmin } from '../middleware/admin.auth.middleware.js';

const router = express.Router();

// Public route to get active slides for the GetStarted page
router.get('/public', getActiveSlides);

// All other routes require admin authentication
router.use(protectAdmin, isUserAdmin);

router.get('/', getAllSlides);
router.post('/', createSlide);
router.put('/:id', updateSlide);
router.delete('/:id', deleteSlide);
router.patch('/:id/toggle', toggleSlideStatus);

export default router;
