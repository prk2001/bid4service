// @ts-nocheck
// ============================================
// BID4SERVICE - ACTIVITY FEED SERVICE
// ============================================

import { PrismaClient, ActivityType, ActivityFeed } from '@prisma/client';
import { activityConfig } from '../config/social.config';

const prisma = new PrismaClient();

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

export class ActivityFeedService {
  // Create activity entry
  async createActivity(options: CreateActivityOptions): Promise<ActivityFeed> {
    const {
      userId,
      activityType,
      entityType,
      entityId,
      title,
      description,
      metadata,
      isPublic = activityConfig.publicFeedTypes.includes(activityType),
    } = options;

    const activity = await prisma.activityFeed.create({
      data: {
        userId,
        activityType,
        entityType,
        entityId,
        title,
        description,
        metadata: metadata as object,
        isPublic,
      },
    });

    // Trigger real-time notification if needed
    if (activityConfig.notificationTypes.includes(activityType)) {
      await this.sendNotification(userId, activity);
    }

    return activity;
  }

  // Bulk create activities (for batch processing)
  async createActivities(activities: CreateActivityOptions[]): Promise<number> {
    const result = await prisma.activityFeed.createMany({
      data: activities.map(a => ({
        userId: a.userId,
        activityType: a.activityType,
        entityType: a.entityType,
        entityId: a.entityId,
        title: a.title,
        description: a.description,
        metadata: a.metadata as object,
        isPublic: a.isPublic ?? activityConfig.publicFeedTypes.includes(a.activityType),
      })),
    });

    return result.count;
  }

  // Get user's personal feed
  async getUserFeed(userId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
    const { limit = activityConfig.maxFeedItems, offset = 0, types } = options;

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
  async getPublicFeed(options: FeedOptions = {}): Promise<FeedItem[]> {
    const { limit = activityConfig.maxFeedItems, offset = 0, types } = options;

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
  async getEntityFeed(entityType: string, entityId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
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
  async getNetworkFeed(userId: string, options: FeedOptions = {}): Promise<FeedItem[]> {
    const { limit = activityConfig.maxFeedItems, offset = 0 } = options;

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
  async getActivityStats(userId: string): Promise<{
    totalActivities: number;
    byType: Record<string, number>;
    recentActivity: Date | null;
    streakDays: number;
  }> {
    const activities = await prisma.activityFeed.findMany({
      where: { userId },
      select: {
        activityType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byType: Record<string, number> = {};
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
  async logJobPosted(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed> {
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

  async logJobCompleted(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed> {
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

  async logBidReceived(userId: string, jobId: string, bidId: string, providerName: string): Promise<ActivityFeed> {
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

  async logBidAccepted(userId: string, jobId: string, bidId: string, jobTitle: string): Promise<ActivityFeed> {
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

  async logReviewReceived(
    userId: string,
    reviewId: string,
    reviewerName: string,
    rating: number
  ): Promise<ActivityFeed> {
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

  async logMilestoneCompleted(
    userId: string,
    projectId: string,
    milestoneTitle: string
  ): Promise<ActivityFeed> {
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

  async logBadgeEarned(
    userId: string,
    badgeId: string,
    badgeName: string,
    badgeDescription: string
  ): Promise<ActivityFeed> {
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

  async logFirstJob(userId: string, jobId: string, jobTitle: string): Promise<ActivityFeed> {
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

  async logSocialShare(
    userId: string,
    shareId: string,
    platform: string,
    contentType: string
  ): Promise<ActivityFeed> {
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
  async cleanupOldActivities(daysToKeep: number = 90): Promise<number> {
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
  private async enrichActivities(activities: any[]): Promise<FeedItem[]> {
    // Add related entity details based on entityType
    return Promise.all(
      activities.map(async activity => {
        let relatedEntity: Record<string, unknown> | undefined;

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
        } catch (error) {
          // Entity might have been deleted
        }

        return {
          ...activity,
          relatedEntity,
        };
      })
    );
  }

  private async getUserConnections(userId: string): Promise<string[]> {
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

    const connections = new Set<string>();
    asCustomer.forEach(p => connections.add(p.providerId));
    asProvider.forEach(p => connections.add(p.job.customerId));

    return Array.from(connections);
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set(
      dates.map(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);
    
    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDay = today.getTime() - i * 24 * 60 * 60 * 1000;
      if (sortedDays[i] === expectedDay) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private async sendNotification(userId: string, activity: ActivityFeed): Promise<void> {
    // In production, this would integrate with notification service
    // (push notifications, email, in-app notifications)
    console.log(`Notification for user ${userId}: ${activity.title}`);
  }
}

export const activityFeedService = new ActivityFeedService();
