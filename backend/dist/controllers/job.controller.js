"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeJob = exports.getMyJobs = exports.deleteJob = exports.updateJob = exports.getJobById = exports.getAllJobs = exports.createJob = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Create a new job
 * POST /api/v1/jobs
 */
const createJob = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        if (req.user.role !== 'CUSTOMER') {
            throw new errors_1.ForbiddenError('Only customers can post jobs');
        }
        const { title, description, category, subcategory, address, city, state, zipCode, latitude, longitude, startingBid, maxBudget, desiredStartDate, desiredEndDate, urgency, images, documents, requiresLicense, requiresInsurance, requiresBackground, minimumRating, status, } = req.body;
        // Validate required fields
        if (!title || !description || !category || !address || !city || !state || !zipCode || !startingBid) {
            throw new errors_1.BadRequestError('Missing required fields');
        }
        // Create job
        const job = await prisma.job.create({
            data: {
                customerId: req.user.userId,
                title,
                description,
                category,
                subcategory,
                address,
                city,
                state,
                zipCode,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                startingBid: parseFloat(startingBid),
                maxBudget: maxBudget ? parseFloat(maxBudget) : null,
                desiredStartDate: desiredStartDate ? new Date(desiredStartDate) : null,
                desiredEndDate: desiredEndDate ? new Date(desiredEndDate) : null,
                urgency: urgency || client_1.JobUrgency.STANDARD,
                images: images || [],
                documents: documents || [],
                requiresLicense: requiresLicense || false,
                requiresInsurance: requiresInsurance || false,
                requiresBackground: requiresBackground || false,
                minimumRating: minimumRating ? parseFloat(minimumRating) : null,
                status: status || client_1.JobStatus.OPEN,
                publishedAt: status === client_1.JobStatus.OPEN ? new Date() : null,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        logger_1.default.info(`Job created: ${job.id} by user ${req.user.userId}`);
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            data: { job },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
/**
 * Get all jobs with filtering and pagination
 * GET /api/v1/jobs
 */
const getAllJobs = async (req, res, next) => {
    try {
        const { page = '1', limit = '10', category, status, urgency, minBudget, maxBudget, zipCode, search, sortBy = 'createdAt', sortOrder = 'desc', } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {
            status: status ? status : { in: [client_1.JobStatus.OPEN, client_1.JobStatus.IN_BIDDING] },
        };
        if (category)
            where.category = category;
        if (urgency)
            where.urgency = urgency;
        if (zipCode)
            where.zipCode = zipCode;
        if (minBudget || maxBudget) {
            where.startingBid = {};
            if (minBudget)
                where.startingBid.gte = parseFloat(minBudget);
            if (maxBudget)
                where.startingBid.lte = parseFloat(maxBudget);
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        // Get jobs
        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    customer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        },
                    },
                    _count: {
                        select: {
                            bids: true,
                        },
                    },
                },
            }),
            prisma.job.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllJobs = getAllJobs;
/**
 * Get single job by ID
 * GET /api/v1/jobs/:id
 */
const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        customerProfile: {
                            select: {
                                averageRating: true,
                                totalJobsPosted: true,
                            },
                        },
                    },
                },
                bids: {
                    include: {
                        provider: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                profileImage: true,
                                providerProfile: {
                                    select: {
                                        businessName: true,
                                        averageRating: true,
                                        totalProjectsCompleted: true,
                                    },
                                },
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        bids: true,
                    },
                },
            },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        // Increment view count
        await prisma.job.update({
            where: { id },
            data: { views: { increment: 1 } },
        });
        res.status(200).json({
            success: true,
            data: { job },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobById = getJobById;
/**
 * Update job
 * PUT /api/v1/jobs/:id
 */
const updateJob = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        // Check if job exists and belongs to user
        const existingJob = await prisma.job.findUnique({
            where: { id },
        });
        if (!existingJob) {
            throw new errors_1.NotFoundError('Job not found');
        }
        if (existingJob.customerId !== req.user.userId) {
            throw new errors_1.ForbiddenError('You can only update your own jobs');
        }
        // Don't allow updates if job has accepted bid
        if (existingJob.status === client_1.JobStatus.BID_ACCEPTED ||
            existingJob.status === client_1.JobStatus.IN_PROGRESS ||
            existingJob.status === client_1.JobStatus.COMPLETED) {
            throw new errors_1.BadRequestError('Cannot update job in current status');
        }
        const { title, description, category, subcategory, address, city, state, zipCode, latitude, longitude, startingBid, maxBudget, desiredStartDate, desiredEndDate, urgency, images, documents, requiresLicense, requiresInsurance, requiresBackground, minimumRating, status, } = req.body;
        // Update job
        const job = await prisma.job.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(category && { category }),
                ...(subcategory !== undefined && { subcategory }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(zipCode && { zipCode }),
                ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
                ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
                ...(startingBid && { startingBid: parseFloat(startingBid) }),
                ...(maxBudget !== undefined && { maxBudget: maxBudget ? parseFloat(maxBudget) : null }),
                ...(desiredStartDate !== undefined && { desiredStartDate: desiredStartDate ? new Date(desiredStartDate) : null }),
                ...(desiredEndDate !== undefined && { desiredEndDate: desiredEndDate ? new Date(desiredEndDate) : null }),
                ...(urgency && { urgency }),
                ...(images !== undefined && { images }),
                ...(documents !== undefined && { documents }),
                ...(requiresLicense !== undefined && { requiresLicense }),
                ...(requiresInsurance !== undefined && { requiresInsurance }),
                ...(requiresBackground !== undefined && { requiresBackground }),
                ...(minimumRating !== undefined && { minimumRating: minimumRating ? parseFloat(minimumRating) : null }),
                ...(status && { status }),
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        logger_1.default.info(`Job updated: ${job.id} by user ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            data: { job },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
/**
 * Delete job
 * DELETE /api/v1/jobs/:id
 */
const deleteJob = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        // Check if job exists and belongs to user
        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        bids: true,
                    },
                },
            },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        if (job.customerId !== req.user.userId && req.user.role !== 'ADMIN') {
            throw new errors_1.ForbiddenError('You can only delete your own jobs');
        }
        // Don't allow deletion if job has accepted bid
        if (job.status === client_1.JobStatus.BID_ACCEPTED ||
            job.status === client_1.JobStatus.IN_PROGRESS ||
            job.status === client_1.JobStatus.COMPLETED) {
            throw new errors_1.BadRequestError('Cannot delete job in current status');
        }
        // Delete job (cascades to bids)
        await prisma.job.delete({
            where: { id },
        });
        logger_1.default.info(`Job deleted: ${id} by user ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
/**
 * Get jobs posted by current user
 * GET /api/v1/jobs/my-jobs
 */
const getMyJobs = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        if (req.user.role !== 'CUSTOMER') {
            throw new errors_1.ForbiddenError('Only customers can view their jobs');
        }
        const { page = '1', limit = '10', status, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            customerId: req.user.userId,
        };
        if (status) {
            where.status = status;
        }
        const [jobs, total] = await Promise.all([
            prisma.job.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            bids: true,
                        },
                    },
                },
            }),
            prisma.job.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyJobs = getMyJobs;
/**
 * Close job to new bids
 * POST /api/v1/jobs/:id/close
 */
const closeJob = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const job = await prisma.job.findUnique({
            where: { id },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        if (job.customerId !== req.user.userId) {
            throw new errors_1.ForbiddenError('You can only close your own jobs');
        }
        if (job.status !== client_1.JobStatus.OPEN && job.status !== client_1.JobStatus.IN_BIDDING) {
            throw new errors_1.BadRequestError('Job is not open for bidding');
        }
        const updatedJob = await prisma.job.update({
            where: { id },
            data: {
                status: client_1.JobStatus.CANCELLED,
            },
        });
        logger_1.default.info(`Job closed: ${id} by user ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Job closed successfully',
            data: { job: updatedJob },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.closeJob = closeJob;
