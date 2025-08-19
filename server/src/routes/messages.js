import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a chat
router.get('/:chatId', requireAuth, async (req, res, next) => {
	try {
		const { chatId } = req.params;
		const { before, limit = 30 } = req.query;
		const chat = await Chat.findById(chatId);
		if (!chat) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.members.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		const filter = { chat: chatId };
		if (before) filter.createdAt = { $lt: new Date(before) };
		const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit)).lean();
		res.json(messages.reverse());
	} catch (e) { next(e); }
});

// Send a message
router.post('/:chatId', requireAuth, async (req, res, next) => {
	try {
		const { chatId } = req.params;
		const { text = '', attachments = [] } = req.body;
		const chat = await Chat.findById(chatId);
		if (!chat) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.members.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		const message = await Message.create({ chat: chatId, sender: req.user.id, text, attachments });
		chat.lastMessageAt = new Date();
		await chat.save();
		const io = req.app.get('io');
		io.to(`chat:${chatId}`).emit('message:new', message);
		res.json(message);
	} catch (e) { next(e); }
});

// React to a message
router.post('/:chatId/:messageId/react', requireAuth, async (req, res, next) => {
	try {
		const { chatId, messageId } = req.params;
		const { emoji } = req.body;
		const chat = await Chat.findById(chatId);
		if (!chat) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.members.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		const message = await Message.findById(messageId);
		if (!message) return res.status(404).json({ error: 'Message not found' });
		message.reactions = message.reactions.filter(r => String(r.user) !== String(req.user.id));
		message.reactions.push({ user: req.user.id, emoji });
		await message.save();
		const io = req.app.get('io');
		io.to(`chat:${chatId}`).emit('message:react', { messageId, userId: req.user.id, emoji });
		res.json(message);
	} catch (e) { next(e); }
});

export default router;
