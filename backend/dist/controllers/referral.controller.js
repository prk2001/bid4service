"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralController = exports.ReferralController = void 0;
const referral_service_1 = require("../services/referral.service");
class ReferralController {
    async getReferralLink(req, res, next) {
        console.log('=== CONTROLLER getReferralLink ===');
        console.log('req.user:', req.user);
        try {
            const userId = req.user?.userId;
            console.log('userId:', userId);
            if (!userId) {
                console.log('No userId - returning 401');
                return res.status(401).json({ success: false, message: 'Authentication required' });
            }
            const { type } = req.query;
            const referralType = type || 'HOMEOWNER';
            console.log('referralType:', referralType);
            const link = await referral_service_1.referralService.getReferralLink(userId, referralType);
            console.log('Got link:', link);
            res.json({ success: true, data: { link } });
        }
        catch (error) {
            console.error('=== CONTROLLER ERROR ===');
            console.error(error);
            next(error);
        }
    }
    async createReferral(req, res, next) { res.json({ success: true }); }
    async getStats(req, res, next) { res.json({ success: true, data: {} }); }
    async getHistory(req, res, next) { res.json({ success: true, data: [] }); }
    async getLeaderboard(req, res, next) { res.json({ success: true, data: [] }); }
    async trackClick(req, res, next) { res.json({ success: true }); }
    async processSignup(req, res, next) { res.json({ success: true }); }
    async processConversion(req, res, next) { res.json({ success: true }); }
    async requestPayout(req, res, next) { res.json({ success: true }); }
    async validateCode(req, res, next) { res.json({ success: true }); }
    async getCustomCode(req, res, next) { res.json({ success: true }); }
    async setCustomCode(req, res, next) { res.json({ success: true }); }
}
exports.ReferralController = ReferralController;
exports.referralController = new ReferralController();
