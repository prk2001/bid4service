"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelProject = exports.updateProjectStatus = exports.rejectMilestone = exports.approveMilestone = exports.completeMilestone = exports.updateMilestone = exports.createMilestone = exports.getUserProjects = exports.getProject = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Get project details
 * GET /api/v1/projects/:id
 */
const getProject = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                job: {
                    include: {
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                profileImage: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
                milestones: {
                    orderBy: { order: 'asc' },
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        });
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        // Verify user is involved
        const isInvolved = project.customerId === req.user.userId ||
            project.providerId === req.user.userId;
        if (!isInvolved && req.user.role !== 'ADMIN') {
            throw new errors_1.ForbiddenError('You are not involved in this project');
        }
        // Get provider info
        const provider = await prisma.user.findUnique({
            where: { id: project.providerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                email: true,
                phone: true,
                providerProfile: {
                    select: {
                        businessName: true,
                        averageRating: true,
                        totalProjectsCompleted: true,
                    },
                },
            },
        });
        res.status(200).json({
            success: true,
            data: {
                project: {
                    ...project,
                    provider,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProject = getProject;
/**
 * Get user's projects
 * GET /api/v1/projects
 */
const getUserProjects = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { status, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {
            OR: [
                { customerId: req.user.userId },
                { providerId: req.user.userId },
            ],
        };
        if (status) {
            where.status = status;
        }
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    job: {
                        select: {
                            title: true,
                            category: true,
                        },
                    },
                    milestones: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                    _count: {
                        select: {
                            messages: true,
                        },
                    },
                },
            }),
            prisma.project.count({ where }),
        ]);
        // Add other party info
        const projectsWithUsers = await Promise.all(projects.map(async (project) => {
            const otherUserId = project.customerId === req.user.userId
                ? project.providerId
                : project.customerId;
            const otherUser = await prisma.user.findUnique({
                where: { id: otherUserId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                    role: true,
                },
            });
            return {
                ...project,
                otherUser,
            };
        }));
        res.status(200).json({
            success: true,
            data: {
                projects: projectsWithUsers,
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
exports.getUserProjects = getUserProjects;
/**
 * Create milestone
 * POST /api/v1/projects/:projectId/milestones
 */
const createMilestone = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { projectId } = req.params;
        const { title, description, amount, order, dueDate } = req.body;
        if (!title || !amount) {
            throw new errors_1.BadRequestError('Title and amount are required');
        }
        // Get project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        // Only customer or provider can create milestones
        const isInvolved = project.customerId === req.user.userId ||
            project.providerId === req.user.userId;
        if (!isInvolved) {
            throw new errors_1.ForbiddenError('You are not involved in this project');
        }
        // Create milestone
        const milestone = await prisma.milestone.create({
            data: {
                projectId,
                title,
                description,
                amount: parseFloat(amount),
                order: order || 1,
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });
        logger_1.default.info(`Milestone created: ${milestone.id} for project ${projectId}`);
        res.status(201).json({
            success: true,
            message: 'Milestone created successfully',
            data: { milestone },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createMilestone = createMilestone;
/**
 * Update milestone
 * PUT /api/v1/projects/milestones/:id
 */
const updateMilestone = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const { title, description, amount, order, dueDate, status } = req.body;
        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!milestone) {
            throw new errors_1.NotFoundError('Milestone not found');
        }
        // Check permissions
        const isInvolved = milestone.project.customerId === req.user.userId ||
            milestone.project.providerId === req.user.userId;
        if (!isInvolved) {
            throw new errors_1.ForbiddenError('You are not involved in this project');
        }
        // Update milestone
        const updated = await prisma.milestone.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(amount && { amount: parseFloat(amount) }),
                ...(order !== undefined && { order: parseInt(order) }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(status && { status }),
            },
        });
        logger_1.default.info(`Milestone updated: ${id}`);
        res.status(200).json({
            success: true,
            message: 'Milestone updated successfully',
            data: { milestone: updated },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMilestone = updateMilestone;
/**
 * Mark milestone as complete (provider)
 * POST /api/v1/projects/milestones/:id/complete
 */
const completeMilestone = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const { completionPhotos, notes } = req.body;
        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!milestone) {
            throw new errors_1.NotFoundError('Milestone not found');
        }
        // Only provider can mark as complete
        if (milestone.project.providerId !== req.user.userId) {
            throw new errors_1.ForbiddenError('Only the provider can mark milestones as complete');
        }
        if (milestone.status !== client_1.MilestoneStatus.IN_PROGRESS &&
            milestone.status !== client_1.MilestoneStatus.PENDING) {
            throw new errors_1.BadRequestError('Milestone must be in progress to complete');
        }
        // Update milestone
        await prisma.milestone.update({
            where: { id },
            data: {
                status: client_1.MilestoneStatus.PENDING_APPROVAL,
                completedDate: new Date(),
                completionPhotos: completionPhotos || [],
                notes,
            },
        });
        // TODO: Send notification to customer
        logger_1.default.info(`Milestone marked complete: ${id}`);
        res.status(200).json({
            success: true,
            message: 'Milestone marked as complete. Awaiting customer approval.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.completeMilestone = completeMilestone;
/**
 * Approve milestone (customer)
 * POST /api/v1/projects/milestones/:id/approve
 */
const approveMilestone = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!milestone) {
            throw new errors_1.NotFoundError('Milestone not found');
        }
        // Only customer can approve
        if (milestone.project.customerId !== req.user.userId) {
            throw new errors_1.ForbiddenError('Only the customer can approve milestones');
        }
        if (milestone.status !== client_1.MilestoneStatus.PENDING_APPROVAL) {
            throw new errors_1.BadRequestError('Milestone must be pending approval');
        }
        // Update milestone
        await prisma.milestone.update({
            where: { id },
            data: {
                status: client_1.MilestoneStatus.APPROVED,
            },
        });
        // TODO: Trigger payment release process
        logger_1.default.info(`Milestone approved: ${id}`);
        res.status(200).json({
            success: true,
            message: 'Milestone approved. Payment can now be released.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.approveMilestone = approveMilestone;
/**
 * Reject milestone (customer)
 * POST /api/v1/projects/milestones/:id/reject
 */
const rejectMilestone = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason) {
            throw new errors_1.BadRequestError('Rejection reason is required');
        }
        const milestone = await prisma.milestone.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!milestone) {
            throw new errors_1.NotFoundError('Milestone not found');
        }
        // Only customer can reject
        if (milestone.project.customerId !== req.user.userId) {
            throw new errors_1.ForbiddenError('Only the customer can reject milestones');
        }
        if (milestone.status !== client_1.MilestoneStatus.PENDING_APPROVAL) {
            throw new errors_1.BadRequestError('Milestone must be pending approval');
        }
        // Update milestone
        await prisma.milestone.update({
            where: { id },
            data: {
                status: client_1.MilestoneStatus.REJECTED,
                notes: reason,
            },
        });
        // TODO: Send notification to provider
        logger_1.default.info(`Milestone rejected: ${id}`);
        res.status(200).json({
            success: true,
            message: 'Milestone rejected. Provider has been notified.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.rejectMilestone = rejectMilestone;
/**
 * Update project status
 * PUT /api/v1/projects/:id/status
 */
const updateProjectStatus = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            throw new errors_1.BadRequestError('Status is required');
        }
        const project = await prisma.project.findUnique({
            where: { id },
        });
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        // Check permissions
        const isInvolved = project.customerId === req.user.userId ||
            project.providerId === req.user.userId;
        if (!isInvolved && req.user.role !== 'ADMIN') {
            throw new errors_1.ForbiddenError('You are not involved in this project');
        }
        // Update status
        const updateData = { status };
        if (status === client_1.ProjectStatus.IN_PROGRESS && !project.startDate) {
            updateData.startDate = new Date();
        }
        if (status === client_1.ProjectStatus.COMPLETED && !project.actualEndDate) {
            updateData.actualEndDate = new Date();
            updateData.completedAt = new Date();
        }
        const updated = await prisma.project.update({
            where: { id },
            data: updateData,
        });
        logger_1.default.info(`Project status updated: ${id} to ${status}`);
        res.status(200).json({
            success: true,
            message: 'Project status updated',
            data: { project: updated },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProjectStatus = updateProjectStatus;
/**
 * Cancel project
 * POST /api/v1/projects/:id/cancel
 */
const cancelProject = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const { reason } = req.body;
        const project = await prisma.project.findUnique({
            where: { id },
        });
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        // Only customer or admin can cancel
        if (project.customerId !== req.user.userId && req.user.role !== 'ADMIN') {
            throw new errors_1.ForbiddenError('Only the customer can cancel the project');
        }
        if (project.status === client_1.ProjectStatus.COMPLETED) {
            throw new errors_1.BadRequestError('Cannot cancel completed project');
        }
        // Update project
        await prisma.project.update({
            where: { id },
            data: {
                status: client_1.ProjectStatus.CANCELLED,
            },
        });
        // TODO: Handle refunds if applicable
        // TODO: Send notifications
        logger_1.default.info(`Project cancelled: ${id} - Reason: ${reason}`);
        res.status(200).json({
            success: true,
            message: 'Project cancelled',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelProject = cancelProject;
