export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    scopes: string[];
    authUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
}
export interface OAuthProviderConfigs {
    google: OAuthConfig;
    facebook: OAuthConfig;
    linkedin: OAuthConfig;
    apple: OAuthConfig;
    twitter: OAuthConfig;
    github: OAuthConfig;
    microsoft: OAuthConfig;
}
export declare const oauthConfigs: OAuthProviderConfigs;
export interface ShareConfig {
    baseUrl: string;
    params: Record<string, string>;
    supportsImage: boolean;
    supportsHashtags: boolean;
    maxLength?: number;
}
export declare const shareConfigs: Record<string, ShareConfig>;
export interface ReferralRewardTier {
    minReferrals: number;
    rewardPerReferral: number;
    bonusReward: number;
    tierName: string;
}
export declare const referralRewardTiers: ReferralRewardTier[];
export declare const activityConfig: {
    maxFeedItems: number;
    publicFeedTypes: string[];
    notificationTypes: string[];
};
declare const _default: {
    oauth: OAuthProviderConfigs;
    share: Record<string, ShareConfig>;
    referral: ReferralRewardTier[];
    activity: {
        maxFeedItems: number;
        publicFeedTypes: string[];
        notificationTypes: string[];
    };
    frontendUrl: string;
    apiUrl: string;
};
export default _default;
