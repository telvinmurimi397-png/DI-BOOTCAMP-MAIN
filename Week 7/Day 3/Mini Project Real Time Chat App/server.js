const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const ROOMS = ['general', 'random', 'help'];
const users = new Map();
const roomMessages = new Map(ROOMS.map((room) => [room, []]));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

function getRoomUsers(room) {
  return [...users.values()]
    .filter((user) => user.room === room)
    .map(({ username }) => username)
    .sort((first, second) => first.localeCompare(second));
}

function publishMessage(room, message) {
  const history = roomMessages.get(room);
  history.push(message);
  if (history.length > 80) history.shift();
  io.to(room).emit('message:new', message);
}

function publishSystemMessage(room, text) {
  publishMessage(room, {
    id: crypto.randomUUID(),
    type: 'system',
    text,
    timestamp: new Date().toISOString()
  });
}

function publishRoomUsers(room) {
  io.to(room).emit('room:users', getRoomUsers(room));
}

function leaveRoom(socket) {
  const user = users.get(socket.id);
  if (!user) return;

  users.delete(socket.id);
  socket.leave(user.room);
  publishSystemMessage(user.room, `${user.username} left the room`);
  publishRoomUsers(user.room);
}

io.on('connection', (socket) => {
  socket.on('room:join', (payload) => {
    const username = typeof payload?.username === 'string' ? payload.username.trim() : '';
    const room = payload?.room;

    if (!/^[\p{L}\p{N}_ -]{2,20}$/u.test(username)) {
      socket.emit('chat:error', 'Choose a username with 2 to 20 letters, numbers, spaces, _ or -.');
      return;
    }
    if (!ROOMS.includes(room)) {
      socket.emit('chat:error', 'Choose a valid room.');
      return;
    }

    const duplicate = [...users.entries()].some(([socketId, user]) =>
      socketId !== socket.id && user.room === room && user.username.toLocaleLowerCase() === username.toLocaleLowerCase()
    );
    if (duplicate) {
      socket.emit('chat:error', 'That username is already active in this room.');
      return;
    }

    const previousUser = users.get(socket.id);
    if (previousUser?.room === room) {
      users.set(socket.id, { username, room });
      socket.emit('room:joined', { username, room, users: getRoomUsers(room), messages: roomMessages.get(room) });
      publishRoomUsers(room);
      return;
    }

    if (previousUser) leaveRoom(socket);

    users.set(socket.id, { username, room });
    socket.join(room);
    publishSystemMessage(room, `${username} joined the room`);
    socket.emit('room:joined', { username, room, users: getRoomUsers(room), messages: roomMessages.get(room) });
    publishRoomUsers(room);
  });

  socket.on('room:leave', () => {
    leaveRoom(socket);
    socket.emit('room:left');
  });

  socket.on('message:send', (payload) => {
    const user = users.get(socket.id);
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (!user) {
      socket.emit('chat:error', 'Join a room before sending messages.');
      return;
    }
    if (!text || text.length > 800) {
      socket.emit('chat:error', 'Messages must be between 1 and 800 characters.');
      return;
    }

    publishMessage(user.room, {
      id: crypto.randomUUID(),
      type: 'user',
      username: user.username,
      text,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => leaveRoom(socket));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Real-time chat is running at http://localhost:${PORT}`);
  });
}

module.exports = { app, io, server };