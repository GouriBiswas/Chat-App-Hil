import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
	try {
		const { name, email, password } = req.body;
		if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email already in use' });
		const passwordHash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, passwordHash });
		const token = signToken(user.id);
		res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio } });
	} catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = signToken(user.id);
		res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio } });
	} catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id);
		res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio });
	} catch (e) { next(e); }
});

router.put('/me', requireAuth, async (req, res, next) => {
	try {
		const { name, bio, avatarUrl } = req.body;
		const user = await User.findByIdAndUpdate(
			req.user.id,
			{ $set: { name, bio, avatarUrl } },
			{ new: true }
		);
		res.json({ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, bio: user.bio });
	} catch (e) { next(e); }
});

export default router;
