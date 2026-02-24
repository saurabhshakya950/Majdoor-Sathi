import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.admin.controller.js';
import { protectAdmin, isLabourAdmin } from '../middleware/admin.auth.middleware.js';
import {
    validateCreateCategory,
    validateUpdateCategory,
    validateObjectIdParam
} from '../middleware/admin.validation.middleware.js';

const router = express.Router();

// All routes are protected and require SUPER_ADMIN or ADMIN_LABOUR role
router.use(protectAdmin, isLabourAdmin);

router.route('/')
    .get(getAllCategories)
    .post(validateCreateCategory, createCategory);

router.route('/:id')
    .get(validateObjectIdParam('id'), getCategoryById)
    .put(validateObjectIdParam('id'), validateUpdateCategory, updateCategory)
    .delete(validateObjectIdParam('id'), deleteCategory);

export default router;
