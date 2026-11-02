const messagingService = require('../services/messagingService');
const imageService = require('../services/imageService');
const { badRequest } = require('../utils/errors');

function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

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
  const io = req.app.get('io');
  for (const conversation of conversations) {
    conversation.isOnline = Boolean(io?.sockets.adapter.rooms.has(`user:${conversation.otherUserId}`));
  }
  res.json({ conversations });
}

async function startConversation(req, res) {
  const conversation = await messagingService.startConversation(req.user.id, req.body);
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
  let attachmentUrl = null;
  let attachmentMime = null;
  if (req.file) {
    await messagingService.assertCanMessage(req.user.id, req.params.conversationId);
    attachmentMime = detectImageMime(req.file.buffer);
    if (!attachmentMime || attachmentMime !== req.file.mimetype) {
      throw badRequest('The uploaded image content does not match its file type.');
    }
    const uploaded = await imageService.uploadChatImage({ ...req.file, mimetype: attachmentMime });
    attachmentUrl = uploaded.url;
  }
  const { message, conversation } = await messagingService.sendMessage(
    req.user.id,
    req.params.conversationId,
    { body: req.body.body || '', attachmentUrl, attachmentMime }
  );
  emitToConversation(req, conversation, message);
  res.status(201).json({ message });
}

async function setBlock(req, res) {
  const result = await messagingService.setBlock(req.user.id, req.params.conversationId, req.body.blocked);
  const io = req.app.get('io');
  io?.to(`conversation:${result.conversationId}`).emit('conversation:block-changed', {
    userId: req.user.id,
    blocked: result.blocked
  });
  res.json({
    message: result.blocked ? 'This participant has been blocked.' : 'This participant has been unblocked.',
    ...result
  });
}

async function reportConversation(req, res) {
  const report = await messagingService.reportConversation(
    req.user.id,
    req.params.conversationId,
    req.body.reason
  );
  res.status(201).json({ message: 'Conversation report submitted for review.', report });
}

async function messageReports(req, res) {
  res.json(await messagingService.listReports(req.query));
}

async function reviewMessageReport(req, res) {
  const report = await messagingService.reviewReport(
    req.user.id,
    req.params.reportId,
    req.body.status
  );
  res.json({ message: 'Conversation report updated.', report });
}

async function unreadCount(req, res) {
  const count = await messagingService.getUnreadCount(req.user.id);
  res.json({ count });
}

module.exports = {
  listConversations,
  startConversation,
  getMessages,
  sendMessage,
  unreadCount,
  setBlock,
  reportConversation,
  messageReports,
  reviewMessageReport
};
