import { Request, Response, NextFunction } from 'express';
/**
 * Get user profile
 * GET /api/v1/users/profile
 */
export declare const getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export declare const updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get public profile of any user
 * GET /api/v1/users/:userId
 */
export declare const getPublicProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get user statistics
 * GET /api/v1/users/stats
 */
export declare const getUserStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload verification documents
 * POST /api/v1/users/verification/documents
 */
export declare const uploadVerificationDocs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
