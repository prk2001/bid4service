"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - ACTIVITY FEED CONTROLLER
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityFeedController = exports.ActivityFeedController = void 0;
const activity_feed_service_1 = require("../services/activity-feed.service");
class ActivityFeedController {
    // GET /api/v1/feed
    // Get user's personal feed
    async getUserFeed(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { limit, offset, types } = req.query;
            const feed = await activity_feed_service_1.activityFeedService.getUserFeed(userId, {
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
                types: types ? types.split(',') : undefined,
            });
            res.json({
                success: true,
                data: feed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/feed/public
    // Get public community feed
    async getPublicFeed(req, res, next) {
        try {
            const { limit, offset, types } = req.query;
            const feed = await activity_feed_service_1.activityFeedService.getPublicFeed({
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
                types: types ? types.split(',') : undefined,
            });
            res.json({
                success: true,
                data: feed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/feed/network
    // Get network feed (people user has worked with)
    async getNetworkFeed(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const { limit, offset } = req.query;
            const feed = await activity_feed_service_1.activityFeedService.getNetworkFeed(userId, {
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
            });
            res.json({
                success: true,
                data: feed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/feed/entity/:entityType/:entityId
    // Get feed for specific entity
    async getEntityFeed(req, res, next) {
        try {
            const { entityType, entityId } = req.params;
            const { limit, offset, publicOnly } = req.query;
            const feed = await activity_feed_service_1.activityFeedService.getEntityFeed(entityType, entityId, {
                limit: limit ? parseInt(limit, 10) : undefined,
                offset: offset ? parseInt(offset, 10) : undefined,
                publicOnly: publicOnly === 'true',
            });
            res.json({
                success: true,
                data: feed,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/feed/stats
    // Get activity stats for user
    async getStats(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const stats = await activity_feed_service_1.activityFeedService.getActivityStats(userId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // POST /api/v1/feed
    // Create activity (for internal/admin use)
    async createActivity(req, res, next) {
        try {
            const { userId, activityType, entityType, entityId, title, description, metadata, isPublic } = req.body;
            if (!userId || !activityType || !entityType || !entityId || !title) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields',
                });
            }
            const activity = await activity_feed_service_1.activityFeedService.createActivity({
                userId,
                activityType,
                entityType,
                entityId,
                title,
                description,
                metadata,
                isPublic,
            });
            res.json({
                success: true,
                data: activity,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ActivityFeedController = ActivityFeedController;
exports.activityFeedController = new ActivityFeedController();
