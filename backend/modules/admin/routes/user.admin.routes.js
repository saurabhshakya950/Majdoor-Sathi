import express from 'express';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserContractorRequests,
    getUserLabourRequests,
    getUserFeedbacks
} from '../controllers/user.admin.controller.js';
import { protectAdmin, isUserAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateCreateUser,
    validateUpdateUser,
    validateObjectIdParam,
    validatePagination
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// All routes are protected and require SUPER_ADMIN or ADMIN_USER role
router.use(protectAdmin, isUserAdmin);

router.route('/')
    .get(validatePagination, getAllUsers)
    .post(validateCreateUser, createUser);

router.route('/:id')
    .get(validateObjectIdParam('id'), getUserById)
    .put(validateObjectIdParam('id'), validateUpdateUser, updateUser)
    .delete(validateObjectIdParam('id'), deleteUser);

router.get('/:id/contractor-requests', validateObjectIdParam('id'), getUserContractorRequests);
router.get('/:id/labour-requests', validateObjectIdParam('id'), getUserLabourRequests);
router.get('/:id/feedbacks', validateObjectIdParam('id'), getUserFeedbacks);

export default router;
