import { Request, Response, NextFunction } from 'express';
import { PrismaClient, PaymentStatus, PaymentType, ProjectStatus } from '@prisma/client';
import Stripe from 'stripe';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Create payment setup intent (for saving payment method)
 * POST /api/v1/payments/setup-intent
 */
export const createSetupIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId: string;

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // In production, store stripeCustomerId in database
    // For now, create new customer each time
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: req.user.userId,
      },
    });

    stripeCustomerId = customer.id;

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
    });

    res.status(200).json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fund escrow for a project
 * POST /api/v1/payments/escrow
 */
export const fundEscrow = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { projectId, paymentMethodId } = req.body;

    if (!projectId || !paymentMethodId) {
      throw new BadRequestError('Project ID and payment method are required');
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        job: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify user is the customer
    if (project.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the customer can fund escrow');
    }

    // Check if already funded
    const existingPayment = await prisma.payment.findFirst({
      where: {
        projectId,
        type: PaymentType.DEPOSIT,
        status: { in: [PaymentStatus.AUTHORIZED, PaymentStatus.HELD_IN_ESCROW] },
      },
    });

    if (existingPayment) {
      throw new BadRequestError('Escrow already funded for this project');
    }

    // Create Stripe payment intent
    const amount = Math.round(project.agreedAmount * 100); // Convert to cents

    // Create or get customer
    const customer = await stripe.customers.create({
      email: project.job.customer.email,
      name: `${project.job.customer.firstName} ${project.job.customer.lastName}`,
      metadata: {
        userId: req.user.userId,
      },
    });

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customer.id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      capture_method: 'manual', // Hold the funds (escrow)
      description: `Escrow for Project ${projectId}`,
      metadata: {
        projectId,
        customerId: req.user.userId,
        providerId: project.providerId,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        projectId,
        userId: req.user.userId,
        amount: project.agreedAmount,
        type: PaymentType.DEPOSIT,
        status: PaymentStatus.HELD_IN_ESCROW,
        stripePaymentIntentId: paymentIntent.id,
        description: 'Full project amount held in escrow',
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.IN_PROGRESS,
        startDate: new Date(),
      },
    });

    logger.info(`Escrow funded: ${payment.id} for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: 'Escrow funded successfully. Funds are held securely.',
      data: { payment },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      next(new BadRequestError(error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Release milestone payment
 * POST /api/v1/payments/release-milestone
 */
export const releaseMilestone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { milestoneId } = req.body;

    if (!milestoneId) {
      throw new BadRequestError('Milestone ID is required');
    }

    // Get milestone with project details
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            payments: {
              where: {
                status: PaymentStatus.HELD_IN_ESCROW,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundError('Milestone not found');
    }

    // Verify user is the customer
    if (milestone.project.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the customer can release payments');
    }

    // Check milestone is approved
    if (milestone.status !== 'APPROVED') {
      throw new BadRequestError('Milestone must be approved before payment release');
    }

    // Check if already paid
    if (milestone.paymentId) {
      throw new BadRequestError('Milestone already paid');
    }

    // Get escrow payment
    const escrowPayment = milestone.project.payments[0];
    if (!escrowPayment) {
      throw new NotFoundError('No escrow payment found');
    }

    // Calculate amount to release (could be partial)
    const releaseAmount = milestone.amount;

    // Create payment intent for milestone
    const amount = Math.round(releaseAmount * 100); // Convert to cents

    // Create a new payment intent (transfer to provider)
    // In a real implementation, you'd use Stripe Connect for this
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description: `Milestone payment for Project ${milestone.projectId}`,
      metadata: {
        milestoneId,
        projectId: milestone.projectId,
        providerId: milestone.project.providerId,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        projectId: milestone.projectId,
        userId: req.user.userId,
        amount: releaseAmount,
        type: PaymentType.MILESTONE,
        status: PaymentStatus.RELEASED,
        stripePaymentIntentId: paymentIntent.id,
        description: `Milestone: ${milestone.title}`,
      },
    });

    // Link payment to milestone
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        paymentId: payment.id,
      },
    });

    logger.info(`Milestone payment released: ${payment.id} for milestone ${milestoneId}`);

    res.status(200).json({
      success: true,
      message: 'Payment released to provider',
      data: { payment },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      next(new BadRequestError(error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Release final payment
 * POST /api/v1/payments/release-final
 */
export const releaseFinalPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { projectId } = req.body;

    if (!projectId) {
      throw new BadRequestError('Project ID is required');
    }

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        payments: true,
        milestones: true,
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Verify user is the customer
    if (project.customerId !== req.user.userId) {
      throw new ForbiddenError('Only the customer can release final payment');
    }

    // Check project is completed
    if (project.status !== ProjectStatus.PENDING_APPROVAL) {
      throw new BadRequestError('Project must be pending approval');
    }

    // Calculate remaining amount
    const totalPaid = project.payments
      .filter(p => p.status === PaymentStatus.RELEASED)
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingAmount = project.agreedAmount - totalPaid;

    if (remainingAmount <= 0) {
      throw new BadRequestError('All payments have been released');
    }

    // Create payment intent for final payment
    const amount = Math.round(remainingAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      description: `Final payment for Project ${projectId}`,
      metadata: {
        projectId,
        providerId: project.providerId,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        projectId,
        userId: req.user.userId,
        amount: remainingAmount,
        type: PaymentType.FINAL,
        status: PaymentStatus.RELEASED,
        stripePaymentIntentId: paymentIntent.id,
        description: 'Final project payment',
        releasedAt: new Date(),
      },
    });

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: ProjectStatus.COMPLETED,
        actualEndDate: new Date(),
        completedAt: new Date(),
      },
    });

    // Update provider stats
    await prisma.providerProfile.update({
      where: { userId: project.providerId },
      data: {
        totalProjectsCompleted: { increment: 1 },
        totalEarned: { increment: project.agreedAmount },
      },
    });

    // Update customer stats
    await prisma.customerProfile.update({
      where: { userId: project.customerId },
      data: {
        totalSpent: { increment: project.agreedAmount },
      },
    });

    logger.info(`Final payment released: ${payment.id} for project ${projectId}`);

    res.status(200).json({
      success: true,
      message: 'Final payment released. Project completed!',
      data: { payment },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      next(new BadRequestError(error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Request refund
 * POST /api/v1/payments/refund
 */
export const requestRefund = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { paymentId, reason } = req.body;

    if (!paymentId) {
      throw new BadRequestError('Payment ID is required');
    }

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        project: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Verify user is the customer
    if (payment.userId !== req.user.userId) {
      throw new ForbiddenError('Only the payer can request refunds');
    }

    // Check if refundable
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestError('Payment already refunded');
    }

    if (payment.status !== PaymentStatus.HELD_IN_ESCROW && 
        payment.status !== PaymentStatus.RELEASED) {
      throw new BadRequestError('Payment cannot be refunded');
    }

    // Process refund through Stripe
    if (payment.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      logger.info(`Refund processed: ${refund.id} for payment ${paymentId}`);

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: { refund },
      });
    } else {
      throw new BadRequestError('No Stripe payment intent found');
    }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      next(new BadRequestError(error.message));
    } else {
      next(error);
    }
  }
};

/**
 * Get payment history
 * GET /api/v1/payments/history
 */
export const getPaymentHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
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

    const where: any = {
      userId: req.user.userId,
    };

    if (status) where.status = status;
    if (type) where.type = type;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              agreedAmount: true,
              job: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
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
 * Get project payments
 * GET /api/v1/payments/project/:projectId
 */
export const getProjectPayments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { projectId } = req.params;

    // Verify user is involved in project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isInvolved = project.customerId === req.user.userId || 
                       project.providerId === req.user.userId;

    if (!isInvolved) {
      throw new ForbiddenError('You are not involved in this project');
    }

    const payments = await prisma.payment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const summary = {
      totalAgreed: project.agreedAmount,
      totalPaid: payments
        .filter(p => p.status === PaymentStatus.RELEASED)
        .reduce((sum, p) => sum + p.amount, 0),
      inEscrow: payments
        .filter(p => p.status === PaymentStatus.HELD_IN_ESCROW)
        .reduce((sum, p) => sum + p.amount, 0),
      refunded: payments
        .filter(p => p.status === PaymentStatus.REFUNDED)
        .reduce((sum, p) => sum + p.amount, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        payments,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};
