// @ts-nocheck
// ============================================
// BID4SERVICE - ACTIVITY FEED CONTROLLER
// ============================================

import { Request, Response, NextFunction } from 'express';
import { activityFeedService } from '../services/activity-feed.service';
import { ActivityType } from '@prisma/client';

export class ActivityFeedController {
  // GET /api/v1/feed
  // Get user's personal feed
  async getUserFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { limit, offset, types } = req.query;

      const feed = await activityFeedService.getUserFeed(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        types: types ? (types as string).split(',') as ActivityType[] : undefined,
      });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/feed/public
  // Get public community feed
  async getPublicFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, offset, types } = req.query;

      const feed = await activityFeedService.getPublicFeed({
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        types: types ? (types as string).split(',') as ActivityType[] : undefined,
      });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/feed/network
  // Get network feed (people user has worked with)
  async getNetworkFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { limit, offset } = req.query;

      const feed = await activityFeedService.getNetworkFeed(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/feed/entity/:entityType/:entityId
  // Get feed for specific entity
  async getEntityFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const { limit, offset, publicOnly } = req.query;

      const feed = await activityFeedService.getEntityFeed(entityType, entityId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        publicOnly: publicOnly === 'true',
      });

      res.json({
        success: true,
        data: feed,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/feed/stats
  // Get activity stats for user
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const stats = await activityFeedService.getActivityStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/feed
  // Create activity (for internal/admin use)
  async createActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, activityType, entityType, entityId, title, description, metadata, isPublic } = req.body;

      if (!userId || !activityType || !entityType || !entityId || !title) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      const activity = await activityFeedService.createActivity({
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
    } catch (error) {
      next(error);
    }
  }
}

export const activityFeedController = new ActivityFeedController();
