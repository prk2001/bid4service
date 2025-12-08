"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileInfo = exports.deleteFile = exports.uploadMultipleFiles = exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Create subdirectories for different file types
        let subDir = 'other';
        if (file.mimetype.startsWith('image/')) {
            subDir = 'images';
        }
        else if (file.mimetype === 'application/pdf') {
            subDir = 'documents';
        }
        const fullPath = path_1.default.join(uploadDir, subDir);
        if (!fs_1.default.existsSync(fullPath)) {
            fs_1.default.mkdirSync(fullPath, { recursive: true });
        }
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        const baseName = path_1.default.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX) are allowed.'), false);
    }
};
// Configure multer
exports.upload = (0, multer_1.default)({
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
const uploadFile = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        if (!req.file) {
            throw new errors_1.BadRequestError('No file uploaded');
        }
        // Generate URL for the file
        const fileUrl = `/uploads/${path_1.default.basename(path_1.default.dirname(req.file.path))}/${req.file.filename}`;
        logger_1.default.info(`File uploaded: ${req.file.filename} by user ${req.user.userId}`);
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
    }
    catch (error) {
        next(error);
    }
};
exports.uploadFile = uploadFile;
/**
 * Upload multiple files
 * POST /api/v1/upload/multiple
 */
const uploadMultipleFiles = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            throw new errors_1.BadRequestError('No files uploaded');
        }
        const files = req.files.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/uploads/${path_1.default.basename(path_1.default.dirname(file.path))}/${file.filename}`,
        }));
        logger_1.default.info(`${files.length} files uploaded by user ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: `${files.length} files uploaded successfully`,
            data: { files },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadMultipleFiles = uploadMultipleFiles;
/**
 * Delete file
 * DELETE /api/v1/upload/:filename
 */
const deleteFile = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { filename } = req.params;
        // Security: Prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            throw new errors_1.BadRequestError('Invalid filename');
        }
        // Search in all subdirectories
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        const subdirs = ['images', 'documents', 'other'];
        let deleted = false;
        for (const subdir of subdirs) {
            const filePath = path_1.default.join(uploadDir, subdir, filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                deleted = true;
                logger_1.default.info(`File deleted: ${filename} by user ${req.user.userId}`);
                break;
            }
        }
        if (!deleted) {
            throw new errors_1.BadRequestError('File not found');
        }
        res.status(200).json({
            success: true,
            message: 'File deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteFile = deleteFile;
/**
 * Get file info
 * GET /api/v1/upload/:filename
 */
const getFileInfo = async (req, res, next) => {
    try {
        const { filename } = req.params;
        // Security: Prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            throw new errors_1.BadRequestError('Invalid filename');
        }
        // Search in all subdirectories
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        const subdirs = ['images', 'documents', 'other'];
        for (const subdir of subdirs) {
            const filePath = path_1.default.join(uploadDir, subdir, filename);
            if (fs_1.default.existsSync(filePath)) {
                const stats = fs_1.default.statSync(filePath);
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
        throw new errors_1.BadRequestError('File not found');
    }
    catch (error) {
        next(error);
    }
};
exports.getFileInfo = getFileInfo;
