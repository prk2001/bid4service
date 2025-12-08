import { Request, Response, NextFunction } from 'express';
/**
 * Create a review
 * POST /api/v1/reviews
 */
export declare const createReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get reviews for a user
 * GET /api/v1/reviews/user/:userId
 */
export declare const getUserReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get single review
 * GET /api/v1/reviews/:id
 */
export declare const getReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update review (within 30 days)
 * PUT /api/v1/reviews/:id
 */
export declare const updateReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Respond to a review
 * POST /api/v1/reviews/:id/respond
 */
export declare const respondToReview: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Mark review as helpful
 * POST /api/v1/reviews/:id/helpful
 */
export declare const markHelpful: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get my reviews (reviews I wrote)
 * GET /api/v1/reviews/my-reviews
 */
export declare const getMyReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
