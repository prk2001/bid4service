"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.deleteJob = exports.dismissReport = exports.resolveReport = exports.getAllReports = exports.reactivateUser = exports.suspendUser = exports.getAllUsers = exports.getPlatformStats = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Get platform statistics
 * GET /api/v1/admin/stats
 */
const getPlatformStats = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const [totalUsers, totalCustomers, totalProviders, totalJobs, openJobs, totalBids, totalProjects, completedProjects, totalPayments, totalRevenue, pendingReports,] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.user.count({ where: { role: 'PROVIDER' } }),
            prisma.job.count(),
            prisma.job.count({ where: { status: { in: ['OPEN', 'IN_BIDDING'] } } }),
            prisma.bid.count(),
            prisma.project.count(),
            prisma.project.count({ where: { status: 'COMPLETED' } }),
            prisma.payment.count(),
            prisma.payment.aggregate({
                where: { status: 'RELEASED' },
                _sum: { amount: true },
            }),
            prisma.report.count({ where: { status: 'PENDING' } }),
        ]);
        const stats = {
            users: {
                total: totalUsers,
                customers: totalCustomers,
                providers: totalProviders,
            },
            jobs: {
                total: totalJobs,
                open: openJobs,
            },
            bids: {
                total: totalBids,
            },
            projects: {
                total: totalProjects,
                completed: completedProjects,
                completionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : 0,
            },
            payments: {
                total: totalPayments,
                totalRevenue: totalRevenue._sum.amount || 0,
            },
            moderation: {
                pendingReports,
            },
        };
        res.status(200).json({
            success: true,
            data: { stats },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlatformStats = getPlatformStats;
/**
 * Get all users (with pagination)
 * GET /api/v1/admin/users
 */
const getAllUsers = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { page = '1', limit = '20', role, status, search, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    verificationStatus: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                users,
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
exports.getAllUsers = getAllUsers;
/**
 * Suspend user
 * POST /api/v1/admin/users/:userId/suspend
 */
const suspendUser = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { userId } = req.params;
        const { reason } = req.body;
        if (!reason) {
            throw new errors_1.BadRequestError('Suspension reason is required');
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Can't suspend another admin
        if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
            throw new errors_1.BadRequestError('Cannot suspend admin or moderator accounts');
        }
        await prisma.user.update({
            where: { id: userId },
            data: { status: client_1.UserStatus.SUSPENDED },
        });
        logger_1.default.info(`User suspended: ${userId} by admin ${req.user.userId} - Reason: ${reason}`);
        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.suspendUser = suspendUser;
/**
 * Reactivate user
 * POST /api/v1/admin/users/:userId/reactivate
 */
const reactivateUser = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { userId } = req.params;
        await prisma.user.update({
            where: { id: userId },
            data: { status: client_1.UserStatus.ACTIVE },
        });
        logger_1.default.info(`User reactivated: ${userId} by admin ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'User reactivated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reactivateUser = reactivateUser;
/**
 * Get all reports
 * GET /api/v1/admin/reports
 */
const getAllReports = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { page = '1', limit = '20', status, type, } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.report.count({ where }),
        ]);
        res.status(200).json({
            success: true,
            data: {
                reports,
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
exports.getAllReports = getAllReports;
/**
 * Resolve report
 * POST /api/v1/admin/reports/:reportId/resolve
 */
const resolveReport = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { reportId } = req.params;
        const { resolution, action } = req.body;
        if (!resolution) {
            throw new errors_1.BadRequestError('Resolution is required');
        }
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: client_1.ReportStatus.RESOLVED,
                resolution,
                resolvedBy: req.user.userId,
                resolvedAt: new Date(),
            },
        });
        logger_1.default.info(`Report resolved: ${reportId} by ${req.user.userId} - Action: ${action}`);
        res.status(200).json({
            success: true,
            message: 'Report resolved successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resolveReport = resolveReport;
/**
 * Dismiss report
 * POST /api/v1/admin/reports/:reportId/dismiss
 */
const dismissReport = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { reportId } = req.params;
        const { reason } = req.body;
        await prisma.report.update({
            where: { id: reportId },
            data: {
                status: client_1.ReportStatus.DISMISSED,
                resolution: reason,
                resolvedBy: req.user.userId,
                resolvedAt: new Date(),
            },
        });
        logger_1.default.info(`Report dismissed: ${reportId} by ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Report dismissed',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.dismissReport = dismissReport;
/**
 * Delete job (admin)
 * DELETE /api/v1/admin/jobs/:jobId
 */
const deleteJob = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { jobId } = req.params;
        const { reason } = req.body;
        await prisma.job.delete({
            where: { id: jobId },
        });
        logger_1.default.info(`Job deleted by admin: ${jobId} by ${req.user.userId} - Reason: ${reason}`);
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
 * Delete review (admin)
 * DELETE /api/v1/admin/reviews/:reviewId
 */
const deleteReview = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            throw new errors_1.UnauthorizedError('Admin access required');
        }
        const { reviewId } = req.params;
        const { reason } = req.body;
        await prisma.review.delete({
            where: { id: reviewId },
        });
        logger_1.default.info(`Review deleted by admin: ${reviewId} by ${req.user.userId} - Reason: ${reason}`);
        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReview = deleteReview;
