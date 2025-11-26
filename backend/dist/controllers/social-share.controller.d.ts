import { Request, Response, NextFunction } from 'express';
export declare class SocialShareController {
    generateShareUrl(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    generateAllShareUrls(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    trackClick(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    trackConversion(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAnalytics(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getOpenGraphTags(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const socialShareController: SocialShareController;
