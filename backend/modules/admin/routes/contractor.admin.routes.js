import express from 'express';
import {
    getAllContractors,
    getContractorById,
    createContractor,
    updateContractor,
    deleteContractor,
    getContractorUserRequests,
    getContractorLabourRequests,
    getContractorFeedbacks
} from '../controllers/contractor.admin.controller.js';
import { protectAdmin, isContractorAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateCreateContractor,
    validateUpdateContractor,
    validateObjectIdParam,
    validatePagination
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// All routes are protected and require SUPER_ADMIN or ADMIN_CONTRACTOR role
router.use(protectAdmin, isContractorAdmin);

router.route('/')
    .get(validatePagination, getAllContractors)
    .post(validateCreateContractor, createContractor);

router.route('/:id')
    .get(validateObjectIdParam('id'), getContractorById)
    .put(validateObjectIdParam('id'), validateUpdateContractor, updateContractor)
    .delete(validateObjectIdParam('id'), deleteContractor);

router.get('/:id/user-requests', validateObjectIdParam('id'), getContractorUserRequests);
router.get('/:id/labour-requests', validateObjectIdParam('id'), getContractorLabourRequests);
router.get('/:id/feedbacks', validateObjectIdParam('id'), getContractorFeedbacks);

export default router;
