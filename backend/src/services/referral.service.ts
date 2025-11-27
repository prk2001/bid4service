// @ts-nocheck
import { PrismaClient, SocialPlatform } from '@prisma/client';
import { referralRewardTiers, ReferralRewardTier } from '../config/social.config';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CreateReferralOptions {
  referrerId: string;
  referralType: string;
  source?: SocialPlatform;
  expiresInDays?: number;
}

export class ReferralService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async createReferral(options: CreateReferralOptions) {
    const { referrerId, referralType, source, expiresInDays = 30 } = options;

    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId,
        referralType: referralType as any,
        status: { in: ['PENDING', 'CLICKED'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (existingReferral) {
      return existingReferral;
    }

    const referralCode = crypto.randomBytes(6).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referralCode,
        referralType: referralType as any,
        source,
        expiresAt,
      },
    });

    return referral;
  }

  async getReferralLink(userId: string, referralType: string = 'HOMEOWNER'): Promise<string> {
    let referral = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        referralType: referralType as any,
        status: { in: ['PENDING', 'CLICKED'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!referral) {
      referral = await this.createReferral({
        referrerId: userId,
        referralType,
      });
    }

    return `${this.baseUrl}/join/${referral.referralCode}`;
  }

  async getReferralStats(userId: string) {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
    });

    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.status === 'CONVERTED').length;
    const currentTier = referralRewardTiers[0];

    return {
      totalReferrals,
      pendingReferrals: referrals.filter(r => ['PENDING', 'CLICKED', 'SIGNED_UP'].includes(r.status)).length,
      convertedReferrals,
      totalEarnings: 0,
      pendingEarnings: 0,
      currentTier,
      nextTier: referralRewardTiers[1] || null,
      referralsToNextTier: 5 - convertedReferrals,
      conversionRate: 0,
    };
  }

  async getReferralHistory(userId: string, options: { limit?: number; offset?: number }) {
    return prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  async getLeaderboard(limit: number = 10) {
    return [];
  }

  async trackClick(code: string, metadata?: any) {
    await prisma.referral.updateMany({
      where: { referralCode: code, status: 'PENDING' },
      data: { status: 'CLICKED', clickCount: { increment: 1 } },
    });
  }

  async processSignup(referralCode: string, newUserId: string) {
    await prisma.referral.updateMany({
      where: { referralCode },
      data: { referredUserId: newUserId, status: 'SIGNED_UP', signupAt: new Date() },
    });
  }

  async processConversion(referralCode: string) {
    await prisma.referral.updateMany({
      where: { referralCode },
      data: { status: 'CONVERTED', conversionAt: new Date() },
    });
  }

  async requestPayout(userId: string) {
    return { amount: 0, referralIds: [] };
  }

  async validateReferralCode(code: string) {
    const referral = await prisma.referral.findUnique({
      where: { referralCode: code },
      include: { referrer: { select: { firstName: true, lastName: true } } },
    });
    if (!referral) return { valid: false };
    return { valid: true, referrer: referral.referrer };
  }

  async getCustomReferralCode(userId: string) {
    const settings = await prisma.userSocialSettings.findUnique({ where: { userId } });
    return settings?.referralCodeCustom || null;
  }

  async setCustomReferralCode(userId: string, code: string) {
    await prisma.userSocialSettings.upsert({
      where: { userId },
      update: { referralCodeCustom: code },
      create: { userId, referralCodeCustom: code },
    });
    return true;
  }
}

export const referralService = new ReferralService();
