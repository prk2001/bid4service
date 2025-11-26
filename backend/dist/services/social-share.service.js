"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - SOCIAL SHARING SERVICE
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialShareService = exports.SocialShareService = void 0;
const client_1 = require("@prisma/client");
const social_config_1 = require("../config/social.config");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
class SocialShareService {
    constructor() {
        this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    // Generate shareable URL with tracking
    async generateShareUrl(userId, platform, contentType, contentId, customContent) {
        // Get content details
        const content = await this.getContentDetails(contentType, contentId, customContent);
        // Generate tracking ID
        const trackingId = this.generateTrackingId();
        // Create tracked URL
        const trackedUrl = `${this.baseUrl}/s/${trackingId}`;
        // Generate platform-specific share URL
        const shareUrl = this.buildShareUrl(platform, {
            ...content,
            url: trackedUrl,
        });
        // Record share
        await prisma.socialShare.create({
            data: {
                userId,
                platform,
                contentType,
                contentId,
                shareUrl: trackedUrl,
                metadata: {
                    trackingId,
                    originalUrl: content.url,
                    platform,
                },
            },
        });
        return {
            platform,
            shareUrl,
            trackingId,
        };
    }
    // Generate share URLs for all platforms at once
    async generateAllShareUrls(userId, contentType, contentId, customContent) {
        const platforms = [
            'FACEBOOK',
            'TWITTER',
            'LINKEDIN',
            'PINTEREST',
            'WHATSAPP',
            'EMAIL',
            'SMS',
            'COPY_LINK',
        ];
        const results = await Promise.all(platforms.map(platform => this.generateShareUrl(userId, platform, contentType, contentId, customContent)));
        return results;
    }
    // Build platform-specific share URL
    buildShareUrl(platform, content) {
        const config = social_config_1.shareConfigs[platform.toLowerCase()];
        if (!config) {
            return content.url;
        }
        const params = new URLSearchParams();
        switch (platform) {
            case 'FACEBOOK':
                params.set('u', content.url);
                if (content.description)
                    params.set('quote', content.description);
                break;
            case 'TWITTER':
                params.set('url', content.url);
                const tweetText = this.truncateText(`${content.title}\n\n${content.description}`, 280 - content.url.length - 5);
                params.set('text', tweetText);
                if (content.hashtags?.length) {
                    params.set('hashtags', content.hashtags.join(','));
                }
                break;
            case 'LINKEDIN':
                params.set('url', content.url);
                break;
            case 'PINTEREST':
                params.set('url', content.url);
                params.set('description', content.description || content.title);
                if (content.imageUrl)
                    params.set('media', content.imageUrl);
                break;
            case 'WHATSAPP':
                const waText = `${content.title}\n\n${content.description}\n\n${content.url}`;
                params.set('text', waText);
                break;
            case 'EMAIL':
                const emailSubject = encodeURIComponent(content.title);
                const emailBody = encodeURIComponent(`${content.description}\n\nCheck it out: ${content.url}`);
                return `mailto:?subject=${emailSubject}&body=${emailBody}`;
            case 'SMS':
                const smsBody = encodeURIComponent(`${content.title}\n${content.url}`);
                return `sms:?body=${smsBody}`;
            case 'COPY_LINK':
                return content.url;
            case 'NEXTDOOR':
                params.set('url', content.url);
                params.set('title', content.title);
                break;
            default:
                return content.url;
        }
        return `${config.baseUrl}?${params.toString()}`;
    }
    // Get content details for sharing
    async getContentDetails(contentType, contentId, customContent) {
        let content = {
            title: '',
            description: '',
            url: `${this.baseUrl}`,
            hashtags: ['Bid4Service', 'HomeServices'],
        };
        switch (contentType) {
            case 'JOB':
                const job = await prisma.job.findUnique({
                    where: { id: contentId },
                    include: { customer: true },
                });
                if (job) {
                    content = {
                        title: `${job.title} - Service Request`,
                        description: job.description?.slice(0, 200) || 'Check out this service request!',
                        url: `${this.baseUrl}/jobs/${contentId}`,
                        hashtags: ['Bid4Service', 'HomeServices', job.category?.replace(/\s+/g, '') || 'Services'],
                    };
                }
                break;
            case 'PROJECT':
                const project = await prisma.project.findUnique({
                    where: { id: contentId },
                    include: { job: true },
                });
                if (project) {
                    content = {
                        title: `Completed Project: ${project.job?.title}`,
                        description: `Check out this completed project on Bid4Service!`,
                        url: `${this.baseUrl}/projects/${contentId}`,
                        hashtags: ['Bid4Service', 'ProjectComplete', 'HomeImprovement'],
                    };
                }
                break;
            case 'PROFILE':
                const profile = await prisma.providerProfile.findUnique({
                    where: { id: contentId },
                    include: { user: true },
                });
                if (profile) {
                    content = {
                        title: `${profile.businessName || profile.user.firstName} - Service Provider`,
                        description: profile.bio?.slice(0, 200) || 'Professional service provider on Bid4Service',
                        url: `${this.baseUrl}/providers/${contentId}`,
                        imageUrl: profile.user.profileImage || undefined,
                        hashtags: ['Bid4Service', 'ServiceProvider', 'Contractor'],
                    };
                }
                break;
            case 'REVIEW':
                const review = await prisma.review.findUnique({
                    where: { id: contentId },
                    include: { author: true },
                });
                if (review) {
                    content = {
                        title: `${review.overallRating}⭐ Review on Bid4Service`,
                        description: review.comment?.slice(0, 200) || 'Great service!',
                        url: `${this.baseUrl}/reviews/${contentId}`,
                        hashtags: ['Bid4Service', 'Review', 'Testimonial'],
                    };
                }
                break;
            case 'REFERRAL_LINK':
                content = {
                    title: 'Join Bid4Service!',
                    description: 'Get the best prices on home services. Join today!',
                    url: `${this.baseUrl}/join/${contentId}`,
                    hashtags: ['Bid4Service', 'HomeServices', 'SaveMoney'],
                };
                break;
            case 'BUSINESS_PAGE':
                const business = await prisma.providerProfile.findUnique({
                    where: { id: contentId },
                    include: { user: true },
                });
                if (business) {
                    content = {
                        title: business.businessName || 'Business on Bid4Service',
                        description: business.bio || 'Quality service provider',
                        url: `${this.baseUrl}/business/${contentId}`,
                        hashtags: ['Bid4Service', 'LocalBusiness', 'HomeServices'],
                    };
                }
                break;
        }
        // Override with custom content if provided
        return {
            ...content,
            ...customContent,
        };
    }
    // Track share click
    async trackClick(trackingId, referrer) {
        const share = await prisma.socialShare.findFirst({
            where: {
                metadata: {
                    path: ['trackingId'],
                    equals: trackingId,
                },
            },
        });
        if (!share)
            return null;
        await prisma.socialShare.update({
            where: { id: share.id },
            data: {
                clickCount: { increment: 1 },
                metadata: {
                    ...share.metadata,
                    lastClickAt: new Date().toISOString(),
                    referrer,
                },
            },
        });
        const metadata = share.metadata;
        return metadata.originalUrl || null;
    }
    // Track conversion (signup, job created, etc.)
    async trackConversion(trackingId) {
        await prisma.socialShare.updateMany({
            where: {
                metadata: {
                    path: ['trackingId'],
                    equals: trackingId,
                },
            },
            data: {
                conversionCount: { increment: 1 },
            },
        });
    }
    // Get share analytics for user
    async getUserShareAnalytics(userId) {
        const shares = await prisma.socialShare.findMany({
            where: { userId },
        });
        const byPlatform = {};
        let totalClicks = 0;
        let totalConversions = 0;
        shares.forEach(share => {
            byPlatform[share.platform] = (byPlatform[share.platform] || 0) + 1;
            totalClicks += share.clickCount;
            totalConversions += share.conversionCount;
        });
        // Get top content
        const contentGroups = shares.reduce((acc, share) => {
            const key = `${share.contentType}-${share.contentId}`;
            if (!acc[key]) {
                acc[key] = {
                    contentType: share.contentType,
                    contentId: share.contentId,
                    shares: 0,
                    clicks: 0,
                };
            }
            acc[key].shares += 1;
            acc[key].clicks += share.clickCount;
            return acc;
        }, {});
        const topContent = Object.values(contentGroups)
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 10);
        return {
            totalShares: shares.length,
            byPlatform,
            totalClicks,
            totalConversions,
            topContent,
        };
    }
    // Get share history
    async getUserShareHistory(userId, options) {
        const { limit = 50, offset = 0, platform } = options;
        return prisma.socialShare.findMany({
            where: {
                userId,
                ...(platform && { platform }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    // Generate Open Graph meta tags for content
    async getOpenGraphTags(contentType, contentId) {
        const content = await this.getContentDetails(contentType, contentId);
        return {
            'og:title': content.title,
            'og:description': content.description,
            'og:url': content.url,
            'og:image': content.imageUrl || `${this.baseUrl}/og-default.png`,
            'og:type': 'website',
            'og:site_name': 'Bid4Service',
            'twitter:card': content.imageUrl ? 'summary_large_image' : 'summary',
            'twitter:title': content.title,
            'twitter:description': content.description,
            'twitter:image': content.imageUrl || `${this.baseUrl}/og-default.png`,
        };
    }
    // Helper methods
    generateTrackingId() {
        return crypto_1.default.randomBytes(8).toString('base64url');
    }
    truncateText(text, maxLength) {
        if (text.length <= maxLength)
            return text;
        return text.slice(0, maxLength - 3) + '...';
    }
}
exports.SocialShareService = SocialShareService;
exports.socialShareService = new SocialShareService();
