import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, config.jwtSecret);
		req.user = { id: payload.sub };
		return next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

export function signToken(userId) {
	return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: '7d' });
}
