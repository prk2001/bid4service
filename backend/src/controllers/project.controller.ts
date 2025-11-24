import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProjectStatus, MilestoneStatus } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get project details
 * GET /api/v1/projects/:id
 */
export const getProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
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
      throw new NotFoundError('Project not found');
    }

    // Verify user is involved
    const isInvolved = project.customerId === req.user.userId || 
                       project.providerId === req.user.userId;

    if (!isInvolved && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('You are not involved in this project');
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's projects
 * GET /api/v1/projects
 */
export const getUserProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
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
    const projectsWithUsers = await Promise.all(
      projects.map(async (project) => {
        const otherUserId = project.customerId === req.user!.userId 
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
      })
    );

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
  } catch (error) {
    next(error);
  }
};

/**
 * Create milestone
 * POST /api/v1/projects/:projectId/milestones
 */
export const createMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { projectId } = req.params;
    const { title, description, amount, order, dueDate } = req.body;

    if (!title || !amount) {
      throw new BadRequestError('Title and amount are required');
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Only customer or provider can create milestones
    const isInvolved = project.customerId === req.user.userId || 
                       project.providerId === req.user.userId;

    if (!isInvolved) {
      throw new ForbiddenError('You are not involved in this project');
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

    logger.info(`Milestone created: ${milestone.id} for project ${projectId}`);

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: { milestone },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update milestone
 * PUT /api/v1/projects/milestones/:id
 */
export const updateMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { title, description, amount, order, dueDate, status } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Check permissions
    const isInvolved = milestone.project.customerId === req.user.userId || 
                       milestone.project.providerId === req.user.userId;

    if (!isInvolved) {
      throw new ForbiddenError('You are not involved in this project');
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

    logger.info(`Milestone updated: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Milestone updated successfully',
      data: { milestone: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark milestone as complete (provider)
 * POST /api/v1/projects/milestones/:id/complete
 */
export const completeMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { completionPhotos, notes } = req.body;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Only provider can mark as complete
    if (milestone.project.providerId !== req.user.userId) {
      throw new ForbiddenError('Only the provider can mark milestones as complete');
    }

    if (milestone.status !== MilestoneStatus.IN_PROGRESS && 
        milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestError('Milestone must be in progress to complete');
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.PENDING_APPROVAL,
        completedDate: new Date(),
        completionPhotos: completionPhotos || [],
        notes,
      },
    });

    // TODO: Send notification to customer

    logger.info(`Milestone marked complete: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Milestone marked as complete. Awaiting customer approval.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve milestone (customer)
 * POST /api/v1/projects/milestones/:id/approve
 */
export const approveMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Only customer can approve
    if (milestone.project.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the customer can approve milestones');
    }

    if (milestone.status !== MilestoneStatus.PENDING_APPROVAL) {
      throw new BadRequestError('Milestone must be pending approval');
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.APPROVED,
      },
    });

    // TODO: Trigger payment release process

    logger.info(`Milestone approved: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Milestone approved. Payment can now be released.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject milestone (customer)
 * POST /api/v1/projects/milestones/:id/reject
 */
export const rejectMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new BadRequestError('Rejection reason is required');
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Only customer can reject
    if (milestone.project.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the customer can reject milestones');
    }

    if (milestone.status !== MilestoneStatus.PENDING_APPROVAL) {
      throw new BadRequestError('Milestone must be pending approval');
    }

    // Update milestone
    await prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.REJECTED,
        notes: reason,
      },
    });

    // TODO: Send notification to provider

    logger.info(`Milestone rejected: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Milestone rejected. Provider has been notified.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update project status
 * PUT /api/v1/projects/:id/status
 */
export const updateProjectStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new BadRequestError('Status is required');
    }

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    const isInvolved = project.customerId === req.user.userId || 
                       project.providerId === req.user.userId;

    if (!isInvolved && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('You are not involved in this project');
    }

    // Update status
    const updateData: any = { status };

    if (status === ProjectStatus.IN_PROGRESS && !project.startDate) {
      updateData.startDate = new Date();
    }

    if (status === ProjectStatus.COMPLETED && !project.actualEndDate) {
      updateData.actualEndDate = new Date();
      updateData.completedAt = new Date();
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    logger.info(`Project status updated: ${id} to ${status}`);

    res.status(200).json({
      success: true,
      message: 'Project status updated',
      data: { project: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel project
 * POST /api/v1/projects/:id/cancel
 */
export const cancelProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { reason } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Only customer or admin can cancel
    if (project.customerId !== req.user.userId && req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Only the customer can cancel the project');
    }

    if (project.status === ProjectStatus.COMPLETED) {
      throw new BadRequestError('Cannot cancel completed project');
    }

    // Update project
    await prisma.project.update({
      where: { id },
      data: {
        status: ProjectStatus.CANCELLED,
      },
    });

    // TODO: Handle refunds if applicable
    // TODO: Send notifications

    logger.info(`Project cancelled: ${id} - Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Project cancelled',
    });
  } catch (error) {
    next(error);
  }
};
