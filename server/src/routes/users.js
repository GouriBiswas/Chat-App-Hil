import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for chat creation)
router.get('/all', requireAuth, async (req, res, next) => {
	try {
		const users = await User.find({ _id: { $ne: req.user.id } }).select('name email avatarUrl').limit(50);
		res.json(users);
	} catch (e) { next(e); }
});

// Search users by name or email
router.get('/search', requireAuth, async (req, res, next) => {
	try {
		const q = (req.query.q || '').toString().trim();
		if (!q) {
			// Return all users except current user if no search query
			const users = await User.find({ _id: { $ne: req.user.id } }).select('name email avatarUrl').limit(20);
			return res.json(users);
		}
		const regex = new RegExp(q, 'i');
		const users = await User.find({ 
			_id: { $ne: req.user.id },
			$or: [{ name: regex }, { email: regex }] 
		}).select('name email avatarUrl').limit(20);
		res.json(users);
	} catch (e) { next(e); }
});

// Get online users
router.get('/online', requireAuth, async (req, res, next) => {
	try {
		const io = req.app.get('io');
		const onlineUserIds = Array.from(io.onlineUsers.keys());
		const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }).select('name email avatarUrl');
		res.json(onlineUsers);
	} catch (e) { next(e); }
});

export default router;
