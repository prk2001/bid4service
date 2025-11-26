"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require admin/moderator authentication
router.use(auth_1.authenticate);
// Platform statistics (admin & moderator)
router.get('/stats', (0, auth_1.authorize)('ADMIN', 'MODERATOR'), admin_controller_1.getPlatformStats);
// User management (admin & moderator)
router.get('/users', (0, auth_1.authorize)('ADMIN', 'MODERATOR'), admin_controller_1.getAllUsers);
// User actions (admin only)
router.post('/users/:userId/suspend', (0, auth_1.authorize)('ADMIN'), admin_controller_1.suspendUser);
router.post('/users/:userId/reactivate', (0, auth_1.authorize)('ADMIN'), admin_controller_1.reactivateUser);
// Reports management (admin & moderator)
router.get('/reports', (0, auth_1.authorize)('ADMIN', 'MODERATOR'), admin_controller_1.getAllReports);
router.post('/reports/:reportId/resolve', (0, auth_1.authorize)('ADMIN', 'MODERATOR'), admin_controller_1.resolveReport);
router.post('/reports/:reportId/dismiss', (0, auth_1.authorize)('ADMIN', 'MODERATOR'), admin_controller_1.dismissReport);
// Content moderation (admin only)
router.delete('/jobs/:jobId', (0, auth_1.authorize)('ADMIN'), admin_controller_1.deleteJob);
router.delete('/reviews/:reviewId', (0, auth_1.authorize)('ADMIN'), admin_controller_1.deleteReview);
exports.default = router;
