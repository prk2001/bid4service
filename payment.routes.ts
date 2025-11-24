import { Router } from 'express';
import {
  createSetupIntent,
  fundEscrow,
  releaseMilestone,
  releaseFinalPayment,
  requestRefund,
  getPaymentHistory,
  getProjectPayments,
} from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Setup payment method
router.post('/setup-intent', createSetupIntent);

// Customer only - fund escrow
router.post('/escrow', authorize('CUSTOMER'), fundEscrow);

// Customer only - release payments
router.post('/release-milestone', authorize('CUSTOMER'), releaseMilestone);
router.post('/release-final', authorize('CUSTOMER'), releaseFinalPayment);

// Request refund
router.post('/refund', requestRefund);

// Get payment history
router.get('/history', getPaymentHistory);

// Get project payments
router.get('/project/:projectId', getProjectPayments);

export default router;
