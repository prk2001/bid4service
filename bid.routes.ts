import { Router } from 'express';
import {
  submitBid,
  getJobBids,
  getBidById,
  updateBid,
  withdrawBid,
  acceptBid,
  rejectBid,
  getMyBids,
} from '../controllers/bid.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Provider routes
router.post('/jobs/:jobId/bids', authenticate, authorize('PROVIDER'), submitBid);
router.get('/my-bids', authenticate, authorize('PROVIDER'), getMyBids);
router.put('/:id', authenticate, authorize('PROVIDER'), updateBid);
router.post('/:id/withdraw', authenticate, authorize('PROVIDER'), withdrawBid);

// Customer routes
router.get('/jobs/:jobId/bids', authenticate, getJobBids);
router.post('/:id/accept', authenticate, authorize('CUSTOMER'), acceptBid);
router.post('/:id/reject', authenticate, authorize('CUSTOMER'), rejectBid);

// Shared routes
router.get('/:id', authenticate, getBidById);

export default router;
