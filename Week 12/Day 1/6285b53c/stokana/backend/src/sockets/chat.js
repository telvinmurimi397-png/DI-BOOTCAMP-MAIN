const { Server } = require('socket.io');
const db = require('../config/db');
const userService = require('../services/userService');
const messagingService = require('../services/messagingService');

function createChatServer(httpServer, sessionMiddleware) {
  const io = new Server(httpServer, {
    serveClient: true,
    cors: false,
    maxHttpBufferSize: 20_000
  });

  io.engine.use(sessionMiddleware);

  io.use(async (socket, next) => {
    try {
      const session = socket.request.session;
      if (!session || !session.userId) return next(new Error('unauthorized'));
      const user = await userService.findById(session.userId);
      if (!user || !user.isActive) return next(new Error('unauthorized'));
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    socket.join(`user:${user.id}`);

    try {
      const { rows } = await db.query(
        'SELECT id FROM conversations WHERE buyer_id = $1 OR seller_id = $1',
        [user.id]
      );
      for (const row of rows) socket.join(`conversation:${row.id}`);
    } catch (error) {
      console.error('[socket] failed to load conversations:', error.message);
    }

    const canAccess = (conversationId) =>
      Number.isInteger(conversationId) && socket.rooms.has(`conversation:${conversationId}`);

    socket.on('typing:start', (payload) => {
      const conversationId = Number(payload?.conversationId);
      if (!canAccess(conversationId)) return;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: user.id,
        name: user.fullName
      });
    });

    socket.on('typing:stop', (payload) => {
      const conversationId = Number(payload?.conversationId);
      if (!canAccess(conversationId)) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: user.id
      });
    });

    socket.on('conversation:read', async (payload) => {
      const conversationId = Number(payload?.conversationId);
      if (!canAccess(conversationId)) return;
      try {
        await db.query(
          `UPDATE messages SET read_at = now()
           WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL`,
          [conversationId, user.id]
        );
        socket.emit('conversation:read:ack', { conversationId });
      } catch (error) {
        console.error('[socket] read receipt failed:', error.message);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

module.exports = createChatServer;
