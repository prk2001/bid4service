// ============================================
// BID4SERVICE - SOCIAL ROUTES
// ============================================

import { Router } from 'express';
import { oauthController } from '../controllers/oauth.controller';
import { socialShareController } from '../controllers/social-share.controller';
import { referralController } from '../controllers/referral.controller';
import { activityFeedController } from '../controllers/activity-feed.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// ============================================
// OAUTH ROUTES
// ============================================

// Get available OAuth providers
router.get('/auth/providers', oauthController.getProviders);

// Initiate OAuth flow
router.get('/auth/:provider', oauthController.initiateAuth);

// OAuth callbacks (GET for most, POST for Apple)
router.get('/auth/:provider/callback', oauthController.handleCallback);
router.post('/auth/apple/callback', oauthController.handleAppleCallback);

// Link/unlink social accounts (authenticated)
router.post('/auth/link/:provider', authenticate, oauthController.linkAccount);
router.delete('/auth/link/:provider', authenticate, oauthController.unlinkAccount);
router.get('/auth/linked-accounts', authenticate, oauthController.getLinkedAccounts);

// ============================================
// SOCIAL SHARING ROUTES
// ============================================

// Generate share URLs
router.post('/social/share', authenticate, socialShareController.generateShareUrl);
router.post('/social/share/all', authenticate, socialShareController.generateAllShareUrls);

// Track shares
router.get('/s/:trackingId', socialShareController.trackClick); // Short URL redirect
router.post('/social/track/:trackingId/conversion', socialShareController.trackConversion);

// Analytics
router.get('/social/analytics', authenticate, socialShareController.getAnalytics);
router.get('/social/history', authenticate, socialShareController.getHistory);

// Open Graph
router.get('/social/og/:contentType/:contentId', socialShareController.getOpenGraphTags);

// ============================================
// REFERRAL ROUTES
// ============================================

// Referral links
router.get('/referrals/link', authenticate, referralController.getReferralLink.bind(referralController));
router.post('/referrals/create', authenticate, referralController.createReferral.bind(referralController));

// Stats and history
router.get('/referrals/stats', authenticate, referralController.getStats.bind(referralController));
router.get('/referrals/history', authenticate, referralController.getHistory.bind(referralController));

// Leaderboard (public)
router.get('/referrals/leaderboard', referralController.getLeaderboard.bind(referralController));

// Tracking
router.post('/referrals/track/:code', referralController.trackClick);
router.post('/referrals/signup', referralController.processSignup);
router.post('/referrals/convert/:code', authenticate, referralController.processConversion);

// Validation (public)
router.get('/referrals/validate/:code', referralController.validateCode);

// Custom codes
router.get('/referrals/custom-code', authenticate, referralController.getCustomCode);
router.put('/referrals/custom-code', authenticate, referralController.setCustomCode);

// Payouts
router.post('/referrals/payout', authenticate, referralController.requestPayout);

// ============================================
// ACTIVITY FEED ROUTES
// ============================================

// User feeds
router.get('/feed', authenticate, activityFeedController.getUserFeed);
router.get('/feed/network', authenticate, activityFeedController.getNetworkFeed);
router.get('/feed/stats', authenticate, activityFeedController.getStats);

// Public feed
router.get('/feed/public', activityFeedController.getPublicFeed);

// Entity-specific feed
router.get('/feed/entity/:entityType/:entityId', optionalAuthenticate, activityFeedController.getEntityFeed);

// Admin: create activity
router.post('/feed', authenticate, activityFeedController.createActivity);

export default router;
