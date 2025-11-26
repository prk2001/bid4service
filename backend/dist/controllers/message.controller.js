"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getUnreadCount = exports.markAsRead = exports.getProjectMessages = exports.getMessagesWithUser = exports.getConversations = exports.sendMessage = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const prisma = new client_1.PrismaClient();
/**
 * Send a message
 * POST /api/v1/messages
 */
const sendMessage = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { receiverId, content, projectId, attachments } = req.body;
        if (!receiverId || !content) {
            throw new errors_1.BadRequestError('Receiver and content are required');
        }
        // Verify receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) {
            throw new errors_1.NotFoundError('Receiver not found');
        }
        // If projectId provided, verify user is involved in project
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });
            if (!project) {
                throw new errors_1.NotFoundError('Project not found');
            }
            const isInvolved = project.customerId === req.user.userId ||
                project.providerId === req.user.userId;
            if (!isInvolved) {
                throw new errors_1.ForbiddenError('You are not involved in this project');
            }
        }
        // Create message
        const message = await prisma.message.create({
            data: {
                senderId: req.user.userId,
                receiverId,
                content,
                projectId: projectId || null,
                attachments: attachments || [],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        // TODO: Send real-time notification via WebSocket
        // TODO: Send email/SMS notification if user preferences allow
        logger_1.default.info(`Message sent: ${message.id} from ${req.user.userId} to ${receiverId}`);
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendMessage = sendMessage;
/**
 * Get all conversations for current user
 * GET /api/v1/messages/conversations
 */
const getConversations = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        // Get all unique users the current user has messaged with
        const sentMessages = await prisma.message.findMany({
            where: { senderId: req.user.userId },
            distinct: ['receiverId'],
            select: {
                receiverId: true,
                receiver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
                createdAt: true,
                content: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const receivedMessages = await prisma.message.findMany({
            where: { receiverId: req.user.userId },
            distinct: ['senderId'],
            select: {
                senderId: true,
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                        role: true,
                    },
                },
                createdAt: true,
                content: true,
                status: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        // Combine and get unique conversations
        const conversationMap = new Map();
        sentMessages.forEach(msg => {
            if (!conversationMap.has(msg.receiverId)) {
                conversationMap.set(msg.receiverId, {
                    user: msg.receiver,
                    lastMessage: {
                        content: msg.content,
                        createdAt: msg.createdAt,
                        isSent: true,
                        status: msg.status,
                    },
                });
            }
        });
        receivedMessages.forEach(msg => {
            if (!conversationMap.has(msg.senderId)) {
                conversationMap.set(msg.senderId, {
                    user: msg.sender,
                    lastMessage: {
                        content: msg.content,
                        createdAt: msg.createdAt,
                        isSent: false,
                        status: msg.status,
                    },
                });
            }
            else {
                // Update if this message is more recent
                const existing = conversationMap.get(msg.senderId);
                if (msg.createdAt > existing.lastMessage.createdAt) {
                    existing.lastMessage = {
                        content: msg.content,
                        createdAt: msg.createdAt,
                        isSent: false,
                        status: msg.status,
                    };
                }
            }
        });
        // Get unread count for each conversation
        const conversations = await Promise.all(Array.from(conversationMap.entries()).map(async ([userId, data]) => {
            const unreadCount = await prisma.message.count({
                where: {
                    senderId: userId,
                    receiverId: req.user.userId,
                    status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
                },
            });
            return {
                ...data,
                unreadCount,
            };
        }));
        // Sort by most recent message
        conversations.sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
        res.status(200).json({
            success: true,
            data: { conversations },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getConversations = getConversations;
/**
 * Get messages with a specific user
 * GET /api/v1/messages/:userId
 */
const getMessagesWithUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { userId } = req.params;
        const { page = '1', limit = '50', projectId } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        // Build where clause
        const where = {
            OR: [
                { senderId: req.user.userId, receiverId: userId },
                { senderId: userId, receiverId: req.user.userId },
            ],
        };
        if (projectId) {
            where.projectId = projectId;
        }
        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profileImage: true,
                        },
                    },
                },
            }),
            prisma.message.count({ where }),
        ]);
        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                senderId: userId,
                receiverId: req.user.userId,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            data: {
                status: client_1.MessageStatus.READ,
                readAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            data: {
                messages,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMessagesWithUser = getMessagesWithUser;
/**
 * Get messages for a project
 * GET /api/v1/messages/project/:projectId
 */
const getProjectMessages = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { projectId } = req.params;
        // Verify user is involved in project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            throw new errors_1.NotFoundError('Project not found');
        }
        const isInvolved = project.customerId === req.user.userId ||
            project.providerId === req.user.userId;
        if (!isInvolved) {
            throw new errors_1.ForbiddenError('You are not involved in this project');
        }
        const messages = await prisma.message.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profileImage: true,
                    },
                },
            },
        });
        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                projectId,
                receiverId: req.user.userId,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
            data: {
                status: client_1.MessageStatus.READ,
                readAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            data: { messages },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjectMessages = getProjectMessages;
/**
 * Mark message as read
 * PUT /api/v1/messages/:id/read
 */
const markAsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const message = await prisma.message.findUnique({
            where: { id },
        });
        if (!message) {
            throw new errors_1.NotFoundError('Message not found');
        }
        if (message.receiverId !== req.user.userId) {
            throw new errors_1.ForbiddenError('You can only mark your own messages as read');
        }
        await prisma.message.update({
            where: { id },
            data: {
                status: client_1.MessageStatus.READ,
                readAt: new Date(),
            },
        });
        res.status(200).json({
            success: true,
            message: 'Message marked as read',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
/**
 * Get unread message count
 * GET /api/v1/messages/unread/count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const count = await prisma.message.count({
            where: {
                receiverId: req.user.userId,
                status: { in: [client_1.MessageStatus.SENT, client_1.MessageStatus.DELIVERED] },
            },
        });
        res.status(200).json({
            success: true,
            data: { unreadCount: count },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * Delete message
 * DELETE /api/v1/messages/:id
 */
const deleteMessage = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errors_1.UnauthorizedError('Not authenticated');
        }
        const { id } = req.params;
        const message = await prisma.message.findUnique({
            where: { id },
        });
        if (!message) {
            throw new errors_1.NotFoundError('Message not found');
        }
        // Only sender can delete (within 5 minutes of sending)
        if (message.senderId !== req.user.userId) {
            throw new errors_1.ForbiddenError('You can only delete your own messages');
        }
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (message.createdAt < fiveMinutesAgo) {
            throw new errors_1.BadRequestError('Messages can only be deleted within 5 minutes of sending');
        }
        await prisma.message.delete({
            where: { id },
        });
        logger_1.default.info(`Message deleted: ${id} by user ${req.user.userId}`);
        res.status(200).json({
            success: true,
            message: 'Message deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMessage = deleteMessage;
