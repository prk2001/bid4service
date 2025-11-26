import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
export declare const upload: multer.Multer;
/**
 * Upload single file
 * POST /api/v1/upload
 */
export declare const uploadFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Upload multiple files
 * POST /api/v1/upload/multiple
 */
export declare const uploadMultipleFiles: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete file
 * DELETE /api/v1/upload/:filename
 */
export declare const deleteFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get file info
 * GET /api/v1/upload/:filename
 */
export declare const getFileInfo: (req: Request, res: Response, next: NextFunction) => Promise<void>;
