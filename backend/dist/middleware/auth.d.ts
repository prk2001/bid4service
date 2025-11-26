import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}
/**
 * Middleware to authenticate requests using JWT
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to authorize based on user roles
 */
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - doesn't fail if no token
 */
export declare const optionalAuthenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
