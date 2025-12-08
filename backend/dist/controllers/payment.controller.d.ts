import { Request, Response, NextFunction } from 'express';
/**
 * Create payment setup intent (for saving payment method)
 * POST /api/v1/payments/setup-intent
 */
export declare const createSetupIntent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Fund escrow for a project
 * POST /api/v1/payments/escrow
 */
export declare const fundEscrow: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Release milestone payment
 * POST /api/v1/payments/release-milestone
 */
export declare const releaseMilestone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Release final payment
 * POST /api/v1/payments/release-final
 */
export declare const releaseFinalPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Request refund
 * POST /api/v1/payments/refund
 */
export declare const requestRefund: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get payment history
 * GET /api/v1/payments/history
 */
export declare const getPaymentHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get project payments
 * GET /api/v1/payments/project/:projectId
 */
export declare const getProjectPayments: (req: Request, res: Response, next: NextFunction) => Promise<void>;
