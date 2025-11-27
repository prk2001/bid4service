"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralService = exports.ReferralService = void 0;
// @ts-nocheck
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class ReferralService {
    constructor() {
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    async getReferralLink(userId, referralType = 'HOMEOWNER') {
        console.log('=== getReferralLink START ===');
        console.log('userId:', userId);
        console.log('referralType:', referralType);
        try {
            let referral = await prisma.referral.findFirst({
                where: {
                    referrerId: userId,
                    referralType: referralType,
                    status: { in: ['PENDING', 'CLICKED'] },
                },
            });
            console.log('Found referral:', referral);
            if (!referral) {
                const referralCode = crypto_1.default.randomBytes(6).toString('base64url');
                console.log('Creating new referral with code:', referralCode);
                referral = await prisma.referral.create({
                    data: {
                        referrerId: userId,
                        referralCode,
                        referralType: referralType,
                    },
                });
                console.log('Created referral:', referral);
            }
            const link = `${this.baseUrl}/join/${referral.referralCode}`;
            console.log('=== getReferralLink SUCCESS ===', link);
            return link;
        }
        catch (error) {
            console.error('=== getReferralLink ERROR ===');
            console.error(error);
            throw error;
        }
    }
    async getReferralStats(userId) { return { totalReferrals: 0 }; }
    async getReferralHistory(userId, options) { return []; }
    async getLeaderboard(limit) { return []; }
    async trackClick(code, metadata) { }
    async processSignup(referralCode, newUserId) { }
    async processConversion(referralCode) { }
    async requestPayout(userId) { return { amount: 0 }; }
    async validateReferralCode(code) { return { valid: false }; }
    async getCustomReferralCode(userId) { return null; }
    async setCustomReferralCode(userId, code) { return true; }
    async createReferral(options) { return null; }
}
exports.ReferralService = ReferralService;
exports.referralService = new ReferralService();
