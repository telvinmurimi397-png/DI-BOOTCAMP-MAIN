const messagingService = require('../services/messagingService');

function emitToConversation(req, conversation, message) {
  const io = req.app.get('io');
  if (!io) return;
  const room = `conversation:${conversation.id}`;
  const payload = {
    conversationId: conversation.id,
    message,
    participants: [conversation.buyerId, conversation.sellerId]
  };
  io.to(room).emit('message:new', payload);
  io.to(`user:${conversation.buyerId}`)
    .to(`user:${conversation.sellerId}`)
    .emit('conversation:updated', {
      conversationId: conversation.id,
      lastMessage: message.body,
      lastMessageAt: message.createdAt,
      senderId: message.senderId
    });
}

async function listConversations(req, res) {
  const conversations = await messagingService.listConversations(req.user.id);
  res.json({ conversations });
}

async function startConversation(req, res) {
  const conversation = await messagingService.startConversation(req.user.id, req.body.sellerId);
  const io = req.app.get('io');
  if (io) {
    io.in(`user:${req.user.id}`).socketsJoin(`conversation:${conversation.id}`);
    io.in(`user:${conversation.sellerId}`).socketsJoin(`conversation:${conversation.id}`);
  }
  res.status(201).json({ conversation });
}

async function getMessages(req, res) {
  const result = await messagingService.getMessages(req.user.id, req.params.conversationId);
  res.json(result);
}

async function sendMessage(req, res) {
  const { message, conversation } = await messagingService.sendMessage(
    req.user.id,
    req.params.conversationId,
    req.body.body
  );
  emitToConversation(req, conversation, message);
  res.status(201).json({ message });
}

async function unreadCount(req, res) {
  const count = await messagingService.getUnreadCount(req.user.id);
  res.json({ count });
}

module.exports = { listConversations, startConversation, getMessages, sendMessage, unreadCount };
