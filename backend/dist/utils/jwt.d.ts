export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
}
/**
 * Generate JWT token
 */
export declare const generateToken: (payload: JwtPayload) => string;
/**
 * Verify JWT token
 */
export declare const verifyToken: (token: string) => JwtPayload;
/**
 * Decode JWT token without verification (useful for debugging)
 */
export declare const decodeToken: (token: string) => JwtPayload | null;
