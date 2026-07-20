const { Server }  = require('socket.io');
const logger      = require('../config/logger');
const { verifyAccessToken } = require('../utils/helpers');
const DeliveryBoy = require('../modules/deliveryBoy/deliveryBoy.model');

/**
 * Initialise Socket.IO on the HTTP server.
 * Returns the io instance which is also stored on app via app.set('io', io).
 */
const initSocket = (httpServer, app) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports:         ['websocket'],
    pingTimeout:        60_000,
    pingInterval:       25_000,
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  // ── Auth middleware ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded   = verifyAccessToken(token);
      socket.userId   = String(decoded.id);
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ──────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { userId, userRole } = socket;
    logger.debug(`Socket connected: ${socket.id} | user: ${userId} | role: ${userRole}`);

    // Each user automatically joins a personal room for targeted pushes
    socket.join(`user:${userId}`);

    // Vendor joins their vendor room to receive new-order notifications
    if (userRole === 'vendor') {
      // Look up vendorId async – fire and forget
      require('../modules/vendor/vendor.model')
        .findOne({ userId })
        .lean()
        .then((v) => { if (v) socket.join(`vendor:${v._id}`); })
        .catch(() => {});
    }

    // Rider joins their own rider room
    if (userRole === 'delivery_boy') {
      DeliveryBoy.findOne({ userId }).lean()
        .then((r) => { if (r) socket.join(`rider:${r._id}`); })
        .catch(() => {});
    }

    // ── Client joins order tracking room ────────────────────────────────────
    socket.on('join:order', (orderId) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
      logger.debug(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('leave:order', (orderId) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    // ── Rider pushes GPS location ─────────────────────────────────────────────
    socket.on('rider:location', async ({ orderId, coords }) => {
      if (!orderId || !coords?.lat || !coords?.lng) return;
      if (userRole !== 'delivery_boy') return;

      // Persist location to DeliveryBoy document
      DeliveryBoy.findOneAndUpdate(
        { userId },
        {
          'currentLocation.coordinates': [coords.lng, coords.lat],
          'currentLocation.updatedAt':   new Date(),
        }
      ).catch(() => {});

      // Broadcast to everyone tracking this order
      io.to(`order:${orderId}`).emit('rider:location', { coords, timestamp: Date.now() });
    });

    // ── Customer joins their own room (for order push) ────────────────────────
    socket.on('customer:join', () => {
      socket.join(`customer:${userId}`);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} | reason: ${reason}`);

      // Mark rider offline on unexpected disconnect
      if (userRole === 'delivery_boy') {
        DeliveryBoy.findOneAndUpdate({ userId }, { isOnline: false }).catch(() => {});
      }
    });

    socket.on('error', (err) => {
      logger.warn(`Socket error: ${err.message}`);
    });
  });

  // Attach io to app so routes can emit events via req.app.get('io')
  app.set('io', io);

  logger.info('✓ Socket.IO initialised');
  return io;
};

module.exports = initSocket;
