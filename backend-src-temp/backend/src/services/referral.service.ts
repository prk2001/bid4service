// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class ReferralService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async getReferralLink(userId: string, referralType: string = 'HOMEOWNER'): Promise<string> {
    console.log('=== getReferralLink START ===');
    console.log('userId:', userId);
    console.log('referralType:', referralType);
    
    try {
      let referral = await prisma.referral.findFirst({
        where: {
          referrerId: userId,
          referralType: referralType as any,
          status: { in: ['PENDING', 'CLICKED'] },
        },
      });
      console.log('Found referral:', referral);

      if (!referral) {
        const referralCode = crypto.randomBytes(6).toString('base64url');
        console.log('Creating new referral with code:', referralCode);
        
        referral = await prisma.referral.create({
          data: {
            referrerId: userId,
            referralCode,
            referralType: referralType as any,
          },
        });
        console.log('Created referral:', referral);
      }

      const link = `${this.baseUrl}/join/${referral.referralCode}`;
      console.log('=== getReferralLink SUCCESS ===', link);
      return link;
    } catch (error) {
      console.error('=== getReferralLink ERROR ===');
      console.error(error);
      throw error;
    }
  }

  async getReferralStats(userId: string) { return { totalReferrals: 0 }; }
  async getReferralHistory(userId: string, options: any) { return []; }
  async getLeaderboard(limit?: number) { return []; }
  async trackClick(code: string, metadata?: any) { }
  async processSignup(referralCode: string, newUserId: string) { }
  async processConversion(referralCode: string) { }
  async requestPayout(userId: string) { return { amount: 0 }; }
  async validateReferralCode(code: string) { return { valid: false }; }
  async getCustomReferralCode(userId: string) { return null; }
  async setCustomReferralCode(userId: string, code: string) { return true; }
  async createReferral(options: any) { return null; }
}

export const referralService = new ReferralService();
