import { Request, Response, NextFunction } from 'express';
/**
 * Get project details
 * GET /api/v1/projects/:id
 */
export declare const getProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get user's projects
 * GET /api/v1/projects
 */
export declare const getUserProjects: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create milestone
 * POST /api/v1/projects/:projectId/milestones
 */
export declare const createMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update milestone
 * PUT /api/v1/projects/milestones/:id
 */
export declare const updateMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Mark milestone as complete (provider)
 * POST /api/v1/projects/milestones/:id/complete
 */
export declare const completeMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Approve milestone (customer)
 * POST /api/v1/projects/milestones/:id/approve
 */
export declare const approveMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Reject milestone (customer)
 * POST /api/v1/projects/milestones/:id/reject
 */
export declare const rejectMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update project status
 * PUT /api/v1/projects/:id/status
 */
export declare const updateProjectStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Cancel project
 * POST /api/v1/projects/:id/cancel
 */
export declare const cancelProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
