import { Request, Response, NextFunction } from 'express';
export declare class ReferralController {
    getReferralLink(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createReferral(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    trackClick(req: Request, res: Response, next: NextFunction): Promise<void>;
    processSignup(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    processConversion(req: Request, res: Response, next: NextFunction): Promise<void>;
    requestPayout(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    validateCode(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCustomCode(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    setCustomCode(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const referralController: ReferralController;
