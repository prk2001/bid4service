import { Request, Response, NextFunction } from 'express';
/**
 * Submit a bid on a job
 * POST /api/v1/jobs/:jobId/bids
 */
export declare const submitBid: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all bids for a job
 * GET /api/v1/jobs/:jobId/bids
 */
export declare const getJobBids: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get single bid by ID
 * GET /api/v1/bids/:id
 */
export declare const getBidById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Update bid (before acceptance)
 * PUT /api/v1/bids/:id
 */
export declare const updateBid: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Withdraw bid
 * POST /api/v1/bids/:id/withdraw
 */
export declare const withdrawBid: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Accept bid (customer only)
 * POST /api/v1/bids/:id/accept
 */
export declare const acceptBid: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Reject bid (customer only)
 * POST /api/v1/bids/:id/reject
 */
export declare const rejectBid: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get provider's bids
 * GET /api/v1/bids/my-bids
 */
export declare const getMyBids: (req: Request, res: Response, next: NextFunction) => Promise<void>;
