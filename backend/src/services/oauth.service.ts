// @ts-nocheck
// ============================================
// BID4SERVICE - OAUTH SERVICE
// ============================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient, SocialProvider, User } from '@prisma/client';
import { oauthConfigs, OAuthConfig } from '../config/social.config';

const prisma = new PrismaClient();

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
  id_token?: string;
}

interface OAuthUserProfile {
  id: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  profileUrl?: string;
  rawData: Record<string, unknown>;
}

interface AuthResult {
  user: User;
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
}

export class OAuthService {
  private states: Map<string, { provider: string; returnUrl?: string; timestamp: number }> = new Map();
  
  constructor() {
    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupStates(), 5 * 60 * 1000);
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(provider: SocialProvider, returnUrl?: string): string {
    const config = this.getProviderConfig(provider);
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

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
    } else if (provider === 'APPLE') {
      params.set('response_mode', 'form_post');
    } else if (provider === 'TWITTER') {
      params.set('code_challenge', this.generateCodeChallenge(state));
      params.set('code_challenge_method', 'S256');
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(
    provider: SocialProvider,
    code: string,
    state: string
  ): Promise<AuthResult> {
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
  private async exchangeCodeForTokens(
    provider: SocialProvider,
    code: string,
    state?: string
  ): Promise<OAuthTokenResponse> {
    const config = this.getProviderConfig(provider);
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    const params: Record<string, string> = {
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
  private async getUserProfile(
    provider: SocialProvider,
    tokens: OAuthTokenResponse
  ): Promise<OAuthUserProfile> {
    const config = this.getProviderConfig(provider);
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    // Apple provides user info in ID token
    if (provider === 'APPLE' && tokens.id_token) {
      return this.parseAppleIdToken(tokens.id_token);
    }

    let url = config.userInfoUrl;
    const headers: Record<string, string> = {
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
  private normalizeProfile(
    provider: SocialProvider,
    data: Record<string, unknown>
  ): OAuthUserProfile {
    switch (provider) {
      case 'GOOGLE':
        return {
          id: data.sub as string,
          email: data.email as string,
          name: data.name as string,
          firstName: data.given_name as string,
          lastName: data.family_name as string,
          picture: data.picture as string,
          rawData: data,
        };

      case 'FACEBOOK':
        return {
          id: data.id as string,
          email: data.email as string,
          name: data.name as string,
          firstName: data.first_name as string,
          lastName: data.last_name as string,
          picture: (data.picture as { data?: { url?: string } })?.data?.url,
          profileUrl: `https://facebook.com/${data.id}`,
          rawData: data,
        };

      case 'LINKEDIN':
        return {
          id: data.sub as string,
          email: data.email as string,
          name: data.name as string,
          firstName: data.given_name as string,
          lastName: data.family_name as string,
          picture: data.picture as string,
          profileUrl: `https://linkedin.com/in/${data.sub}`,
          rawData: data,
        };

      case 'TWITTER':
        const twitterData = (data.data as Record<string, unknown>) || data;
        return {
          id: twitterData.id as string,
          name: twitterData.name as string,
          picture: twitterData.profile_image_url as string,
          profileUrl: `https://twitter.com/${twitterData.username}`,
          rawData: data,
        };

      case 'GITHUB':
        return {
          id: String(data.id),
          email: data.email as string,
          name: data.name as string || data.login as string,
          picture: data.avatar_url as string,
          profileUrl: data.html_url as string,
          rawData: data,
        };

      case 'MICROSOFT':
        return {
          id: data.id as string,
          email: data.mail as string || data.userPrincipalName as string,
          name: data.displayName as string,
          firstName: data.givenName as string,
          lastName: data.surname as string,
          rawData: data,
        };

      default:
        return {
          id: data.id as string || data.sub as string,
          email: data.email as string,
          name: data.name as string,
          rawData: data,
        };
    }
  }

  // Parse Apple ID token
  private parseAppleIdToken(idToken: string): OAuthUserProfile {
    const payload = jwt.decode(idToken) as Record<string, unknown>;
    return {
      id: payload.sub as string,
      email: payload.email as string,
      rawData: payload,
    };
  }

  // Find or create user from OAuth profile
  private async findOrCreateUser(
    provider: SocialProvider,
    profile: OAuthUserProfile,
    tokens: OAuthTokenResponse
  ): Promise<AuthResult> {
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

    let user: User;
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
          rawData: profile.rawData as object,
        },
      });
      user = socialAccount.user;
    } else {
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
              rawData: profile.rawData as object,
            },
          });
          user = existingUser;
        } else {
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
                  rawData: profile.rawData as object,
                },
              },
            },
          });
          isNewUser = true;
        }
      } else {
        throw new Error('Email is required for account creation');
      }
    }

    // Generate JWT tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { user, isNewUser, accessToken, refreshToken };
  }

  // Link social account to existing user
  async linkAccount(
    userId: string,
    provider: SocialProvider,
    code: string,
    state: string
  ): Promise<void> {
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
          rawData: profile.rawData as object,
        },
      });
    } else {
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
          rawData: profile.rawData as object,
        },
      });
    }
  }

  // Unlink social account
  async unlinkAccount(userId: string, provider: SocialProvider): Promise<void> {
    // Check if user has other login methods
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { socialAccounts: true },
    });

    if (!user) throw new Error('User not found');

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
  async getLinkedAccounts(userId: string) {
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
  private getProviderConfig(provider: SocialProvider): OAuthConfig | null {
    const key = provider.toLowerCase() as keyof typeof oauthConfigs;
    return oauthConfigs[key] || null;
  }

  private generateState(provider: string, returnUrl?: string): string {
    const state = crypto.randomBytes(32).toString('hex');
    this.states.set(state, {
      provider,
      returnUrl,
      timestamp: Date.now(),
    });
    return state;
  }

  private cleanupStates(): void {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();
    for (const [key, value] of this.states.entries()) {
      if (now - value.timestamp > maxAge) {
        this.states.delete(key);
      }
    }
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  private generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { expiresIn: '7d' }
    );
  }
}

export const oauthService = new OAuthService();
