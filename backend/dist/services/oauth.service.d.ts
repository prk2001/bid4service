import { SocialProvider, User } from '@prisma/client';
interface AuthResult {
    user: User;
    isNewUser: boolean;
    accessToken: string;
    refreshToken: string;
}
export declare class OAuthService {
    private states;
    constructor();
    getAuthorizationUrl(provider: SocialProvider, returnUrl?: string): string;
    handleCallback(provider: SocialProvider, code: string, state: string): Promise<AuthResult>;
    private exchangeCodeForTokens;
    private getUserProfile;
    private normalizeProfile;
    private parseAppleIdToken;
    private findOrCreateUser;
    linkAccount(userId: string, provider: SocialProvider, code: string, state: string): Promise<void>;
    unlinkAccount(userId: string, provider: SocialProvider): Promise<void>;
    getLinkedAccounts(userId: string): Promise<{
        email: string;
        createdAt: Date;
        provider: import(".prisma/client").$Enums.SocialProvider;
        displayName: string;
        profileUrl: string;
        avatarUrl: string;
    }[]>;
    private getProviderConfig;
    private generateState;
    private cleanupStates;
    private generateCodeChallenge;
    private generateAccessToken;
    private generateRefreshToken;
}
export declare const oauthService: OAuthService;
export {};
