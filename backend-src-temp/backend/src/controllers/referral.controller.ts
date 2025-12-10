// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { referralService } from '../services/referral.service';

export class ReferralController {
  async getReferralLink(req: Request, res: Response, next: NextFunction) {
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
      const referralType = (type as string) || 'HOMEOWNER';
      console.log('referralType:', referralType);

      const link = await referralService.getReferralLink(userId, referralType);
      console.log('Got link:', link);

      res.json({ success: true, data: { link } });
    } catch (error) {
      console.error('=== CONTROLLER ERROR ===');
      console.error(error);
      next(error);
    }
  }

  async createReferral(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async getStats(req: Request, res: Response, next: NextFunction) { res.json({ success: true, data: {} }); }
  async getHistory(req: Request, res: Response, next: NextFunction) { res.json({ success: true, data: [] }); }
  async getLeaderboard(req: Request, res: Response, next: NextFunction) { res.json({ success: true, data: [] }); }
  async trackClick(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async processSignup(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async processConversion(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async requestPayout(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async validateCode(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async getCustomCode(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
  async setCustomCode(req: Request, res: Response, next: NextFunction) { res.json({ success: true }); }
}

export const referralController = new ReferralController();
