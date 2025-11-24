import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create subdirectories for different file types
    let subDir = 'other';
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype === 'application/pdf') {
      subDir = 'documents';
    }

    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed.'), false);
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: fileFilter,
});

/**
 * Upload single file
 * POST /api/v1/upload
 */
export const uploadFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    // Generate URL for the file
    const fileUrl = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`;

    logger.info(`File uploaded: ${req.file.filename} by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple files
 * POST /api/v1/upload/multiple
 */
export const uploadMultipleFiles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    const files = req.files.map((file: Express.Multer.File) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
    }));

    logger.info(`${files.length} files uploaded by user ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: { files },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file
 * DELETE /api/v1/upload/:filename
 */
export const deleteFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { filename } = req.params;

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestError('Invalid filename');
    }

    // Search in all subdirectories
    const uploadDir = path.join(__dirname, '../../uploads');
    const subdirs = ['images', 'documents', 'other'];
    
    let deleted = false;
    for (const subdir of subdirs) {
      const filePath = path.join(uploadDir, subdir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deleted = true;
        logger.info(`File deleted: ${filename} by user ${req.user.userId}`);
        break;
      }
    }

    if (!deleted) {
      throw new BadRequestError('File not found');
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get file info
 * GET /api/v1/upload/:filename
 */
export const getFileInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { filename } = req.params;

    // Security: Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestError('Invalid filename');
    }

    // Search in all subdirectories
    const uploadDir = path.join(__dirname, '../../uploads');
    const subdirs = ['images', 'documents', 'other'];
    
    for (const subdir of subdirs) {
      const filePath = path.join(uploadDir, subdir, filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        res.status(200).json({
          success: true,
          data: {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
            url: `/uploads/${subdir}/${filename}`,
          },
        });
        return;
      }
    }

    throw new BadRequestError('File not found');
  } catch (error) {
    next(error);
  }
};
