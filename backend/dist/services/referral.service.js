"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - REFERRAL SERVICE
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
const client_1 = require("@prisma/client");
const social_config_1 = require("../config/social.config");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class ReferralService {
    constructor() {
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    // Create new referral link
    async createReferral(options) {
        const { referrerId, referralType, source, expiresInDays = 30 } = options;
        // Check if user already has an active referral of this type
        let existingReferral = await prisma.referral.findFirst({
            where: {
                referrerId,
                referralType,
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
        // Generate unique referral code
        const referralCode = await this.generateUniqueCode(referrerId);
        // Calculate expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        // Create referral
        const referral = await prisma.referral.create({
            data: {
                referrerId,
                referralCode,
                referralType,
                source,
                expiresAt,
            },
        });
        return referral;
    }
    // Get or create referral link for user
    async getReferralLink(userId, referralType = 'HOMEOWNER') {
        let referral = await prisma.referral.findFirst({
            where: {
                referrerId: userId,
                referralType,
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
    // Get custom referral code if set
    async getCustomReferralCode(userId) {
        const settings = await prisma.userSocialSettings.findUnique({
            where: { userId },
        });
        return settings?.referralCodeCustom || null;
    }
    // Set custom referral code
    async setCustomReferralCode(userId, code) {
        // Validate code
        if (!/^[a-zA-Z0-9_-]{4,20}$/.test(code)) {
            throw new Error('Invalid referral code format. Use 4-20 alphanumeric characters, dashes, or underscores.');
        }
        // Check if code is taken
        const existing = await prisma.userSocialSettings.findFirst({
            where: {
                referralCodeCustom: code,
                NOT: { userId },
            },
        });
        if (existing) {
            throw new Error('This referral code is already taken');
        }
        // Check reserved words
        const reserved = ['admin', 'bid4service', 'support', 'help', 'api', 'www', 'app'];
        if (reserved.includes(code.toLowerCase())) {
            throw new Error('This referral code is reserved');
        }
        await prisma.userSocialSettings.upsert({
            where: { userId },
            update: { referralCodeCustom: code },
            create: {
                userId,
                referralCodeCustom: code,
            },
        });
        return true;
    }
    // Track referral click
    async trackClick(referralCode, metadata) {
        await prisma.referral.updateMany({
            where: {
                referralCode,
                status: 'PENDING',
            },
            data: {
                status: 'CLICKED',
                clickCount: { increment: 1 },
                metadata: metadata,
            },
        });
    }
    // Process referral signup
    async processSignup(referralCode, newUserId) {
        const referral = await prisma.referral.findUnique({
            where: { referralCode },
            include: { referrer: true },
        });
        if (!referral) {
            throw new Error('Invalid referral code');
        }
        if (referral.status === 'CONVERTED' || referral.status === 'EXPIRED') {
            throw new Error('Referral code is no longer valid');
        }
        if (referral.expiresAt && referral.expiresAt < new Date()) {
            await prisma.referral.update({
                where: { id: referral.id },
                data: { status: 'EXPIRED' },
            });
            throw new Error('Referral code has expired');
        }
        // Check if new user isn't the referrer
        if (referral.referrerId === newUserId) {
            throw new Error('Cannot use your own referral code');
        }
        // Update referral status
        await prisma.referral.update({
            where: { id: referral.id },
            data: {
                referredUserId: newUserId,
                status: 'SIGNED_UP',
                signupAt: new Date(),
            },
        });
        // Create activity feed entry
        await prisma.activityFeed.create({
            data: {
                userId: referral.referrerId,
                activityType: 'REFERRAL_SIGNUP',
                entityType: 'referral',
                entityId: referral.id,
                title: 'New Referral Signup',
                description: 'Someone signed up using your referral link!',
                metadata: {
                    referralType: referral.referralType,
                },
            },
        });
    }
    // Process referral conversion (user completes qualifying action)
    async processConversion(referralCode) {
        const referral = await prisma.referral.findUnique({
            where: { referralCode },
        });
        if (!referral || referral.status !== 'SIGNED_UP') {
            return;
        }
        // Calculate reward
        const stats = await this.getReferralStats(referral.referrerId);
        const rewardAmount = stats.currentTier.rewardPerReferral;
        // Update referral
        await prisma.referral.update({
            where: { id: referral.id },
            data: {
                status: 'CONVERTED',
                conversionAt: new Date(),
                rewardAmount,
                rewardStatus: 'EARNED',
            },
        });
        // Check for tier bonus
        const convertedCount = stats.convertedReferrals + 1;
        const newTier = this.getTierForReferrals(convertedCount);
        if (newTier.minReferrals === convertedCount && newTier.bonusReward > 0) {
            // Award tier bonus
            await this.awardTierBonus(referral.referrerId, newTier);
        }
    }
    // Get referral statistics for user
    async getReferralStats(userId) {
        const referrals = await prisma.referral.findMany({
            where: { referrerId: userId },
        });
        const totalReferrals = referrals.length;
        const pendingReferrals = referrals.filter(r => ['PENDING', 'CLICKED', 'SIGNED_UP'].includes(r.status)).length;
        const convertedReferrals = referrals.filter(r => r.status === 'CONVERTED').length;
        const totalEarnings = referrals
            .filter(r => r.rewardStatus === 'PAID')
            .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);
        const pendingEarnings = referrals
            .filter(r => r.rewardStatus === 'EARNED')
            .reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);
        const currentTier = this.getTierForReferrals(convertedReferrals);
        const nextTier = this.getNextTier(convertedReferrals);
        const referralsToNextTier = nextTier
            ? nextTier.minReferrals - convertedReferrals
            : 0;
        const clickedReferrals = referrals.filter(r => ['CLICKED', 'SIGNED_UP', 'CONVERTED'].includes(r.status)).length;
        const conversionRate = clickedReferrals > 0
            ? (convertedReferrals / clickedReferrals) * 100
            : 0;
        return {
            totalReferrals,
            pendingReferrals,
            convertedReferrals,
            totalEarnings,
            pendingEarnings,
            currentTier,
            nextTier,
            referralsToNextTier,
            conversionRate,
        };
    }
    // Get referral history
    async getReferralHistory(userId, options) {
        const { limit = 50, offset = 0 } = options;
        return prisma.referral.findMany({
            where: { referrerId: userId },
            include: {
                referredUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    // Get leaderboard
    async getLeaderboard(limit = 10) {
        const topReferrers = await prisma.referral.groupBy({
            by: ['referrerId'],
            where: { status: 'CONVERTED' },
            _count: { id: true },
            _sum: { rewardAmount: true },
            orderBy: { _count: { id: 'desc' } },
            take: limit,
        });
        const userIds = topReferrers.map(r => r.referrerId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
            },
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        return topReferrers.map(r => {
            const user = userMap.get(r.referrerId);
            const tier = this.getTierForReferrals(r._count.id);
            return {
                userId: r.referrerId,
                userName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Anonymous',
                avatarUrl: user?.profileImage || undefined,
                totalReferrals: r._count.id,
                totalEarnings: Number(r._sum.rewardAmount || 0),
                tier: tier.tierName,
            };
        });
    }
    // Request payout
    async requestPayout(userId) {
        const earnedReferrals = await prisma.referral.findMany({
            where: {
                referrerId: userId,
                rewardStatus: 'EARNED',
            },
        });
        if (earnedReferrals.length === 0) {
            throw new Error('No rewards available for payout');
        }
        const totalAmount = earnedReferrals.reduce((sum, r) => sum + Number(r.rewardAmount || 0), 0);
        const referralIds = earnedReferrals.map(r => r.id);
        // Mark as pending payout (actual payment processing would happen elsewhere)
        await prisma.referral.updateMany({
            where: { id: { in: referralIds } },
            data: {
                rewardStatus: 'PAID',
                rewardPaidAt: new Date(),
            },
        });
        return { amount: totalAmount, referralIds };
    }
    // Validate referral code
    async validateReferralCode(code) {
        // Check custom codes first
        const customCode = await prisma.userSocialSettings.findFirst({
            where: { referralCodeCustom: code },
            include: {
                user: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        if (customCode) {
            return {
                valid: true,
                referrer: {
                    firstName: customCode.user.firstName,
                    lastName: customCode.user.lastName,
                },
            };
        }
        // Check regular codes
        const referral = await prisma.referral.findUnique({
            where: { referralCode: code },
            include: {
                referrer: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        if (!referral) {
            return { valid: false };
        }
        if (referral.status === 'EXPIRED' || (referral.expiresAt && referral.expiresAt < new Date())) {
            return { valid: false };
        }
        return {
            valid: true,
            referrer: {
                firstName: referral.referrer.firstName,
                lastName: referral.referrer.lastName,
            },
        };
    }
    // Helper methods
    async generateUniqueCode(userId) {
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = crypto_1.default.randomBytes(6).toString('base64url');
            const existing = await prisma.referral.findUnique({
                where: { referralCode: code },
            });
            isUnique = !existing;
        }
        return code;
    }
    getTierForReferrals(count) {
        let tier = social_config_1.referralRewardTiers[0];
        for (const t of social_config_1.referralRewardTiers) {
            if (count >= t.minReferrals) {
                tier = t;
            }
            else {
                break;
            }
        }
        return tier;
    }
    getNextTier(currentCount) {
        for (const tier of social_config_1.referralRewardTiers) {
            if (tier.minReferrals > currentCount) {
                return tier;
            }
        }
        return null;
    }
    async awardTierBonus(userId, tier) {
        // Create bonus record or credit to account
        await prisma.activityFeed.create({
            data: {
                userId,
                activityType: 'LEVEL_UP',
                entityType: 'referral_tier',
                entityId: tier.tierName,
                title: `🎉 ${tier.tierName} Tier Achieved!`,
                description: `Congratulations! You've reached ${tier.tierName} tier and earned a $${tier.bonusReward} bonus!`,
                metadata: {
                    tierName: tier.tierName,
                    bonusAmount: tier.bonusReward,
                },
            },
        });
        // In production, this would credit the user's account
        console.log(`Tier bonus of $${tier.bonusReward} awarded to user ${userId}`);
    }
}
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
