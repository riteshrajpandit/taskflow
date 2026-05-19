import 'dotenv/config';
import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { setupWebSockets } from './lib/socket';
import { apiRouter } from './lib/api';
import { db, prisma } from './lib/db';
import { initTimerWorker, closeTimerWorker } from './lib/queue';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Prisma and timer worker
db.init()
  .then(() => {
    console.log("Database initialized");
    initTimerWorker();
  })
  .catch(err => {
    console.error("Failed to init database:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await closeTimerWorker();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await closeTimerWorker();
  await prisma.$disconnect();
  process.exit(0);
});

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  
  // Attach Socket.io
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });

  // Setup our socket handlers
  setupWebSockets(io);

  // Parse JSON body for our custom express routes if any (Next handles its own)
  expressApp.use(express.json());

  // Mount API router
  expressApp.use('/api', apiRouter);

  // Handle all other Next.js routes
  expressApp.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("> Error booting server", err);
  process.exit(1);
});
