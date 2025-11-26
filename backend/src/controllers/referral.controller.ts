// @ts-nocheck
// ============================================
// BID4SERVICE - REFERRAL CONTROLLER
// ============================================

import { Request, Response, NextFunction } from 'express';
import { referralService } from '../services/referral.service';
import { ReferralType, SocialPlatform } from '@prisma/client';

export class ReferralController {
  // GET /api/v1/referrals/link
  // Get user's referral link
  async getReferralLink(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { type } = req.query;
      const referralType = (type as ReferralType) || 'HOMEOWNER';

      const link = await referralService.getReferralLink(userId, referralType);

      res.json({
        success: true,
        data: { link },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/referrals/create
  // Create new referral
  async createReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { referralType, source, expiresInDays } = req.body;

      const referral = await referralService.createReferral({
        referrerId: userId,
        referralType: referralType || 'HOMEOWNER',
        source: source as SocialPlatform,
        expiresInDays,
      });

      res.json({
        success: true,
        data: referral,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/referrals/stats
  // Get user's referral statistics
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const stats = await referralService.getReferralStats(userId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/referrals/history
  // Get user's referral history
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const { limit, offset } = req.query;

      const history = await referralService.getReferralHistory(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/referrals/leaderboard
  // Get referral leaderboard
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit } = req.query;

      const leaderboard = await referralService.getLeaderboard(
        limit ? parseInt(limit as string, 10) : undefined
      );

      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/referrals/track/:code
  // Track referral click
  async trackClick(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const { metadata } = req.body;

      await referralService.trackClick(code, {
        ...metadata,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Click tracked',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/referrals/signup
  // Process referral signup
  async processSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { referralCode, newUserId } = req.body;

      if (!referralCode || !newUserId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: referralCode, newUserId',
        });
      }

      await referralService.processSignup(referralCode, newUserId);

      res.json({
        success: true,
        message: 'Referral signup processed',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/referrals/convert/:code
  // Process referral conversion
  async processConversion(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      await referralService.processConversion(code);

      res.json({
        success: true,
        message: 'Conversion processed',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/referrals/payout
  // Request payout for earned rewards
  async requestPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const result = await referralService.requestPayout(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/referrals/validate/:code
  // Validate referral code
  async validateCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;

      const result = await referralService.validateReferralCode(code);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/referrals/custom-code
  // Get user's custom referral code
  async getCustomCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const code = await referralService.getCustomReferralCode(userId);

      res.json({
        success: true,
        data: { code },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/referrals/custom-code
  // Set user's custom referral code
  async setCustomCode(req: Request, res: Response, next: NextFunction) {
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

      await referralService.setCustomReferralCode(userId, code);

      res.json({
        success: true,
        message: 'Custom referral code set successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const referralController = new ReferralController();
