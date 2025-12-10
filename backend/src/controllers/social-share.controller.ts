// @ts-nocheck
// ============================================
// BID4SERVICE - SOCIAL SHARING CONTROLLER
// ============================================

import { Request, Response, NextFunction } from 'express';
import { socialShareService } from '../services/social-share.service';
import { SocialPlatform, ShareContentType } from '@prisma/client';

export class SocialShareController {
  // POST /api/v1/social/share
  // Generate share URL for single platform
  async generateShareUrl(req: Request, res: Response, next: NextFunction) {
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

      const result = await socialShareService.generateShareUrl(
        userId,
        platform as SocialPlatform,
        contentType as ShareContentType,
        contentId,
        customContent
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/social/share/all
  // Generate share URLs for all platforms
  async generateAllShareUrls(req: Request, res: Response, next: NextFunction) {
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

      const results = await socialShareService.generateAllShareUrls(
        userId,
        contentType as ShareContentType,
        contentId,
        customContent
      );

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/social/track/:trackingId
  // Track share click and redirect
  async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackingId } = req.params;
      const referrer = req.headers.referer;

      const originalUrl = await socialShareService.trackClick(
        trackingId,
        referrer
      );

      if (!originalUrl) {
        return res.status(404).json({
          success: false,
          message: 'Invalid tracking link',
        });
      }

      res.redirect(originalUrl);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/social/track/:trackingId/conversion
  // Track conversion from share
  async trackConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackingId } = req.params;

      await socialShareService.trackConversion(trackingId);

      res.json({
        success: true,
        message: 'Conversion tracked',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/social/analytics
  // Get user's share analytics
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const analytics = await socialShareService.getUserShareAnalytics(userId);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/social/history
  // Get user's share history
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { limit, offset, platform } = req.query;

      const history = await socialShareService.getUserShareHistory(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
        platform: platform as SocialPlatform,
      });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/social/og/:contentType/:contentId
  // Get Open Graph meta tags for content
  async getOpenGraphTags(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType, contentId } = req.params;

      const tags = await socialShareService.getOpenGraphTags(
        contentType as ShareContentType,
        contentId
      );

      res.json({
        success: true,
        data: tags,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const socialShareController = new SocialShareController();
