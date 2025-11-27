"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
// @ts-nocheck
const client_1 = require("@prisma/client");
const social_config_1 = require("../config/social.config");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class ReferralService {
    constructor() {
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    async createReferral(options) {
        const { referrerId, referralType, source, expiresInDays = 30 } = options;
        const existingReferral = await prisma.referral.findFirst({
            where: {
                referrerId,
                referralType: referralType,
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
        const referralCode = crypto_1.default.randomBytes(6).toString('base64url');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        const referral = await prisma.referral.create({
            data: {
                referrerId,
                referralCode,
                referralType: referralType,
                source,
                expiresAt,
            },
        });
        return referral;
    }
    async getReferralLink(userId, referralType = 'HOMEOWNER') {
        let referral = await prisma.referral.findFirst({
            where: {
                referrerId: userId,
                referralType: referralType,
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
    async getReferralStats(userId) {
        const referrals = await prisma.referral.findMany({
            where: { referrerId: userId },
        });
        const totalReferrals = referrals.length;
        const convertedReferrals = referrals.filter(r => r.status === 'CONVERTED').length;
        const currentTier = social_config_1.referralRewardTiers[0];
        return {
            totalReferrals,
            pendingReferrals: referrals.filter(r => ['PENDING', 'CLICKED', 'SIGNED_UP'].includes(r.status)).length,
            convertedReferrals,
            totalEarnings: 0,
            pendingEarnings: 0,
            currentTier,
            nextTier: social_config_1.referralRewardTiers[1] || null,
            referralsToNextTier: 5 - convertedReferrals,
            conversionRate: 0,
        };
    }
    async getReferralHistory(userId, options) {
        return prisma.referral.findMany({
            where: { referrerId: userId },
            orderBy: { createdAt: 'desc' },
            take: options.limit || 50,
            skip: options.offset || 0,
        });
    }
    async getLeaderboard(limit = 10) {
        return [];
    }
    async trackClick(code, metadata) {
        await prisma.referral.updateMany({
            where: { referralCode: code, status: 'PENDING' },
            data: { status: 'CLICKED', clickCount: { increment: 1 } },
        });
    }
    async processSignup(referralCode, newUserId) {
        await prisma.referral.updateMany({
            where: { referralCode },
            data: { referredUserId: newUserId, status: 'SIGNED_UP', signupAt: new Date() },
        });
    }
    async processConversion(referralCode) {
        await prisma.referral.updateMany({
            where: { referralCode },
            data: { status: 'CONVERTED', conversionAt: new Date() },
        });
    }
    async requestPayout(userId) {
        return { amount: 0, referralIds: [] };
    }
    async validateReferralCode(code) {
        const referral = await prisma.referral.findUnique({
            where: { referralCode: code },
            include: { referrer: { select: { firstName: true, lastName: true } } },
        });
        if (!referral)
            return { valid: false };
        return { valid: true, referrer: referral.referrer };
    }
    async getCustomReferralCode(userId) {
        const settings = await prisma.userSocialSettings.findUnique({ where: { userId } });
        return settings?.referralCodeCustom || null;
    }
    async setCustomReferralCode(userId, code) {
        await prisma.userSocialSettings.upsert({
            where: { userId },
            update: { referralCodeCustom: code },
            create: { userId, referralCodeCustom: code },
        });
        return true;
    }
}
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
