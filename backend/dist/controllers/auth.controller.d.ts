import { Request, Response, NextFunction } from 'express';
/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Login user
 * POST /api/v1/auth/login
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get current user
 * GET /api/v1/auth/me
 */
export declare const getCurrentUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Logout user (client-side token removal)
 * POST /api/v1/auth/logout
 */
export declare const logout: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Change password
 * PUT /api/v1/auth/change-password
 */
export declare const changePassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
