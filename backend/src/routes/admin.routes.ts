import { Router } from 'express';
import {
  getPlatformStats,
  getAllUsers,
  suspendUser,
  reactivateUser,
  getAllReports,
  resolveReport,
  dismissReport,
  deleteJob,
  deleteReview,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require admin/moderator authentication
router.use(authenticate);

// Platform statistics (admin & moderator)
router.get('/stats', authorize('ADMIN', 'MODERATOR'), getPlatformStats);

// User management (admin & moderator)
router.get('/users', authorize('ADMIN', 'MODERATOR'), getAllUsers);

// User actions (admin only)
router.post('/users/:userId/suspend', authorize('ADMIN'), suspendUser);
router.post('/users/:userId/reactivate', authorize('ADMIN'), reactivateUser);

// Reports management (admin & moderator)
router.get('/reports', authorize('ADMIN', 'MODERATOR'), getAllReports);
router.post('/reports/:reportId/resolve', authorize('ADMIN', 'MODERATOR'), resolveReport);
router.post('/reports/:reportId/dismiss', authorize('ADMIN', 'MODERATOR'), dismissReport);

// Content moderation (admin only)
router.delete('/jobs/:jobId', authorize('ADMIN'), deleteJob);
router.delete('/reviews/:reviewId', authorize('ADMIN'), deleteReview);

export default router;
