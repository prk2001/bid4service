import { ActivityType, ActivityFeed } from '@prisma/client';
interface CreateActivityOptions {
    userId: string;
    activityType: ActivityType;
    entityType: string;
    entityId: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    isPublic?: boolean;
}
interface FeedItem extends ActivityFeed {
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage: string | null;
        role: string;
    };
    relatedEntity?: Record<string, unknown>;
}
interface FeedOptions {
    limit?: number;
    offset?: number;
    types?: ActivityType[];
    publicOnly?: boolean;
    userId?: string;
}
export declare class ActivityFeedService {
    createActivity(options: CreateActivityOptions): Promise<ActivityFeed>;
    createActivities(activities: CreateActivityOptions[]): Promise<number>;
    getUserFeed(userId: string, options?: FeedOptions): Promise<FeedItem[]>;
    getPublicFeed(options?: FeedOptions): Promise<FeedItem[]>;
    getEntityFeed(entityType: string, entityId: string, options?: FeedOptions): Promise<FeedItem[]>;
    getNetworkFeed(userId: string, options?: FeedOptions): Promise<FeedItem[]>;
    getActivityStats(userId: string): Promise<{
        totalActivities: number;
        byType: Record<string, number>;
        recentActivity: Date | null;
        streakDays: number;
    }>;
    logJobPosted(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed>;
    logJobCompleted(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed>;
    logBidReceived(userId: string, jobId: string, bidId: string, providerName: string): Promise<ActivityFeed>;
    logBidAccepted(userId: string, jobId: string, bidId: string, jobTitle: string): Promise<ActivityFeed>;
    logReviewReceived(userId: string, reviewId: string, reviewerName: string, rating: number): Promise<ActivityFeed>;
    logMilestoneCompleted(userId: string, projectId: string, milestoneTitle: string): Promise<ActivityFeed>;
    logBadgeEarned(userId: string, badgeId: string, badgeName: string, badgeDescription: string): Promise<ActivityFeed>;
    logFirstJob(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed>;
    logSocialShare(userId: string, shareId: string, platform: string, contentType: string): Promise<ActivityFeed>;
    cleanupOldActivities(daysToKeep?: number): Promise<number>;
    private enrichActivities;
    private getUserConnections;
    private calculateStreak;
    private sendNotification;
}
export declare const activityFeedService: ActivityFeedService;
export {};
