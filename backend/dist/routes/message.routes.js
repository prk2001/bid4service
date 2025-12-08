"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All message routes require authentication
router.use(auth_1.authenticate);
// Send message
router.post('/', message_controller_1.sendMessage);
// Get all conversations
router.get('/conversations', message_controller_1.getConversations);
// Get unread count
router.get('/unread/count', message_controller_1.getUnreadCount);
// Get messages for a project
router.get('/project/:projectId', message_controller_1.getProjectMessages);
// Get messages with specific user
router.get('/:userId', message_controller_1.getMessagesWithUser);
// Mark message as read
router.put('/:id/read', message_controller_1.markAsRead);
// Delete message
router.delete('/:id', message_controller_1.deleteMessage);
exports.default = router;
