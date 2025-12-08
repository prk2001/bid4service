import { Request, Response, NextFunction } from 'express';
/**
 * Create a new job
 * POST /api/v1/jobs
 */
export declare const createJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all jobs with filtering and pagination
 * GET /api/v1/jobs
 */
export declare const getAllJobs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get single job by ID
 * GET /api/v1/jobs/:id
 */
export declare const getJobById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update job
 * PUT /api/v1/jobs/:id
 */
export declare const updateJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete job
 * DELETE /api/v1/jobs/:id
 */
export declare const deleteJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get jobs posted by current user
 * GET /api/v1/jobs/my-jobs
 */
export declare const getMyJobs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Close job to new bids
 * POST /api/v1/jobs/:id/close
 */
export declare const closeJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
