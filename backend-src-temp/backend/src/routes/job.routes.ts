import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  closeJob,
} from '../controllers/job.controller';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Create new job (customers only)
router.post('/', authenticate, authorize('CUSTOMER'), createJob);

// Get all jobs (public with optional auth)
router.get('/', optionalAuthenticate, getAllJobs);

// Get current user's jobs (customers only)
router.get('/my-jobs', authenticate, authorize('CUSTOMER'), getMyJobs);

// Get job by ID (public with optional auth)
router.get('/:id', optionalAuthenticate, getJobById);

// Update job (customers only, own jobs)
router.put('/:id', authenticate, authorize('CUSTOMER'), updateJob);

// Delete job (customers only, own jobs)
router.delete('/:id', authenticate, deleteJob);

// Close job to bidding (customers only)
router.post('/:id/close', authenticate, authorize('CUSTOMER'), closeJob);

export default router;
