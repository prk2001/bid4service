import { Request, Response, NextFunction } from 'express';
export declare class ActivityFeedController {
    getUserFeed(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getPublicFeed(req: Request, res: Response, next: NextFunction): Promise<void>;
    getNetworkFeed(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    getEntityFeed(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
    createActivity(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>>>;
}
export declare const activityFeedController: ActivityFeedController;
