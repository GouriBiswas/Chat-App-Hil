import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config.js';
import { connectToDatabase } from './db.js';
import { buildApp } from './app.js';
import { registerSocketHandlers } from './socket/index.js';

async function main() {
  await connectToDatabase(config.mongoUri);

  const app = buildApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: config.clientOrigin,
      credentials: true
    }
  });

  app.set('io', io);
  registerSocketHandlers(io);

  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
