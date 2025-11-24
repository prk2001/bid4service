import { Router } from 'express';
import {
  createReview,
  getUserReviews,
  getReview,
  updateReview,
  respondToReview,
  markHelpful,
  getMyReviews,
} from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create review (requires auth)
router.post('/', authenticate, createReview);

// Get my reviews
router.get('/my-reviews', authenticate, getMyReviews);

// Get reviews for a user (public)
router.get('/user/:userId', getUserReviews);

// Get single review (public)
router.get('/:id', getReview);

// Update review (requires auth)
router.put('/:id', authenticate, updateReview);

// Respond to review (requires auth)
router.post('/:id/respond', authenticate, respondToReview);

// Mark as helpful (requires auth)
router.post('/:id/helpful', authenticate, markHelpful);

export default router;
