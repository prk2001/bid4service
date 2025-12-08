import { Request, Response, NextFunction } from 'express';
export declare class OAuthController {
    initiateAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    handleCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
    handleAppleCallback(req: Request, res: Response, next: NextFunction): Promise<void>;
    linkAccount(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    unlinkAccount(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getLinkedAccounts(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getProviders(req: Request, res: Response): Promise<void>;
}
export declare const oauthController: OAuthController;
