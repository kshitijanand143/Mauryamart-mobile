'use strict';

require('dotenv').config();

const http     = require('http');
const app      = require('./src/app');
const connectDB    = require('./src/config/db');
const initSocket   = require('./src/socket/socketServer');
const { initFirebase } = require('./src/config/firebase');
const logger   = require('./src/config/logger');

const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    // 1. Connect to MongoDB Atlas
    await connectDB();

    // 2. Initialise Firebase Admin (FCM)
    initFirebase();

    // 3. Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // 4. Attach Socket.IO
    initSocket(httpServer, app);

    // 5. Start listening
    httpServer.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`  REST  → http://localhost:${PORT}/api/v1`);
      logger.info(`  WS    → ws://localhost:${PORT}`);
      logger.info(`  Health→ http://localhost:${PORT}/health`);
    });

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.warn(`${signal} received – shutting down gracefully`);
      httpServer.close(async () => {
        try {
          await require('mongoose').connection.close(false);
          logger.info('MongoDB connection closed');
        } catch {}
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit after 15 s if shutdown stalls
      setTimeout(() => {
        logger.error('Forced exit after timeout');
        process.exit(1);
      }, 15_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

// ── Unhandled rejection / exception guards ────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error(err.stack);
  process.exit(1);
});

start();
