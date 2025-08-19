import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function registerSocketHandlers(io) {
	// Store online users
	const onlineUsers = new Map();

	io.use((socket, next) => {
		const token = socket.handshake.auth.token;
		if (!token) {
			return next(new Error('Authentication error'));
		}
		
		try {
			const payload = jwt.verify(token, config.jwtSecret);
			socket.userId = payload.sub;
			next();
		} catch (err) {
			next(new Error('Authentication error'));
		}
	});

	io.on('connection', (socket) => {
		console.log(`User ${socket.userId} connected`);
		onlineUsers.set(socket.userId, socket.id);

		// Broadcast user online status
		socket.broadcast.emit('user:online', { userId: socket.userId });

		// Join chat room
		socket.on('chat:join', ({ chatId }) => {
			socket.join(`chat:${chatId}`);
			console.log(`User ${socket.userId} joined chat ${chatId}`);
		});

		// Leave chat room
		socket.on('chat:leave', ({ chatId }) => {
			socket.leave(`chat:${chatId}`);
			console.log(`User ${socket.userId} left chat ${chatId}`);
		});

		// Relay typing indicators
		socket.on('chat:typing', ({ chatId, userId, typing }) => {
			socket.to(`chat:${chatId}`).emit('chat:typing', { chatId, userId, typing });
		});

		// Handle disconnection
		socket.on('disconnect', () => {
			console.log(`User ${socket.userId} disconnected`);
			onlineUsers.delete(socket.userId);
			socket.broadcast.emit('user:offline', { userId: socket.userId });
		});
	});

	// Make onlineUsers available to routes
	io.onlineUsers = onlineUsers;
}
