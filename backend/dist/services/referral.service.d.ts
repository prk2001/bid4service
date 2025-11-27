export declare class ReferralService {
    private baseUrl;
    constructor();
    getReferralLink(userId: string, referralType?: string): Promise<string>;
    getReferralStats(userId: string): Promise<{
        totalReferrals: number;
    }>;
    getReferralHistory(userId: string, options: any): Promise<any[]>;
    getLeaderboard(limit?: number): Promise<any[]>;
    trackClick(code: string, metadata?: any): Promise<void>;
    processSignup(referralCode: string, newUserId: string): Promise<void>;
    processConversion(referralCode: string): Promise<void>;
    requestPayout(userId: string): Promise<{
        amount: number;
    }>;
    validateReferralCode(code: string): Promise<{
        valid: boolean;
    }>;
    getCustomReferralCode(userId: string): Promise<any>;
    setCustomReferralCode(userId: string, code: string): Promise<boolean>;
    createReferral(options: any): Promise<any>;
}
export declare const referralService: ReferralService;
