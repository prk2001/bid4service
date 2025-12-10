// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get user profile
 * GET /api/v1/users/profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        profileImage: true,
        role: true,
        status: true,
        verificationStatus: true,
        customerProfile: true,
        providerProfile: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const {
      firstName,
      lastName,
      phone,
      profileImage,
      // Customer profile
      address,
      city,
      state,
      zipCode,
      country,
      preferredContactMethod,
      // Provider profile
      businessName,
      businessType,
      serviceCategories,
      serviceRadius,
      yearsExperience,
      bio,
      website,
      portfolioImages,
      availableForEmergency,
      responseTimeHours,
    } = req.body;

    // Update user basic info
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
    });

    // Update role-specific profile
    if (user.role === 'CUSTOMER') {
      const customerData: any = {};
      if (address) customerData.address = address;
      if (city) customerData.city = city;
      if (state) customerData.state = state;
      if (zipCode) customerData.zipCode = zipCode;
      if (country) customerData.country = country;
      if (preferredContactMethod) customerData.preferredContactMethod = preferredContactMethod;

      if (Object.keys(customerData).length > 0) {
        await prisma.customerProfile.update({
          where: { userId: req.user.userId },
        update: providerData,
        create: { userId: req.user.userId, ...providerData },
          data: customerData,
        });
      }
    } else if (user.role === 'PROVIDER') {
      const providerData: any = {};
      if (businessName) providerData.businessName = businessName;
      if (businessType) providerData.businessType = businessType;
      if (serviceCategories) providerData.serviceCategories = serviceCategories;
      if (serviceRadius) providerData.serviceRadius = parseInt(serviceRadius);
      if (yearsExperience) providerData.yearsExperience = parseInt(yearsExperience);
      if (bio) providerData.bio = bio;
      if (website) providerData.website = website;
      if (portfolioImages) providerData.portfolioImages = portfolioImages;
      if (availableForEmergency !== undefined) providerData.availableForEmergency = availableForEmergency;
      if (responseTimeHours) providerData.responseTimeHours = parseInt(responseTimeHours);
      if (address) providerData.address = address;
      if (city) providerData.city = city;
      if (state) providerData.state = state;
      if (zipCode) providerData.zipCode = zipCode;
      if (country) providerData.country = country;

      if (Object.keys(providerData).length > 0) {
        await prisma.providerProfile.upsert({
          where: { userId: req.user.userId },
        update: providerData,
        create: { userId: req.user.userId, ...providerData },
        });
      }
    }

    // Get updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        profileImage: true,
        role: true,
        status: true,
        verificationStatus: true,
        customerProfile: true,
        providerProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Profile updated: ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public profile of any user
 * GET /api/v1/users/:userId
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: {
          select: {
            totalJobsPosted: true,
            averageRating: true,
          },
        },
        providerProfile: {
          select: {
            businessName: true,
            businessType: true,
            serviceCategories: true,
            serviceRadius: true,
            yearsExperience: true,
            bio: true,
            website: true,
            portfolioImages: true,
            availableForEmergency: true,
            responseTimeHours: true,
            city: true,
            state: true,
            zipCode: true,
            totalBidsSubmitted: true,
            totalBidsWon: true,
            totalProjectsCompleted: true,
            totalEarned: true,
            averageRating: true,
            backgroundCheckStatus: true,
            licenseVerified: true,
            insuranceVerified: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        role: true,
        verificationStatus: true,
        customerProfile: true,
        providerProfile: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get review stats
    const reviewStats = await prisma.review.aggregate({
      where: { subjectId: userId },
      _avg: { overallRating: true },
      _count: true,
    });

    res.status(200).json({
      success: true,
      data: {
        user,
        reviewStats: {
          averageRating: reviewStats._avg.overallRating || 0,
          totalReviews: reviewStats._count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 * GET /api/v1/users/stats
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let stats: any = {};

    if (user.role === 'CUSTOMER') {
      const [jobs, reviews, totalSpent] = await Promise.all([
        prisma.job.count({
          where: { customerId: req.user.userId },
        }),
        prisma.review.count({
          where: { subjectId: req.user.userId },
        }),
        prisma.payment.aggregate({
          where: {
            userId: req.user.userId,
            status: 'RELEASED',
          },
          _sum: { amount: true },
        }),
      ]);

      stats = {
        totalJobsPosted: jobs,
        totalReviews: reviews,
        totalSpent: totalSpent._sum.amount || 0,
      };
    } else if (user.role === 'PROVIDER') {
      const [bids, wonBids, projects, reviews, earnings] = await Promise.all([
        prisma.bid.count({
          where: { providerId: req.user.userId },
        }),
        prisma.bid.count({
          where: {
            providerId: req.user.userId,
            status: 'ACCEPTED',
          },
        }),
        prisma.project.count({
          where: {
            providerId: req.user.userId,
            status: 'COMPLETED',
          },
        }),
        prisma.review.count({
          where: { subjectId: req.user.userId },
        }),
        prisma.payment.aggregate({
          where: {
            project: {
              providerId: req.user.userId,
            },
            status: 'RELEASED',
          },
          _sum: { amount: true },
        }),
      ]);

      stats = {
        totalBidsSubmitted: bids,
        totalBidsWon: wonBids,
        winRate: bids > 0 ? ((wonBids / bids) * 100).toFixed(1) : 0,
        totalProjectsCompleted: projects,
        totalReviews: reviews,
        totalEarnings: earnings._sum.amount || 0,
      };
    }

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload verification documents
 * POST /api/v1/users/verification/documents
 */
export const uploadVerificationDocs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const { documentType, documentUrl } = req.body;

    if (!documentType || !documentUrl) {
      throw new BadRequestError('Document type and URL are required');
    }

    // TODO: Store verification documents
    // In production, this would upload to S3 and store references

    // Update verification status
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        verificationStatus: 'PENDING',
      },
    });

    logger.info(`Verification documents uploaded: ${req.user.userId}`);

    res.status(200).json({
      success: true,
      message: 'Documents uploaded. Verification pending.',
    });
  } catch (error) {
    next(error);
  }
};
