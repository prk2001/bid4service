import { Request, Response, NextFunction } from 'express';
/**
 * Get platform statistics
 * GET /api/v1/admin/stats
 */
export declare const getPlatformStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all users (with pagination)
 * GET /api/v1/admin/users
 */
export declare const getAllUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Suspend user
 * POST /api/v1/admin/users/:userId/suspend
 */
export declare const suspendUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Reactivate user
 * POST /api/v1/admin/users/:userId/reactivate
 */
export declare const reactivateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all reports
 * GET /api/v1/admin/reports
 */
export declare const getAllReports: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Resolve report
 * POST /api/v1/admin/reports/:reportId/resolve
 */
export declare const resolveReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Dismiss report
 * POST /api/v1/admin/reports/:reportId/dismiss
 */
export declare const dismissReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete job (admin)
 * DELETE /api/v1/admin/jobs/:jobId
 */
export declare const deleteJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete review (admin)
 * DELETE /api/v1/admin/reviews/:reviewId
 */
export declare const deleteReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
