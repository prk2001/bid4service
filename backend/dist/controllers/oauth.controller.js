"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - OAUTH CONTROLLER
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthController = exports.OAuthController = void 0;
const oauth_service_1 = require("../services/oauth.service");
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// Helper to validate provider
const validateProvider = (provider) => {
    const providers = [
        'GOOGLE',
        'FACEBOOK',
        'LINKEDIN',
        'APPLE',
        'TWITTER',
        'GITHUB',
        'MICROSOFT',
    ];
    const upperProvider = provider.toUpperCase();
    return providers.includes(upperProvider) ? upperProvider : null;
};
class OAuthController {
    // GET /api/v1/auth/:provider
    // Initiate OAuth flow
    async initiateAuth(req, res, next) {
        try {
            const { provider } = req.params;
            const { returnUrl } = req.query;
            const validProvider = validateProvider(provider);
            if (!validProvider) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OAuth provider',
                });
            }
            const authUrl = oauth_service_1.oauthService.getAuthorizationUrl(validProvider, returnUrl);
            res.json({
                success: true,
                data: { authUrl },
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/auth/:provider/callback
    // Handle OAuth callback
    async handleCallback(req, res, next) {
        try {
            const { provider } = req.params;
            const { code, state, error, error_description } = req.query;
            // Handle OAuth errors
            if (error) {
                return res.redirect(`${FRONTEND_URL}/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(error_description || '')}`);
            }
            const validProvider = validateProvider(provider);
            if (!validProvider) {
                return res.redirect(`${FRONTEND_URL}/auth/error?error=invalid_provider`);
            }
            if (!code || !state) {
                return res.redirect(`${FRONTEND_URL}/auth/error?error=missing_params`);
            }
            const result = await oauth_service_1.oauthService.handleCallback(validProvider, code, state);
            // Redirect to frontend with tokens
            const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
            redirectUrl.searchParams.set('access_token', result.accessToken);
            redirectUrl.searchParams.set('refresh_token', result.refreshToken);
            redirectUrl.searchParams.set('is_new_user', String(result.isNewUser));
            res.redirect(redirectUrl.toString());
        }
        catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${FRONTEND_URL}/auth/error?error=${encodeURIComponent(error.message || 'auth_failed')}`);
        }
    }
    // POST /api/v1/auth/:provider/callback
    // Handle Apple Sign-In (uses form_post response mode)
    async handleAppleCallback(req, res, next) {
        try {
            const { code, state, error, id_token, user } = req.body;
            if (error) {
                return res.redirect(`${FRONTEND_URL}/auth/error?error=${encodeURIComponent(error)}`);
            }
            const result = await oauth_service_1.oauthService.handleCallback('APPLE', code, state);
            const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
            redirectUrl.searchParams.set('access_token', result.accessToken);
            redirectUrl.searchParams.set('refresh_token', result.refreshToken);
            redirectUrl.searchParams.set('is_new_user', String(result.isNewUser));
            res.redirect(redirectUrl.toString());
        }
        catch (error) {
            console.error('Apple OAuth error:', error);
            res.redirect(`${FRONTEND_URL}/auth/error?error=${encodeURIComponent(error.message || 'auth_failed')}`);
        }
    }
    // POST /api/v1/auth/link/:provider
    // Link social account to existing user
    async linkAccount(req, res, next) {
        try {
            const { provider } = req.params;
            const { code, state } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const validProvider = validateProvider(provider);
            if (!validProvider) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OAuth provider',
                });
            }
            await oauth_service_1.oauthService.linkAccount(userId, validProvider, code, state);
            res.json({
                success: true,
                message: `${provider} account linked successfully`,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // DELETE /api/v1/auth/link/:provider
    // Unlink social account
    async unlinkAccount(req, res, next) {
        try {
            const { provider } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const validProvider = validateProvider(provider);
            if (!validProvider) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OAuth provider',
                });
            }
            await oauth_service_1.oauthService.unlinkAccount(userId, validProvider);
            res.json({
                success: true,
                message: `${provider} account unlinked successfully`,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/auth/linked-accounts
    // Get user's linked social accounts
    async getLinkedAccounts(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                });
            }
            const accounts = await oauth_service_1.oauthService.getLinkedAccounts(userId);
            res.json({
                success: true,
                data: accounts,
            });
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/auth/providers
    // Get available OAuth providers
    async getProviders(req, res) {
        const providers = [
            {
                id: 'google',
                name: 'Google',
                icon: '/icons/google.svg',
                color: '#4285F4',
                enabled: !!process.env.GOOGLE_CLIENT_ID,
            },
            {
                id: 'facebook',
                name: 'Facebook',
                icon: '/icons/facebook.svg',
                color: '#1877F2',
                enabled: !!process.env.FACEBOOK_APP_ID,
            },
            {
                id: 'linkedin',
                name: 'LinkedIn',
                icon: '/icons/linkedin.svg',
                color: '#0A66C2',
                enabled: !!process.env.LINKEDIN_CLIENT_ID,
            },
            {
                id: 'apple',
                name: 'Apple',
                icon: '/icons/apple.svg',
                color: '#000000',
                enabled: !!process.env.APPLE_CLIENT_ID,
            },
            {
                id: 'twitter',
                name: 'X (Twitter)',
                icon: '/icons/twitter.svg',
                color: '#1DA1F2',
                enabled: !!process.env.TWITTER_CLIENT_ID,
            },
            {
                id: 'github',
                name: 'GitHub',
                icon: '/icons/github.svg',
                color: '#181717',
                enabled: !!process.env.GITHUB_CLIENT_ID,
            },
            {
                id: 'microsoft',
                name: 'Microsoft',
                icon: '/icons/microsoft.svg',
                color: '#00A4EF',
                enabled: !!process.env.MICROSOFT_CLIENT_ID,
            },
        ];
        res.json({
            success: true,
            data: providers,
        });
    }
}
exports.OAuthController = OAuthController;
exports.oauthController = new OAuthController();
