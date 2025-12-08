import { Request, Response, NextFunction } from 'express';
/**
 * Send a message
 * POST /api/v1/messages
 */
export declare const sendMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get all conversations for current user
 * GET /api/v1/messages/conversations
 */
export declare const getConversations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get messages with a specific user
 * GET /api/v1/messages/:userId
 */
export declare const getMessagesWithUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get messages for a project
 * GET /api/v1/messages/project/:projectId
 */
export declare const getProjectMessages: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Mark message as read
 * PUT /api/v1/messages/:id/read
 */
export declare const markAsRead: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get unread message count
 * GET /api/v1/messages/unread/count
 */
export declare const getUnreadCount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete message
 * DELETE /api/v1/messages/:id
 */
export declare const deleteMessage: (req: Request, res: Response, next: NextFunction) => Promise<void>;
