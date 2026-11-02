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
    const userRoom = `user:${user.id}`;
    const wasOnline = (await io.in(userRoom).fetchSockets()).length > 0;
    socket.join(userRoom);

    try {
      const { rows } = await db.query(
        `SELECT id, buyer_id AS "buyerId", seller_id AS "sellerId"
         FROM conversations WHERE buyer_id = $1 OR seller_id = $1`,
        [user.id]
      );
      for (const row of rows) {
        const room = `conversation:${row.id}`;
        socket.join(room);
        if (!wasOnline) {
          io.to(room).emit('presence:changed', { userId: user.id, online: true });
        }
      }
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

    socket.on('disconnecting', async () => {
      const conversationRooms = [...socket.rooms].filter((room) => room.startsWith('conversation:'));
      try {
        const sockets = await io.in(userRoom).fetchSockets();
        if (sockets.length > 1) return;
        for (const room of conversationRooms) io.to(room).emit('presence:changed', { userId: user.id, online: false });
      } catch (error) {
        console.error('[socket] presence update failed:', error.message);
      }
    });
  });

  return io;
}

module.exports = createChatServer;
