import express from 'express';
import {
    getAllLabours,
    getLabourById,
    createLabour,
    updateLabour,
    deleteLabour,
    getLabourContractorRequests,
    getLabourUserRequests,
    getLabourFeedbacks
} from '../controllers/labour.admin.controller.js';
import { protectAdmin, isLabourAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateCreateLabour,
    validateUpdateLabour,
    validateObjectIdParam,
    validatePagination
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// All routes are protected and require SUPER_ADMIN or ADMIN_LABOUR role
router.use(protectAdmin, isLabourAdmin);

router.route('/')
    .get(validatePagination, getAllLabours)
    .post(validateCreateLabour, createLabour);

router.route('/:id')
    .get(validateObjectIdParam('id'), getLabourById)
    .put(validateObjectIdParam('id'), validateUpdateLabour, updateLabour)
    .delete(validateObjectIdParam('id'), deleteLabour);

router.get('/:id/contractor-requests', validateObjectIdParam('id'), getLabourContractorRequests);
router.get('/:id/user-requests', validateObjectIdParam('id'), getLabourUserRequests);
router.get('/:id/feedbacks', validateObjectIdParam('id'), getLabourFeedbacks);

export default router;
