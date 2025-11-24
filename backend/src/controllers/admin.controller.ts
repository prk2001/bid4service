import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserStatus, ReportStatus } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get platform statistics
 * GET /api/v1/admin/stats
 */
export const getPlatformStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
      throw new UnauthorizedError('Admin access required');
    }

    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalJobs,
      openJobs,
      totalBids,
      totalProjects,
      completedProjects,
      totalPayments,
      totalRevenue,
      pendingReports,
    ] = await Promise.all([
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (with pagination)
 * GET /api/v1/admin/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
      throw new UnauthorizedError('Admin access required');
    }

    const {
      page = '1',
      limit = '20',
      role,
      status,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
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
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend user
 * POST /api/v1/admin/users/:userId/suspend
 */
export const suspendUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Admin access required');
    }

    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new BadRequestError('Suspension reason is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Can't suspend another admin
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      throw new BadRequestError('Cannot suspend admin or moderator accounts');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    logger.info(`User suspended: ${userId} by admin ${req.user.userId} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivate user
 * POST /api/v1/admin/users/:userId/reactivate
 */
export const reactivateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Admin access required');
    }

    const { userId } = req.params;

    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
    });

    logger.info(`User reactivated: ${userId} by admin ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reports
 * GET /api/v1/admin/reports
 */
export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
      throw new UnauthorizedError('Admin access required');
    }

    const {
      page = '1',
      limit = '20',
      status,
      type,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

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
  } catch (error) {
    next(error);
  }
};

/**
 * Resolve report
 * POST /api/v1/admin/reports/:reportId/resolve
 */
export const resolveReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
      throw new UnauthorizedError('Admin access required');
    }

    const { reportId } = req.params;
    const { resolution, action } = req.body;

    if (!resolution) {
      throw new BadRequestError('Resolution is required');
    }

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        resolution,
        resolvedBy: req.user.userId,
        resolvedAt: new Date(),
      },
    });

    logger.info(`Report resolved: ${reportId} by ${req.user.userId} - Action: ${action}`);

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dismiss report
 * POST /api/v1/admin/reports/:reportId/dismiss
 */
export const dismissReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR')) {
      throw new UnauthorizedError('Admin access required');
    }

    const { reportId } = req.params;
    const { reason } = req.body;

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.DISMISSED,
        resolution: reason,
        resolvedBy: req.user.userId,
        resolvedAt: new Date(),
      },
    });

    logger.info(`Report dismissed: ${reportId} by ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Report dismissed',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete job (admin)
 * DELETE /api/v1/admin/jobs/:jobId
 */
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Admin access required');
    }

    const { jobId } = req.params;
    const { reason } = req.body;

    await prisma.job.delete({
      where: { id: jobId },
    });

    logger.info(`Job deleted by admin: ${jobId} by ${req.user.userId} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete review (admin)
 * DELETE /api/v1/admin/reviews/:reviewId
 */
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new UnauthorizedError('Admin access required');
    }

    const { reviewId } = req.params;
    const { reason } = req.body;

    await prisma.review.delete({
      where: { id: reviewId },
    });

    logger.info(`Review deleted by admin: ${reviewId} by ${req.user.userId} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
