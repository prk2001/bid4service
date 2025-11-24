import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getPublicProfile,
  getUserStats,
  uploadVerificationDocs,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get current user profile (requires auth)
router.get('/profile', authenticate, getProfile);

// Update profile (requires auth)
router.put('/profile', authenticate, updateProfile);

// Get user statistics (requires auth)
router.get('/stats', authenticate, getUserStats);

// Upload verification documents (requires auth)
router.post('/verification/documents', authenticate, uploadVerificationDocs);

// Get public profile (public)
router.get('/:userId', getPublicProfile);

export default router;
