import { Router } from 'express';
import {
  sendMessage,
  getConversations,
  getMessagesWithUser,
  getProjectMessages,
  markAsRead,
  getUnreadCount,
  deleteMessage,
} from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Send message
router.post('/', sendMessage);

// Get all conversations
router.get('/conversations', getConversations);

// Get unread count
router.get('/unread/count', getUnreadCount);

// Get messages for a project
router.get('/project/:projectId', getProjectMessages);

// Get messages with specific user
router.get('/:userId', getMessagesWithUser);

// Mark message as read
router.put('/:id/read', markAsRead);

// Delete message
router.delete('/:id', deleteMessage);

export default router;
