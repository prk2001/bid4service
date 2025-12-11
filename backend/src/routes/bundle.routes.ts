import { Router } from 'express';
import { createBundle, getAllBundles, getBundleById, getMyBundles, submitBundleBid, acceptBundleBid, deleteBundle } from '../controllers/bundle.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize('CUSTOMER'), createBundle);
router.get('/my-bundles', authenticate, getMyBundles);
router.delete('/:id', authenticate, authorize('CUSTOMER'), deleteBundle);
router.post('/:id/bids/:bidId/accept', authenticate, authorize('CUSTOMER'), acceptBundleBid);
router.post('/:id/bids', authenticate, authorize('PROVIDER'), submitBundleBid);
router.get('/', authenticate, getAllBundles);
router.get('/:id', authenticate, getBundleById);

export default router;
