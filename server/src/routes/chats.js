import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// List chats for current user
router.get('/', requireAuth, async (req, res, next) => {
	try {
		const chats = await Chat.find({ members: req.user.id }).sort({ lastMessageAt: -1 });
		res.json(chats);
	} catch (e) { next(e); }
});

// Create or get 1:1 chat
router.post('/dm', requireAuth, async (req, res, next) => {
	try {
		const { userId } = req.body;
		if (!userId) return res.status(400).json({ error: 'userId required' });
		let chat = await Chat.findOne({ isGroup: false, members: { $all: [req.user.id, userId], $size: 2 } });
		if (!chat) {
			chat = await Chat.create({ isGroup: false, members: [req.user.id, userId] });
		}
		res.json(chat);
	} catch (e) { next(e); }
});

// Create group chat
router.post('/group', requireAuth, async (req, res, next) => {
	try {
		const { name, memberIds } = req.body;
		if (!name || !Array.isArray(memberIds) || memberIds.length < 1) {
			return res.status(400).json({ error: 'Invalid group params' });
		}
		const uniqueMembers = Array.from(new Set([req.user.id, ...memberIds]));
		const chat = await Chat.create({ isGroup: true, name, members: uniqueMembers, admins: [req.user.id] });
		res.json(chat);
	} catch (e) { next(e); }
});

// Add member to group (admin only)
router.post('/:chatId/members', requireAuth, async (req, res, next) => {
	try {
		const { chatId } = req.params;
		const { userId } = req.body;
		const chat = await Chat.findById(chatId);
		if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.admins.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		if (!chat.members.map(String).includes(userId)) chat.members.push(userId);
		await chat.save();
		res.json(chat);
	} catch (e) { next(e); }
});

// Remove member from group (admin only)
router.delete('/:chatId/members/:userId', requireAuth, async (req, res, next) => {
	try {
		const { chatId, userId } = req.params;
		const chat = await Chat.findById(chatId);
		if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.admins.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		chat.members = chat.members.filter((m) => String(m) !== String(userId));
		chat.admins = chat.admins.filter((m) => String(m) !== String(userId));
		await chat.save();
		res.json(chat);
	} catch (e) { next(e); }
});

// Assign or remove admin
router.post('/:chatId/admins', requireAuth, async (req, res, next) => {
	try {
		const { chatId } = req.params;
		const { userId, action } = req.body; // action: 'add' | 'remove'
		const chat = await Chat.findById(chatId);
		if (!chat || !chat.isGroup) return res.status(404).json({ error: 'Chat not found' });
		if (!chat.admins.map(String).includes(req.user.id)) return res.status(403).json({ error: 'Forbidden' });
		if (action === 'add' && !chat.admins.map(String).includes(userId)) chat.admins.push(userId);
		if (action === 'remove') chat.admins = chat.admins.filter((m) => String(m) !== String(userId));
		await chat.save();
		res.json(chat);
	} catch (e) { next(e); }
});

export default router;
