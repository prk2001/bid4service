import { ReferralType, SocialPlatform } from '@prisma/client';
import { ReferralRewardTier } from '../config/social.config';
interface ReferralStats {
    totalReferrals: number;
    pendingReferrals: number;
    convertedReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    currentTier: ReferralRewardTier;
    nextTier: ReferralRewardTier | null;
    referralsToNextTier: number;
    conversionRate: number;
}
interface ReferralLeaderboard {
    userId: string;
    userName: string;
    avatarUrl?: string;
    totalReferrals: number;
    totalEarnings: number;
    tier: string;
}
interface CreateReferralOptions {
    referrerId: string;
    referralType: ReferralType;
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
    getReferralLink(userId: string, referralType?: ReferralType): Promise<string>;
    getCustomReferralCode(userId: string): Promise<string | null>;
    setCustomReferralCode(userId: string, code: string): Promise<boolean>;
    trackClick(referralCode: string, metadata?: Record<string, unknown>): Promise<void>;
    processSignup(referralCode: string, newUserId: string): Promise<void>;
    processConversion(referralCode: string): Promise<void>;
    getReferralStats(userId: string): Promise<ReferralStats>;
    getReferralHistory(userId: string, options: {
        limit?: number;
        offset?: number;
    }): Promise<({
        referredUser: {
            id: string;
            firstName: string;
            lastName: string;
            profileImage: string;
            createdAt: Date;
        };
    } & {
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
    })[]>;
    getLeaderboard(limit?: number): Promise<ReferralLeaderboard[]>;
    requestPayout(userId: string): Promise<{
        amount: number;
        referralIds: string[];
    }>;
    validateReferralCode(code: string): Promise<{
        valid: boolean;
        referrer?: {
            firstName: string;
            lastName: string;
        };
    }>;
    private generateUniqueCode;
    private getTierForReferrals;
    private getNextTier;
    private awardTierBonus;
}
export declare const referralService: ReferralService;
export {};
