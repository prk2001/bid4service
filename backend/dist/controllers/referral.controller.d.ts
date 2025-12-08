import { Request, Response, NextFunction } from 'express';
export declare class ReferralController {
    getReferralLink(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createReferral(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<void>;
    getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    trackClick(req: Request, res: Response, next: NextFunction): Promise<void>;
    processSignup(req: Request, res: Response, next: NextFunction): Promise<void>;
    processConversion(req: Request, res: Response, next: NextFunction): Promise<void>;
    requestPayout(req: Request, res: Response, next: NextFunction): Promise<void>;
    validateCode(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCustomCode(req: Request, res: Response, next: NextFunction): Promise<void>;
    setCustomCode(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const referralController: ReferralController;
