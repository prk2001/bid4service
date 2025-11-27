"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralController = exports.ReferralController = void 0;
// @ts-nocheck
async;
getReferralLink(req, Request, res, Response, next, express_1.NextFunction);
{
    console.log('=== getReferralLink called ===');
    try {
        const userId = req.user?.id;
        console.log('userId:', userId);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }
        const { type } = req.query;
        const referralType = type || 'HOMEOWNER';
        console.log('referralType:', referralType);
        const link = await referral_service_1.referralService.getReferralLink(userId, referralType);
        console.log('link:', link);
        res.json({
            success: true,
            data: { link },
        });
    }
    catch (error) {
        console.error('=== getReferralLink ERROR ===', error);
        next(error);
    }
}
const referral_service_1 = require("../services/referral.service");
class ReferralController {
    // GET /api/v1/referrals/link
    // Get user's referral link
    async getReferralLink(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { type } = req.query;
            const referralType = type || 'HOMEOWNER';
            const link = await referral_service_1.referralService.getReferralLink(userId, referralType);
            res.json({
                success: true,
                data: { link },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/referrals/create
    // Create new referral
    async createReferral(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { referralType, source, expiresInDays } = req.body;
            const referral = await referral_service_1.referralService.createReferral({
                referrerId: userId,
                referralType: referralType || 'HOMEOWNER',
                source: source,
                expiresInDays,
            });
            res.json({
                success: true,
                data: referral,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/referrals/stats
    // Get user's referral statistics
    async getStats(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const stats = await referral_service_1.referralService.getReferralStats(userId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/referrals/history
    // Get user's referral history
    async getHistory(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { limit, offset } = req.query;
            const history = await referral_service_1.referralService.getReferralHistory(userId, {
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
            });
            res.json({
                success: true,
                data: history,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/referrals/leaderboard
    // Get referral leaderboard
    async getLeaderboard(req, res, next) {
        try {
            const { limit } = req.query;
            const leaderboard = await referral_service_1.referralService.getLeaderboard(limit ? parseInt(limit, 10) : undefined);
            res.json({
                success: true,
                data: leaderboard,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/referrals/track/:code
    // Track referral click
    async trackClick(req, res, next) {
        try {
            const { code } = req.params;
            const { metadata } = req.body;
            await referral_service_1.referralService.trackClick(code, {
                ...metadata,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: new Date().toISOString(),
            });
            res.json({
                success: true,
                message: 'Click tracked',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/referrals/signup
    // Process referral signup
    async processSignup(req, res, next) {
        try {
            const { referralCode, newUserId } = req.body;
            if (!referralCode || !newUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: referralCode, newUserId',
                });
            }
            await referral_service_1.referralService.processSignup(referralCode, newUserId);
            res.json({
                success: true,
                message: 'Referral signup processed',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/referrals/convert/:code
    // Process referral conversion
    async processConversion(req, res, next) {
        try {
            const { code } = req.params;
            await referral_service_1.referralService.processConversion(code);
            res.json({
                success: true,
                message: 'Conversion processed',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/referrals/payout
    // Request payout for earned rewards
    async requestPayout(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const result = await referral_service_1.referralService.requestPayout(userId);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/referrals/validate/:code
    // Validate referral code
    async validateCode(req, res, next) {
        try {
            const { code } = req.params;
            const result = await referral_service_1.referralService.validateReferralCode(code);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/referrals/custom-code
    // Get user's custom referral code
    async getCustomCode(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const code = await referral_service_1.referralService.getCustomReferralCode(userId);
            res.json({
                success: true,
                data: { code },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // PUT /api/v1/referrals/custom-code
    // Set user's custom referral code
    async setCustomCode(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({
                    success: false,
                    message: 'Code is required',
                });
            }
            await referral_service_1.referralService.setCustomReferralCode(userId, code);
            res.json({
                success: true,
                message: 'Custom referral code set successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReferralController = ReferralController;
exports.referralController = new ReferralController();
