import { Request, Response, NextFunction } from 'express';
import { PrismaClient, BidStatus, JobStatus } from '@prisma/client';
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
 * Submit a bid on a job
 * POST /api/v1/jobs/:jobId/bids
 */
export const submitBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (req.user.role !== 'PROVIDER') {
      throw new ForbiddenError('Only providers can submit bids');
    }

    const { jobId } = req.params;
    const {
      amount,
      proposal,
      estimatedDuration,
      proposedStartDate,
      laborCost,
      materialCost,
      equipmentCost,
      attachments,
    } = req.body;

    // Validate required fields
    if (!amount || !proposal) {
      throw new BadRequestError('Amount and proposal are required');
    }

    // Check if job exists and is open for bidding
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
      },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JobStatus.OPEN && job.status !== JobStatus.IN_BIDDING) {
      throw new BadRequestError('Job is not open for bidding');
    }

    // Check if provider has already bid on this job
    const existingBid = await prisma.bid.findUnique({
      where: {
        jobId_providerId: {
          jobId,
          providerId: req.user.userId,
        },
      },
    });

    if (existingBid) {
      throw new ConflictError('You have already submitted a bid for this job');
    }

    // Create bid
    const bid = await prisma.bid.create({
      data: {
        jobId,
        providerId: req.user.userId,
        amount: parseFloat(amount),
        proposal,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
        laborCost: laborCost ? parseFloat(laborCost) : null,
        materialCost: materialCost ? parseFloat(materialCost) : null,
        equipmentCost: equipmentCost ? parseFloat(equipmentCost) : null,
        attachments: attachments || [],
      },
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
                yearsExperience: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            customerId: true,
          },
        },
      },
    });

    // Update job status to IN_BIDDING if not already
    if (job.status === JobStatus.OPEN) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: JobStatus.IN_BIDDING },
      });
    }

    // Update provider stats
    await prisma.providerProfile.update({
      where: { userId: req.user.userId },
      data: {
        totalBidsSubmitted: { increment: 1 },
      },
    });

    // TODO: Send notification to customer about new bid

    logger.info(`Bid submitted: ${bid.id} by provider ${req.user.userId} on job ${jobId}`);

    res.status(201).json({
      success: true,
      message: 'Bid submitted successfully',
      data: { bid },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bids for a job
 * GET /api/v1/jobs/:jobId/bids
 */
export const getJobBids = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Only job owner can see all bids
    if (!req.user || (req.user.userId !== job.customerId && req.user.role !== 'ADMIN')) {
      throw new ForbiddenError('Only the job owner can view all bids');
    }

    const bids = await prisma.bid.findMany({
      where: { jobId },
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
                yearsExperience: true,
                serviceCategories: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: { bids },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single bid by ID
 * GET /api/v1/bids/:id
 */
export const getBidById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
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
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            providerProfile: true,
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    // Check authorization
    const isCustomer = req.user.userId === bid.job.customerId;
    const isProvider = req.user.userId === bid.providerId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      throw new ForbiddenError('Not authorized to view this bid');
    }

    // Mark as viewed if customer is viewing
    if (isCustomer && !bid.viewedByCustomer) {
      await prisma.bid.update({
        where: { id },
        data: {
          viewedByCustomer: true,
          viewedAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { bid },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bid (before acceptance)
 * PUT /api/v1/bids/:id
 */
export const updateBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    // Check authorization
    if (bid.providerId !== req.user.userId) {
      throw new ForbiddenError('You can only update your own bids');
    }

    // Can't update accepted or rejected bids
    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestError('Cannot update bid in current status');
    }

    const {
      amount,
      proposal,
      estimatedDuration,
      proposedStartDate,
      laborCost,
      materialCost,
      equipmentCost,
      attachments,
    } = req.body;

    const updatedBid = await prisma.bid.update({
      where: { id },
      data: {
        ...(amount && { amount: parseFloat(amount) }),
        ...(proposal && { proposal }),
        ...(estimatedDuration !== undefined && { estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null }),
        ...(proposedStartDate !== undefined && { proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null }),
        ...(laborCost !== undefined && { laborCost: laborCost ? parseFloat(laborCost) : null }),
        ...(materialCost !== undefined && { materialCost: materialCost ? parseFloat(materialCost) : null }),
        ...(equipmentCost !== undefined && { equipmentCost: equipmentCost ? parseFloat(equipmentCost) : null }),
        ...(attachments !== undefined && { attachments }),
        viewedByCustomer: false, // Reset viewed status after update
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    logger.info(`Bid updated: ${id} by provider ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Bid updated successfully',
      data: { bid: updatedBid },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Withdraw bid
 * POST /api/v1/bids/:id/withdraw
 */
export const withdrawBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if (bid.providerId !== req.user.userId) {
      throw new ForbiddenError('You can only withdraw your own bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestError('Cannot withdraw bid in current status');
    }

    await prisma.bid.update({
      where: { id },
      data: { status: BidStatus.WITHDRAWN },
    });

    logger.info(`Bid withdrawn: ${id} by provider ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Bid withdrawn successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept bid (customer only)
 * POST /api/v1/bids/:id/accept
 */
export const acceptBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        job: true,
        provider: {
          include: {
            providerProfile: true,
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    // Check authorization
    if (bid.job.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the job owner can accept bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestError('This bid is no longer available');
    }

    if (bid.job.status !== JobStatus.OPEN && bid.job.status !== JobStatus.IN_BIDDING) {
      throw new BadRequestError('Job is not open for bidding');
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Accept this bid
      await tx.bid.update({
        where: { id },
        data: { status: BidStatus.ACCEPTED },
      });

      // Reject all other bids for this job
      await tx.bid.updateMany({
        where: {
          jobId: bid.jobId,
          id: { not: id },
          status: BidStatus.PENDING,
        },
        data: { status: BidStatus.REJECTED },
      });

      // Update job
      await tx.job.update({
        where: { id: bid.jobId },
        data: {
          status: JobStatus.BID_ACCEPTED,
          acceptedBidId: id,
        },
      });

      // Create project
      await tx.project.create({
        data: {
          jobId: bid.jobId,
          customerId: bid.job.customerId,
          providerId: bid.providerId,
          agreedAmount: bid.amount,
          estimatedEndDate: bid.proposedStartDate 
            ? new Date(new Date(bid.proposedStartDate).getTime() + (bid.estimatedDuration || 0) * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      // Update provider stats
      await tx.providerProfile.update({
        where: { userId: bid.providerId },
        data: {
          totalBidsWon: { increment: 1 },
        },
      });
    });

    // TODO: Send notifications
    // - Notify winning provider
    // - Notify losing providers
    // - Create escrow payment intent

    logger.info(`Bid accepted: ${id} by customer ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Bid accepted successfully. Project created.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject bid (customer only)
 * POST /api/v1/bids/:id/reject
 */
export const rejectBid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!bid) {
      throw new NotFoundError('Bid not found');
    }

    if (bid.job.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the job owner can reject bids');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestError('Cannot reject bid in current status');
    }

    await prisma.bid.update({
      where: { id },
      data: { status: BidStatus.REJECTED },
    });

    logger.info(`Bid rejected: ${id} by customer ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Bid rejected',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get provider's bids
 * GET /api/v1/bids/my-bids
 */
export const getMyBids = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (req.user.role !== 'PROVIDER') {
      throw new ForbiddenError('Only providers can view their bids');
    }

    const {
      page = '1',
      limit = '10',
      status,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      providerId: req.user.userId,
    };

    if (status) {
      where.status = status;
    }

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              city: true,
              state: true,
              status: true,
            },
          },
        },
      }),
      prisma.bid.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bids,
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
