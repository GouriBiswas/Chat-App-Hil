import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import chatsRouter from './routes/chats.js';
import messagesRouter from './routes/messages.js';
import uploadsRouter from './routes/uploads.js';
import searchRouter from './routes/search.js';
import requestsRouter from './routes/requests.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildApp() {
	const app = express();

	app.use(cors({ origin: config.clientOrigin, credentials: true }));
	app.use(express.json({ limit: '10mb' }));
	app.use(express.urlencoded({ extended: true }));

	if (config.storageDriver === 'local') {
		app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
	}

	app.get('/', (req, res) => {
		res.json({ status: 'ok', service: 'hitachi-chatapp' });
	});

	app.use('/api/auth', authRouter);
	app.use('/api/users', usersRouter);
	app.use('/api/chats', chatsRouter);
	app.use('/api/messages', messagesRouter);
	app.use('/api/uploads', uploadsRouter);
	app.use('/api/search', searchRouter);
	app.use('/api/requests', requestsRouter);

	app.use((err, req, res, next) => {
		console.error(err);
		res.status(err.status || 500).json({ error: err.message || 'Server error' });
	});

	return app;
}
