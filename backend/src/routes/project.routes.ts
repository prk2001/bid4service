import { Router } from 'express';
import {
  getProject,
  getUserProjects,
  createMilestone,
  updateMilestone,
  completeMilestone,
  approveMilestone,
  rejectMilestone,
  updateProjectStatus,
  cancelProject,
} from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's projects
router.get('/', getUserProjects);

// Get single project
router.get('/:id', getProject);

// Create milestone
router.post('/:projectId/milestones', createMilestone);

// Update milestone
router.put('/milestones/:id', updateMilestone);

// Provider: Mark milestone complete
router.post('/milestones/:id/complete', authorize('PROVIDER'), completeMilestone);

// Customer: Approve milestone
router.post('/milestones/:id/approve', authorize('CUSTOMER'), approveMilestone);

// Customer: Reject milestone
router.post('/milestones/:id/reject', authorize('CUSTOMER'), rejectMilestone);

// Update project status
router.put('/:id/status', updateProjectStatus);

// Cancel project
router.post('/:id/cancel', cancelProject);

export default router;
