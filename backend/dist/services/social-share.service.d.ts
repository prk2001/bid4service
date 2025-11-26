import { SocialPlatform, ShareContentType } from '@prisma/client';
interface ShareContent {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    hashtags?: string[];
}
interface ShareUrlResult {
    platform: SocialPlatform;
    shareUrl: string;
    trackingId: string;
}
interface ShareAnalytics {
    totalShares: number;
    byPlatform: Record<string, number>;
    totalClicks: number;
    totalConversions: number;
    topContent: Array<{
        contentType: ShareContentType;
        contentId: string;
        shares: number;
        clicks: number;
    }>;
}
export declare class SocialShareService {
    private baseUrl;
    constructor();
    generateShareUrl(userId: string, platform: SocialPlatform, contentType: ShareContentType, contentId: string, customContent?: Partial<ShareContent>): Promise<ShareUrlResult>;
    generateAllShareUrls(userId: string, contentType: ShareContentType, contentId: string, customContent?: Partial<ShareContent>): Promise<ShareUrlResult[]>;
    private buildShareUrl;
    private getContentDetails;
    trackClick(trackingId: string, referrer?: string): Promise<string | null>;
    trackConversion(trackingId: string): Promise<void>;
    getUserShareAnalytics(userId: string): Promise<ShareAnalytics>;
    getUserShareHistory(userId: string, options: {
        limit?: number;
        offset?: number;
        platform?: SocialPlatform;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        platform: import(".prisma/client").$Enums.SocialPlatform;
        contentType: import(".prisma/client").$Enums.ShareContentType;
        contentId: string;
        shareUrl: string | null;
        clickCount: number;
        conversionCount: number;
    }[]>;
    getOpenGraphTags(contentType: ShareContentType, contentId: string): Promise<Record<string, string>>;
    private generateTrackingId;
    private truncateText;
}
export declare const socialShareService: SocialShareService;
export {};
