"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - ACTIVITY FEED SERVICE
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityFeedService = exports.ActivityFeedService = void 0;
const client_1 = require("@prisma/client");
const social_config_1 = require("../config/social.config");
const prisma = new client_1.PrismaClient();
class ActivityFeedService {
    // Create activity entry
    async createActivity(options) {
        const { userId, activityType, entityType, entityId, title, description, metadata, isPublic = social_config_1.activityConfig.publicFeedTypes.includes(activityType), } = options;
        const activity = await prisma.activityFeed.create({
            data: {
                userId,
                activityType,
                entityType,
                entityId,
                title,
                description,
                metadata: metadata,
                isPublic,
            },
        });
        // Trigger real-time notification if needed
        if (social_config_1.activityConfig.notificationTypes.includes(activityType)) {
            await this.sendNotification(userId, activity);
        }
        return activity;
    }
    // Bulk create activities (for batch processing)
    async createActivities(activities) {
        const result = await prisma.activityFeed.createMany({
            data: activities.map(a => ({
                userId: a.userId,
                activityType: a.activityType,
                entityType: a.entityType,
                entityId: a.entityId,
                title: a.title,
                description: a.description,
                metadata: a.metadata,
                isPublic: a.isPublic ?? social_config_1.activityConfig.publicFeedTypes.includes(a.activityType),
            })),
        });
        return result.count;
    }
    // Get user's personal feed
    async getUserFeed(userId, options = {}) {
        const { limit = social_config_1.activityConfig.maxFeedItems, offset = 0, types } = options;
        const activities = await prisma.activityFeed.findMany({
            where: {
                userId,
                ...(types && { activityType: { in: types } }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        return this.enrichActivities(activities);
    }
    // Get public community feed
    async getPublicFeed(options = {}) {
        const { limit = social_config_1.activityConfig.maxFeedItems, offset = 0, types } = options;
        const activities = await prisma.activityFeed.findMany({
            where: {
                isPublic: true,
                ...(types && { activityType: { in: types } }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        return this.enrichActivities(activities);
    }
    // Get feed for specific entity (job, project, etc.)
    async getEntityFeed(entityType, entityId, options = {}) {
        const { limit = 20, offset = 0 } = options;
        const activities = await prisma.activityFeed.findMany({
            where: {
                entityType,
                entityId,
                ...(options.publicOnly && { isPublic: true }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        return this.enrichActivities(activities);
    }
    // Get feed for user's network (people they work with)
    async getNetworkFeed(userId, options = {}) {
        const { limit = social_config_1.activityConfig.maxFeedItems, offset = 0 } = options;
        // Get users in network (providers they've worked with, customers who hired them)
        const connections = await this.getUserConnections(userId);
        if (connections.length === 0) {
            return this.getPublicFeed(options);
        }
        const activities = await prisma.activityFeed.findMany({
            where: {
                userId: { in: connections },
                isPublic: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });
        return this.enrichActivities(activities);
    }
    // Get activity summary stats
    async getActivityStats(userId) {
        const activities = await prisma.activityFeed.findMany({
            where: { userId },
            select: {
                activityType: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const byType = {};
        activities.forEach(a => {
            byType[a.activityType] = (byType[a.activityType] || 0) + 1;
        });
        const streakDays = this.calculateStreak(activities.map(a => a.createdAt));
        return {
            totalActivities: activities.length,
            byType,
            recentActivity: activities[0]?.createdAt || null,
            streakDays,
        };
    }
    // Pre-built activity creators for common events
    async logJobPosted(userId, jobId, jobTitle) {
        return this.createActivity({
            userId,
            activityType: 'JOB_POSTED',
            entityType: 'job',
            entityId: jobId,
            title: '🔨 Posted a new job',
            description: jobTitle,
            isPublic: true,
        });
    }
    async logJobCompleted(userId, jobId, jobTitle) {
        return this.createActivity({
            userId,
            activityType: 'JOB_COMPLETED',
            entityType: 'job',
            entityId: jobId,
            title: '✅ Completed a job',
            description: jobTitle,
            isPublic: true,
        });
    }
    async logBidReceived(userId, jobId, bidId, providerName) {
        return this.createActivity({
            userId,
            activityType: 'BID_RECEIVED',
            entityType: 'bid',
            entityId: bidId,
            title: '💰 Received a new bid',
            description: `${providerName} submitted a bid`,
            metadata: { jobId },
            isPublic: false,
        });
    }
    async logBidAccepted(userId, jobId, bidId, jobTitle) {
        return this.createActivity({
            userId,
            activityType: 'BID_ACCEPTED',
            entityType: 'bid',
            entityId: bidId,
            title: '🎉 Bid accepted!',
            description: `Your bid for "${jobTitle}" was accepted`,
            metadata: { jobId },
            isPublic: false,
        });
    }
    async logReviewReceived(userId, reviewId, reviewerName, rating) {
        const stars = '⭐'.repeat(rating);
        return this.createActivity({
            userId,
            activityType: 'REVIEW_RECEIVED',
            entityType: 'review',
            entityId: reviewId,
            title: `${stars} Received a ${rating}-star review`,
            description: `From ${reviewerName}`,
            isPublic: true,
        });
    }
    async logMilestoneCompleted(userId, projectId, milestoneTitle) {
        return this.createActivity({
            userId,
            activityType: 'MILESTONE_COMPLETED',
            entityType: 'milestone',
            entityId: projectId,
            title: '🏁 Milestone completed',
            description: milestoneTitle,
            isPublic: true,
        });
    }
    async logBadgeEarned(userId, badgeId, badgeName, badgeDescription) {
        return this.createActivity({
            userId,
            activityType: 'BADGE_EARNED',
            entityType: 'badge',
            entityId: badgeId,
            title: `🏆 Earned badge: ${badgeName}`,
            description: badgeDescription,
            isPublic: true,
        });
    }
    async logFirstJob(userId, jobId, jobTitle) {
        return this.createActivity({
            userId,
            activityType: 'FIRST_JOB',
            entityType: 'job',
            entityId: jobId,
            title: '🎊 First job posted!',
            description: `Welcome to Bid4Service! Posted: ${jobTitle}`,
            isPublic: true,
        });
    }
    async logSocialShare(userId, shareId, platform, contentType) {
        return this.createActivity({
            userId,
            activityType: 'SOCIAL_SHARE',
            entityType: 'share',
            entityId: shareId,
            title: `📣 Shared on ${platform}`,
            description: `Shared ${contentType}`,
            isPublic: false,
        });
    }
    // Delete old activities (cleanup job)
    async cleanupOldActivities(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await prisma.activityFeed.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                // Keep important activities
                activityType: {
                    notIn: ['BADGE_EARNED', 'LEVEL_UP', 'FIRST_JOB'],
                },
            },
        });
        return result.count;
    }
    // Private helper methods
    async enrichActivities(activities) {
        // Add related entity details based on entityType
        return Promise.all(activities.map(async (activity) => {
            let relatedEntity;
            try {
                switch (activity.entityType) {
                    case 'job':
                        const job = await prisma.job.findUnique({
                            where: { id: activity.entityId },
                            select: {
                                id: true,
                                title: true,
                                category: true,
                                status: true,
                            },
                        });
                        relatedEntity = job ? { job } : undefined;
                        break;
                    case 'review':
                        const review = await prisma.review.findUnique({
                            where: { id: activity.entityId },
                            select: {
                                id: true,
                                overallRating: true,
                                comment: true,
                            },
                        });
                        relatedEntity = review ? { review } : undefined;
                        break;
                    case 'bid':
                        const bid = await prisma.bid.findUnique({
                            where: { id: activity.entityId },
                            select: {
                                id: true,
                                amount: true,
                                status: true,
                            },
                        });
                        relatedEntity = bid ? { bid } : undefined;
                        break;
                }
            }
            catch (error) {
                // Entity might have been deleted
            }
            return {
                ...activity,
                relatedEntity,
            };
        }));
    }
    async getUserConnections(userId) {
        // Get providers from completed jobs
        const asCustomer = await prisma.project.findMany({
            where: {
                job: { customerId: userId },
                status: 'COMPLETED',
            },
            select: { providerId: true },
        });
        // Get customers from completed jobs
        const asProvider = await prisma.project.findMany({
            where: {
                providerId: userId,
                status: 'COMPLETED',
            },
            select: {
                job: { select: { customerId: true } },
            },
        });
        const connections = new Set();
        asCustomer.forEach(p => connections.add(p.providerId));
        asProvider.forEach(p => connections.add(p.job.customerId));
        return Array.from(connections);
    }
    calculateStreak(dates) {
        if (dates.length === 0)
            return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const uniqueDays = new Set(dates.map(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        }));
        const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
        for (let i = 0; i < sortedDays.length; i++) {
            const expectedDay = today.getTime() - i * 24 * 60 * 60 * 1000;
            if (sortedDays[i] === expectedDay) {
                streak++;
            }
            else {
                break;
            }
        }
        return streak;
    }
    async sendNotification(userId, activity) {
        // In production, this would integrate with notification service
        // (push notifications, email, in-app notifications)
        console.log(`Notification for user ${userId}: ${activity.title}`);
    }
}
exports.ActivityFeedService = ActivityFeedService;
exports.activityFeedService = new ActivityFeedService();
