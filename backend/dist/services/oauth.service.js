"use strict";
// @ts-nocheck
// ============================================
// BID4SERVICE - OAUTH SERVICE
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthService = exports.OAuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const social_config_1 = require("../config/social.config");
const prisma = new client_1.PrismaClient();
class OAuthService {
    constructor() {
        this.states = new Map();
        // Clean up expired states every 5 minutes
        setInterval(() => this.cleanupStates(), 5 * 60 * 1000);
    }
    // Generate OAuth authorization URL
    getAuthorizationUrl(provider, returnUrl) {
        const config = this.getProviderConfig(provider);
        if (!config)
            throw new Error(`Unsupported provider: ${provider}`);
        const state = this.generateState(provider, returnUrl);
        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.callbackUrl,
            scope: config.scopes.join(' '),
            response_type: 'code',
            state,
        });
        // Provider-specific params
        if (provider === 'GOOGLE') {
            params.set('access_type', 'offline');
            params.set('prompt', 'consent');
        }
        else if (provider === 'APPLE') {
            params.set('response_mode', 'form_post');
        }
        else if (provider === 'TWITTER') {
            params.set('code_challenge', this.generateCodeChallenge(state));
            params.set('code_challenge_method', 'S256');
        }
        return `${config.authUrl}?${params.toString()}`;
    }
    // Handle OAuth callback
    async handleCallback(provider, code, state) {
        // Verify state
        const stateData = this.states.get(state);
        if (!stateData || stateData.provider !== provider) {
            throw new Error('Invalid OAuth state');
        }
        this.states.delete(state);
        // Exchange code for tokens
        const tokens = await this.exchangeCodeForTokens(provider, code, state);
        // Get user profile
        const profile = await this.getUserProfile(provider, tokens);
        // Find or create user
        const result = await this.findOrCreateUser(provider, profile, tokens);
        return result;
    }
    // Exchange authorization code for tokens
    async exchangeCodeForTokens(provider, code, state) {
        const config = this.getProviderConfig(provider);
        if (!config)
            throw new Error(`Unsupported provider: ${provider}`);
        const params = {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: config.callbackUrl,
            grant_type: 'authorization_code',
        };
        // Twitter requires code_verifier
        if (provider === 'TWITTER' && state) {
            params.code_verifier = state;
        }
        const response = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: new URLSearchParams(params).toString(),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }
        return response.json();
    }
    // Get user profile from provider
    async getUserProfile(provider, tokens) {
        const config = this.getProviderConfig(provider);
        if (!config)
            throw new Error(`Unsupported provider: ${provider}`);
        // Apple provides user info in ID token
        if (provider === 'APPLE' && tokens.id_token) {
            return this.parseAppleIdToken(tokens.id_token);
        }
        let url = config.userInfoUrl;
        const headers = {
            Authorization: `Bearer ${tokens.access_token}`,
            Accept: 'application/json',
        };
        // Facebook requires fields parameter
        if (provider === 'FACEBOOK') {
            url += '?fields=id,email,name,first_name,last_name,picture.type(large)';
        }
        // GitHub needs different header
        if (provider === 'GITHUB') {
            headers['User-Agent'] = 'Bid4Service-OAuth';
        }
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }
        const data = await response.json();
        return this.normalizeProfile(provider, data);
    }
    // Normalize profile data from different providers
    normalizeProfile(provider, data) {
        switch (provider) {
            case 'GOOGLE':
                return {
                    id: data.sub,
                    email: data.email,
                    name: data.name,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    picture: data.picture,
                    rawData: data,
                };
            case 'FACEBOOK':
                return {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    picture: data.picture?.data?.url,
                    profileUrl: `https://facebook.com/${data.id}`,
                    rawData: data,
                };
            case 'LINKEDIN':
                return {
                    id: data.sub,
                    email: data.email,
                    name: data.name,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    picture: data.picture,
                    profileUrl: `https://linkedin.com/in/${data.sub}`,
                    rawData: data,
                };
            case 'TWITTER':
                const twitterData = data.data || data;
                return {
                    id: twitterData.id,
                    name: twitterData.name,
                    picture: twitterData.profile_image_url,
                    profileUrl: `https://twitter.com/${twitterData.username}`,
                    rawData: data,
                };
            case 'GITHUB':
                return {
                    id: String(data.id),
                    email: data.email,
                    name: data.name || data.login,
                    picture: data.avatar_url,
                    profileUrl: data.html_url,
                    rawData: data,
                };
            case 'MICROSOFT':
                return {
                    id: data.id,
                    email: data.mail || data.userPrincipalName,
                    name: data.displayName,
                    firstName: data.givenName,
                    lastName: data.surname,
                    rawData: data,
                };
            default:
                return {
                    id: data.id || data.sub,
                    email: data.email,
                    name: data.name,
                    rawData: data,
                };
        }
    }
    // Parse Apple ID token
    parseAppleIdToken(idToken) {
        const payload = jsonwebtoken_1.default.decode(idToken);
        return {
            id: payload.sub,
            email: payload.email,
            rawData: payload,
        };
    }
    // Find or create user from OAuth profile
    async findOrCreateUser(provider, profile, tokens) {
        // Check if social account exists
        let socialAccount = await prisma.socialAccount.findUnique({
            where: {
                provider_providerId: {
                    provider,
                    providerId: profile.id,
                },
            },
            include: { user: true },
        });
        let user;
        let isNewUser = false;
        if (socialAccount) {
            // Update tokens
            await prisma.socialAccount.update({
                where: { id: socialAccount.id },
                data: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    tokenExpiry: tokens.expires_in
                        ? new Date(Date.now() + tokens.expires_in * 1000)
                        : null,
                    rawData: profile.rawData,
                },
            });
            user = socialAccount.user;
        }
        else {
            // Check if user with email exists
            if (profile.email) {
                const existingUser = await prisma.user.findUnique({
                    where: { email: profile.email },
                });
                if (existingUser) {
                    // Link social account to existing user
                    await prisma.socialAccount.create({
                        data: {
                            userId: existingUser.id,
                            provider,
                            providerId: profile.id,
                            accessToken: tokens.access_token,
                            refreshToken: tokens.refresh_token,
                            tokenExpiry: tokens.expires_in
                                ? new Date(Date.now() + tokens.expires_in * 1000)
                                : null,
                            email: profile.email,
                            displayName: profile.name,
                            avatarUrl: profile.picture,
                            profileUrl: profile.profileUrl,
                            rawData: profile.rawData,
                        },
                    });
                    user = existingUser;
                }
                else {
                    // Create new user with social account
                    user = await prisma.user.create({
                        data: {
                            email: profile.email,
                            firstName: profile.firstName || profile.name?.split(' ')[0] || '',
                            lastName: profile.lastName || profile.name?.split(' ').slice(1).join(' ') || '',
                            profileImage: profile.picture,
                            role: 'CUSTOMER',
                            status: 'ACTIVE',
                            emailVerified: true, // OAuth emails are verified
                            socialAccounts: {
                                create: {
                                    provider,
                                    providerId: profile.id,
                                    accessToken: tokens.access_token,
                                    refreshToken: tokens.refresh_token,
                                    tokenExpiry: tokens.expires_in
                                        ? new Date(Date.now() + tokens.expires_in * 1000)
                                        : null,
                                    email: profile.email,
                                    displayName: profile.name,
                                    avatarUrl: profile.picture,
                                    profileUrl: profile.profileUrl,
                                    rawData: profile.rawData,
                                },
                            },
                        },
                    });
                    isNewUser = true;
                }
            }
            else {
                throw new Error('Email is required for account creation');
            }
        }
        // Generate JWT tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { user, isNewUser, accessToken, refreshToken };
    }
    // Link social account to existing user
    async linkAccount(userId, provider, code, state) {
        const tokens = await this.exchangeCodeForTokens(provider, code, state);
        const profile = await this.getUserProfile(provider, tokens);
        // Check if already linked to another user
        const existing = await prisma.socialAccount.findUnique({
            where: {
                provider_providerId: {
                    provider,
                    providerId: profile.id,
                },
            },
        });
        if (existing && existing.userId !== userId) {
            throw new Error('This social account is already linked to another user');
        }
        // Check if user already has this provider linked
        const userAccount = await prisma.socialAccount.findUnique({
            where: {
                userId_provider: {
                    userId,
                    provider,
                },
            },
        });
        if (userAccount) {
            // Update existing link
            await prisma.socialAccount.update({
                where: { id: userAccount.id },
                data: {
                    providerId: profile.id,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    tokenExpiry: tokens.expires_in
                        ? new Date(Date.now() + tokens.expires_in * 1000)
                        : null,
                    email: profile.email,
                    displayName: profile.name,
                    avatarUrl: profile.picture,
                    profileUrl: profile.profileUrl,
                    rawData: profile.rawData,
                },
            });
        }
        else {
            // Create new link
            await prisma.socialAccount.create({
                data: {
                    userId,
                    provider,
                    providerId: profile.id,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    tokenExpiry: tokens.expires_in
                        ? new Date(Date.now() + tokens.expires_in * 1000)
                        : null,
                    email: profile.email,
                    displayName: profile.name,
                    avatarUrl: profile.picture,
                    profileUrl: profile.profileUrl,
                    rawData: profile.rawData,
                },
            });
        }
    }
    // Unlink social account
    async unlinkAccount(userId, provider) {
        // Check if user has other login methods
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { socialAccounts: true },
        });
        if (!user)
            throw new Error('User not found');
        const hasPassword = !!user.passwordHash;
        const otherAccounts = user.socialAccounts.filter(a => a.provider !== provider);
        if (!hasPassword && otherAccounts.length === 0) {
            throw new Error('Cannot unlink the only login method. Set a password first.');
        }
        await prisma.socialAccount.deleteMany({
            where: {
                userId,
                provider,
            },
        });
    }
    // Get linked accounts for user
    async getLinkedAccounts(userId) {
        return prisma.socialAccount.findMany({
            where: { userId },
            select: {
                provider: true,
                email: true,
                displayName: true,
                avatarUrl: true,
                profileUrl: true,
                createdAt: true,
            },
        });
    }
    // Helper methods
    getProviderConfig(provider) {
        const key = provider.toLowerCase();
        return social_config_1.oauthConfigs[key] || null;
    }
    generateState(provider, returnUrl) {
        const state = crypto_1.default.randomBytes(32).toString('hex');
        this.states.set(state, {
            provider,
            returnUrl,
            timestamp: Date.now(),
        });
        return state;
    }
    cleanupStates() {
        const maxAge = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();
        for (const [key, value] of this.states.entries()) {
            if (now - value.timestamp > maxAge) {
                this.states.delete(key);
            }
        }
    }
    generateCodeChallenge(verifier) {
        return crypto_1.default.createHash('sha256').update(verifier).digest('base64url');
    }
    generateAccessToken(user) {
        return jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'default-secret', { expiresIn: '15m' });
    }
    generateRefreshToken(user) {
        return jsonwebtoken_1.default.sign({ userId: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', { expiresIn: '7d' });
    }
}
exports.OAuthService = OAuthService;
exports.oauthService = new OAuthService();
