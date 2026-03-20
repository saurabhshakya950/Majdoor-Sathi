import express from 'express';
import authAdminRoutes from './auth.admin.routes.js';
import userAdminRoutes from './user.admin.routes.js';
import labourAdminRoutes from './labour.admin.routes.js';
import contractorAdminRoutes from './contractor.admin.routes.js';
import categoryAdminRoutes from './category.admin.routes.js';
import verificationAdminRoutes from './verification.admin.routes.js';
import cmsAdminRoutes from './cms.admin.routes.js';
import dashboardAdminRoutes from './dashboard.admin.routes.js';
import broadcastAdminRoutes from './broadcast.admin.routes.js';
import adminManagementRoutes from './admin.management.routes.js';
import bannerAdminRoutes from './banner.admin.routes.js';
import getStartedAdminRoutes from './getstarted.admin.routes.js';
import notificationAdminRoutes from './notification.admin.routes.js';

const router = express.Router();

// Mount all admin routes
router.use('/auth', authAdminRoutes);
router.use('/users', userAdminRoutes);
router.use('/labours', labourAdminRoutes);
router.use('/contractors', contractorAdminRoutes);
router.use('/labour-categories', categoryAdminRoutes);
router.use('/verification', verificationAdminRoutes);
router.use('/cms', cmsAdminRoutes);
router.use('/dashboard', dashboardAdminRoutes);
router.use('/broadcasts', broadcastAdminRoutes);
router.use('/management', adminManagementRoutes);
router.use('/banners', bannerAdminRoutes);
router.use('/getstarted', getStartedAdminRoutes);
router.use('/notifications', notificationAdminRoutes);

export default router;
