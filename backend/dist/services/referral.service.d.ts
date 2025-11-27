import { SocialPlatform } from '@prisma/client';
import { ReferralRewardTier } from '../config/social.config';
interface CreateReferralOptions {
    referrerId: string;
    referralType: string;
    source?: SocialPlatform;
    expiresInDays?: number;
}
export declare class ReferralService {
    private baseUrl;
    constructor();
    createReferral(options: CreateReferralOptions): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        clickCount: number;
        referrerId: string;
        referredUserId: string | null;
        referralCode: string;
        referralType: import(".prisma/client").$Enums.ReferralType;
        source: import(".prisma/client").$Enums.SocialPlatform | null;
        signupAt: Date | null;
        conversionAt: Date | null;
        rewardAmount: import("@prisma/client/runtime/library").Decimal | null;
        rewardStatus: import(".prisma/client").$Enums.RewardStatus;
        rewardPaidAt: Date | null;
    }>;
    getReferralLink(userId: string, referralType?: string): Promise<string>;
    getReferralStats(userId: string): Promise<{
        totalReferrals: number;
        pendingReferrals: number;
        convertedReferrals: number;
        totalEarnings: number;
        pendingEarnings: number;
        currentTier: ReferralRewardTier;
        nextTier: ReferralRewardTier;
        referralsToNextTier: number;
        conversionRate: number;
    }>;
    getReferralHistory(userId: string, options: {
        limit?: number;
        offset?: number;
    }): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ReferralStatus;
        createdAt: Date;
        updatedAt: Date;
        expiresAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        clickCount: number;
        referrerId: string;
        referredUserId: string | null;
        referralCode: string;
        referralType: import(".prisma/client").$Enums.ReferralType;
        source: import(".prisma/client").$Enums.SocialPlatform | null;
        signupAt: Date | null;
        conversionAt: Date | null;
        rewardAmount: import("@prisma/client/runtime/library").Decimal | null;
        rewardStatus: import(".prisma/client").$Enums.RewardStatus;
        rewardPaidAt: Date | null;
    }[]>;
    getLeaderboard(limit?: number): Promise<any[]>;
    trackClick(code: string, metadata?: any): Promise<void>;
    processSignup(referralCode: string, newUserId: string): Promise<void>;
    processConversion(referralCode: string): Promise<void>;
    requestPayout(userId: string): Promise<{
        amount: number;
        referralIds: any[];
    }>;
    validateReferralCode(code: string): Promise<{
        valid: boolean;
        referrer?: undefined;
    } | {
        valid: boolean;
        referrer: {
            firstName: string;
            lastName: string;
        };
    }>;
    getCustomReferralCode(userId: string): Promise<string>;
    setCustomReferralCode(userId: string, code: string): Promise<boolean>;
}
export declare const referralService: ReferralService;
export {};
