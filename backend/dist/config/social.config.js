"use strict";
// ============================================
// BID4SERVICE - OAUTH CONFIGURATION
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityConfig = exports.referralRewardTiers = exports.shareConfigs = exports.oauthConfigs = void 0;
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
exports.oauthConfigs = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/google/callback`,
        scopes: [
            'openid',
            'profile',
            'email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    facebook: {
        clientId: process.env.FACEBOOK_APP_ID || '',
        clientSecret: process.env.FACEBOOK_APP_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/facebook/callback`,
        scopes: ['email', 'public_profile'],
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
        userInfoUrl: 'https://graph.facebook.com/v18.0/me',
    },
    linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/linkedin/callback`,
        scopes: ['openid', 'profile', 'email'],
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
    },
    apple: {
        clientId: process.env.APPLE_CLIENT_ID || '',
        clientSecret: process.env.APPLE_CLIENT_SECRET || '', // Generated JWT
        callbackUrl: `${BASE_URL}/api/v1/auth/apple/callback`,
        scopes: ['name', 'email'],
        authUrl: 'https://appleid.apple.com/auth/authorize',
        tokenUrl: 'https://appleid.apple.com/auth/token',
        userInfoUrl: '', // Apple provides user info in ID token
    },
    twitter: {
        clientId: process.env.TWITTER_CLIENT_ID || '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/twitter/callback`,
        scopes: ['tweet.read', 'users.read', 'offline.access'],
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        tokenUrl: 'https://api.twitter.com/2/oauth2/token',
        userInfoUrl: 'https://api.twitter.com/2/users/me',
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/github/callback`,
        scopes: ['read:user', 'user:email'],
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
    },
    microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        callbackUrl: `${BASE_URL}/api/v1/auth/microsoft/callback`,
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    },
};
exports.shareConfigs = {
    facebook: {
        baseUrl: 'https://www.facebook.com/sharer/sharer.php',
        params: { u: 'url', quote: 'text' },
        supportsImage: false,
        supportsHashtags: true,
    },
    twitter: {
        baseUrl: 'https://twitter.com/intent/tweet',
        params: { url: 'url', text: 'text', hashtags: 'hashtags' },
        supportsImage: false,
        supportsHashtags: true,
        maxLength: 280,
    },
    linkedin: {
        baseUrl: 'https://www.linkedin.com/sharing/share-offsite/',
        params: { url: 'url' },
        supportsImage: false,
        supportsHashtags: false,
    },
    pinterest: {
        baseUrl: 'https://pinterest.com/pin/create/button/',
        params: { url: 'url', media: 'image', description: 'text' },
        supportsImage: true,
        supportsHashtags: true,
    },
    whatsapp: {
        baseUrl: 'https://api.whatsapp.com/send',
        params: { text: 'text' },
        supportsImage: false,
        supportsHashtags: false,
    },
    email: {
        baseUrl: 'mailto:',
        params: { subject: 'subject', body: 'body' },
        supportsImage: false,
        supportsHashtags: false,
    },
    sms: {
        baseUrl: 'sms:',
        params: { body: 'body' },
        supportsImage: false,
        supportsHashtags: false,
    },
    nextdoor: {
        baseUrl: 'https://nextdoor.com/share/',
        params: { url: 'url', title: 'title' },
        supportsImage: false,
        supportsHashtags: false,
    },
};
exports.referralRewardTiers = [
    { minReferrals: 0, rewardPerReferral: 10, bonusReward: 0, tierName: 'Starter' },
    { minReferrals: 5, rewardPerReferral: 15, bonusReward: 25, tierName: 'Bronze' },
    { minReferrals: 10, rewardPerReferral: 20, bonusReward: 50, tierName: 'Silver' },
    { minReferrals: 25, rewardPerReferral: 25, bonusReward: 100, tierName: 'Gold' },
    { minReferrals: 50, rewardPerReferral: 30, bonusReward: 250, tierName: 'Platinum' },
    { minReferrals: 100, rewardPerReferral: 40, bonusReward: 500, tierName: 'Diamond' },
];
// Activity feed configuration
exports.activityConfig = {
    maxFeedItems: 50,
    publicFeedTypes: [
        'JOB_POSTED',
        'JOB_COMPLETED',
        'REVIEW_RECEIVED',
        'BADGE_EARNED',
        'LEVEL_UP',
    ],
    notificationTypes: [
        'BID_RECEIVED',
        'BID_ACCEPTED',
        'REVIEW_RECEIVED',
        'PAYMENT_RECEIVED',
        'REFERRAL_SIGNUP',
    ],
};
exports.default = {
    oauth: exports.oauthConfigs,
    share: exports.shareConfigs,
    referral: exports.referralRewardTiers,
    activity: exports.activityConfig,
    frontendUrl: FRONTEND_URL,
    apiUrl: BASE_URL,
};
