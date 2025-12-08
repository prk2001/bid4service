"use strict";
// ============================================
// BID4SERVICE - SOCIAL ROUTES
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const social_share_controller_1 = require("../controllers/social-share.controller");
const referral_controller_1 = require("../controllers/referral.controller");
const activity_feed_controller_1 = require("../controllers/activity-feed.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ============================================
// OAUTH ROUTES
// ============================================
// Get available OAuth providers
router.get('/auth/providers', oauth_controller_1.oauthController.getProviders);
// Initiate OAuth flow
router.get('/auth/:provider', oauth_controller_1.oauthController.initiateAuth);
// OAuth callbacks (GET for most, POST for Apple)
router.get('/auth/:provider/callback', oauth_controller_1.oauthController.handleCallback);
router.post('/auth/apple/callback', oauth_controller_1.oauthController.handleAppleCallback);
// Link/unlink social accounts (authenticated)
router.post('/auth/link/:provider', auth_1.authenticate, oauth_controller_1.oauthController.linkAccount);
router.delete('/auth/link/:provider', auth_1.authenticate, oauth_controller_1.oauthController.unlinkAccount);
router.get('/auth/linked-accounts', auth_1.authenticate, oauth_controller_1.oauthController.getLinkedAccounts);
// ============================================
// SOCIAL SHARING ROUTES
// ============================================
// Generate share URLs
router.post('/social/share', auth_1.authenticate, social_share_controller_1.socialShareController.generateShareUrl);
router.post('/social/share/all', auth_1.authenticate, social_share_controller_1.socialShareController.generateAllShareUrls);
// Track shares
router.get('/s/:trackingId', social_share_controller_1.socialShareController.trackClick); // Short URL redirect
router.post('/social/track/:trackingId/conversion', social_share_controller_1.socialShareController.trackConversion);
// Analytics
router.get('/social/analytics', auth_1.authenticate, social_share_controller_1.socialShareController.getAnalytics);
router.get('/social/history', auth_1.authenticate, social_share_controller_1.socialShareController.getHistory);
// Open Graph
router.get('/social/og/:contentType/:contentId', social_share_controller_1.socialShareController.getOpenGraphTags);
// ============================================
// REFERRAL ROUTES
// ============================================
// Referral links
router.get('/referrals/link', auth_1.authenticate, referral_controller_1.referralController.getReferralLink.bind(referral_controller_1.referralController));
router.post('/referrals/create', auth_1.authenticate, referral_controller_1.referralController.createReferral.bind(referral_controller_1.referralController));
// Stats and history
router.get('/referrals/stats', auth_1.authenticate, referral_controller_1.referralController.getStats.bind(referral_controller_1.referralController));
router.get('/referrals/history', auth_1.authenticate, referral_controller_1.referralController.getHistory.bind(referral_controller_1.referralController));
// Leaderboard (public)
router.get('/referrals/leaderboard', referral_controller_1.referralController.getLeaderboard.bind(referral_controller_1.referralController));
// Tracking
router.post('/referrals/track/:code', referral_controller_1.referralController.trackClick);
router.post('/referrals/signup', referral_controller_1.referralController.processSignup);
router.post('/referrals/convert/:code', auth_1.authenticate, referral_controller_1.referralController.processConversion);
// Validation (public)
router.get('/referrals/validate/:code', referral_controller_1.referralController.validateCode);
// Custom codes
router.get('/referrals/custom-code', auth_1.authenticate, referral_controller_1.referralController.getCustomCode);
router.put('/referrals/custom-code', auth_1.authenticate, referral_controller_1.referralController.setCustomCode);
// Payouts
router.post('/referrals/payout', auth_1.authenticate, referral_controller_1.referralController.requestPayout);
// ============================================
// ACTIVITY FEED ROUTES
// ============================================
// User feeds
router.get('/feed', auth_1.authenticate, activity_feed_controller_1.activityFeedController.getUserFeed);
router.get('/feed/network', auth_1.authenticate, activity_feed_controller_1.activityFeedController.getNetworkFeed);
router.get('/feed/stats', auth_1.authenticate, activity_feed_controller_1.activityFeedController.getStats);
// Public feed
router.get('/feed/public', activity_feed_controller_1.activityFeedController.getPublicFeed);
// Entity-specific feed
router.get('/feed/entity/:entityType/:entityId', auth_1.optionalAuthenticate, activity_feed_controller_1.activityFeedController.getEntityFeed);
// Admin: create activity
router.post('/feed', auth_1.authenticate, activity_feed_controller_1.activityFeedController.createActivity);
exports.default = router;
