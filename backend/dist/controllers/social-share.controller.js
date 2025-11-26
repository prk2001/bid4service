"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - SOCIAL SHARING CONTROLLER
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialShareController = exports.SocialShareController = void 0;
const social_share_service_1 = require("../services/social-share.service");
class SocialShareController {
    // POST /api/v1/social/share
    // Generate share URL for single platform
    async generateShareUrl(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { platform, contentType, contentId, customContent } = req.body;
            if (!platform || !contentType || !contentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: platform, contentType, contentId',
                });
            }
            const result = await social_share_service_1.socialShareService.generateShareUrl(userId, platform, contentType, contentId, customContent);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/social/share/all
    // Generate share URLs for all platforms
    async generateAllShareUrls(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { contentType, contentId, customContent } = req.body;
            if (!contentType || !contentId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: contentType, contentId',
                });
            }
            const results = await social_share_service_1.socialShareService.generateAllShareUrls(userId, contentType, contentId, customContent);
            res.json({
                success: true,
                data: results,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/social/track/:trackingId
    // Track share click and redirect
    async trackClick(req, res, next) {
        try {
            const { trackingId } = req.params;
            const referrer = req.headers.referer;
            const originalUrl = await social_share_service_1.socialShareService.trackClick(trackingId, referrer);
            if (!originalUrl) {
                return res.status(404).json({
                    success: false,
                    message: 'Invalid tracking link',
                });
            }
            res.redirect(originalUrl);
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/social/track/:trackingId/conversion
    // Track conversion from share
    async trackConversion(req, res, next) {
        try {
            const { trackingId } = req.params;
            await social_share_service_1.socialShareService.trackConversion(trackingId);
            res.json({
                success: true,
                message: 'Conversion tracked',
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/social/analytics
    // Get user's share analytics
    async getAnalytics(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const analytics = await social_share_service_1.socialShareService.getUserShareAnalytics(userId);
            res.json({
                success: true,
                data: analytics,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/social/history
    // Get user's share history
    async getHistory(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { limit, offset, platform } = req.query;
            const history = await social_share_service_1.socialShareService.getUserShareHistory(userId, {
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
                platform: platform,
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
    // GET /api/v1/social/og/:contentType/:contentId
    // Get Open Graph meta tags for content
    async getOpenGraphTags(req, res, next) {
        try {
            const { contentType, contentId } = req.params;
            const tags = await social_share_service_1.socialShareService.getOpenGraphTags(contentType, contentId);
            res.json({
                success: true,
                data: tags,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SocialShareController = SocialShareController;
exports.socialShareController = new SocialShareController();
