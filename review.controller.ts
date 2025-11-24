import { Request, Response, NextFunction } from 'express';
import { PrismaClient, ProjectStatus } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  ConflictError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Create a review
 * POST /api/v1/reviews
 */
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const {
      projectId,
      overallRating,
      qualityRating,
      communicationRating,
      timelinessRating,
      budgetRating,
      title,
      comment,
      photos,
    } = req.body;

    if (!projectId || !overallRating || !comment) {
      throw new BadRequestError('Project ID, overall rating, and comment are required');
    }

    // Validate ratings
    if (overallRating < 1 || overallRating > 5) {
      throw new BadRequestError('Ratings must be between 1 and 5');
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check if project is completed
    if (project.status !== ProjectStatus.COMPLETED) {
      throw new BadRequestError('Can only review completed projects');
    }

    // Determine who is reviewing whom
    let subjectId: string;
    if (req.user.userId === project.customerId) {
      subjectId = project.providerId; // Customer reviewing provider
    } else if (req.user.userId === project.providerId) {
      subjectId = project.customerId; // Provider reviewing customer
    } else {
      throw new ForbiddenError('You are not involved in this project');
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: {
        projectId_authorId: {
          projectId,
          authorId: req.user.userId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictError('You have already reviewed this project');
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        projectId,
        authorId: req.user.userId,
        subjectId,
        overallRating,
        qualityRating,
        communicationRating,
        timelinessRating,
        budgetRating,
        title,
        comment,
        photos: photos || [],
        verified: true, // Verified because it's tied to a real project
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
        subject: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    // Update average rating for the subject
    await updateAverageRating(subjectId);

    logger.info(`Review created: ${review.id} by ${req.user.userId} for ${subjectId}`);

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a user
 * GET /api/v1/reviews/user/:userId
 */
export const getUserReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const {
      page = '1',
      limit = '10',
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      subjectId: userId,
    };

    if (minRating) {
      where.overallRating = { gte: parseFloat(minRating as string) };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              job: {
                select: {
                  title: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // Get rating statistics
    const stats = await prisma.review.aggregate({
      where: { subjectId: userId },
      _avg: {
        overallRating: true,
        qualityRating: true,
        communicationRating: true,
        timelinessRating: true,
        budgetRating: true,
      },
      _count: true,
    });

    // Get rating distribution
    const distribution = await prisma.$queryRaw<Array<{ rating: number; count: number }>>`
      SELECT 
        FLOOR("overallRating") as rating,
        COUNT(*)::int as count
      FROM "Review"
      WHERE "subjectId" = ${userId}
      GROUP BY FLOOR("overallRating")
      ORDER BY rating DESC
    `;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          averageRating: stats._avg.overallRating || 0,
          averageQuality: stats._avg.qualityRating || 0,
          averageCommunication: stats._avg.communicationRating || 0,
          averageTimeliness: stats._avg.timelinessRating || 0,
          averageBudget: stats._avg.budgetRating || 0,
          totalReviews: stats._count,
        },
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single review
 * GET /api/v1/reviews/:id
 */
export const getReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
        subject: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            job: {
              select: {
                title: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    res.status(200).json({
      success: true,
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update review (within 30 days)
 * PUT /api/v1/reviews/:id
 */
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const {
      overallRating,
      qualityRating,
      communicationRating,
      timelinessRating,
      budgetRating,
      title,
      comment,
      photos,
    } = req.body;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    if (review.authorId !== req.user.userId) {
      throw new ForbiddenError('You can only update your own reviews');
    }

    // Check if within 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (review.createdAt < thirtyDaysAgo) {
      throw new BadRequestError('Reviews can only be edited within 30 days');
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(overallRating && { overallRating }),
        ...(qualityRating !== undefined && { qualityRating }),
        ...(communicationRating !== undefined && { communicationRating }),
        ...(timelinessRating !== undefined && { timelinessRating }),
        ...(budgetRating !== undefined && { budgetRating }),
        ...(title && { title }),
        ...(comment && { comment }),
        ...(photos !== undefined && { photos }),
      },
    });

    // Update average rating
    await updateAverageRating(review.subjectId);

    logger.info(`Review updated: ${id} by ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review: updatedReview },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Respond to a review
 * POST /api/v1/reviews/:id/respond
 */
export const respondToReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      throw new BadRequestError('Response text is required');
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Only the review subject can respond
    if (review.subjectId !== req.user.userId) {
      throw new ForbiddenError('You can only respond to reviews about you');
    }

    if (review.response) {
      throw new ConflictError('You have already responded to this review');
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        response,
        responseDate: new Date(),
      },
    });

    logger.info(`Review response added: ${id} by ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Response posted successfully',
      data: { review: updatedReview },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark review as helpful
 * POST /api/v1/reviews/:id/helpful
 */
export const markHelpful = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Increment helpful count
    await prisma.review.update({
      where: { id },
      data: {
        helpfulCount: { increment: 1 },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Marked as helpful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my reviews (reviews I wrote)
 * GET /api/v1/reviews/my-reviews
 */
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const reviews = await prisma.review.findMany({
      where: { authorId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to update average rating
 */
async function updateAverageRating(userId: string): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { subjectId: userId },
    _avg: { overallRating: true },
  });

  const averageRating = stats._avg.overallRating || 0;

  // Update appropriate profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === 'PROVIDER') {
    await prisma.providerProfile.update({
      where: { userId },
      data: { averageRating },
    });
  } else if (user?.role === 'CUSTOMER') {
    await prisma.customerProfile.update({
      where: { userId },
      data: { averageRating },
    });
  }
}
