import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    getUserChats,
    initializeChat,
    getChatById,
    getChatMessages,
    sendMessage,
    markMessagesAsRead,
    deleteChat
} from '../controllers/chat.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Chat routes
router.get('/chats', getUserChats);
router.post('/initialize', initializeChat);
router.get('/chats/:chatId', getChatById);
router.get('/chats/:chatId/messages', getChatMessages);
router.post('/chats/:chatId/messages', sendMessage);
router.patch('/chats/:chatId/read', markMessagesAsRead);
router.delete('/chats/:chatId', deleteChat);

export default router;
