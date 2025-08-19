import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
	try {
		const q = (req.query.q || '').toString().trim();
		if (!q) return res.json({ chats: [], messages: [] });
		const regex = new RegExp(q, 'i');
		const chats = await Chat.find({
			$and: [
				{ members: req.user.id },
				{ $or: [{ name: regex }, { isGroup: false }] }
			]
		}).limit(20);
		const messages = await Message.find({ chat: { $in: chats.map(c => c._id) }, text: regex }).limit(50);
		res.json({ chats, messages });
	} catch (e) { next(e); }
});

export default router;
