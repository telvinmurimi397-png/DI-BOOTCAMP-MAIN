const socket = io();
const joinView = document.querySelector('#join-view');
const chatApp = document.querySelector('#chat-app');
const joinForm = document.querySelector('#join-form');
const usernameInput = document.querySelector('#username');
const roomSelect = document.querySelector('#room-select');
const joinError = document.querySelector('#join-error');
const messageForm = document.querySelector('#message-form');
const messageInput = document.querySelector('#message-input');
const messageList = document.querySelector('#message-list');
const userList = document.querySelector('#user-list');
const userCount = document.querySelector('#user-count');
const toast = document.querySelector('#toast');
const roomNames = ['general', 'random', 'help'];
let currentUsername = '';
let currentRoom = '';
let toastTimeout;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function showChatError(message) {
  joinError.textContent = message;
  showToast(message);
}

function appendMessage(message) {
  if (message.type === 'system') {
    const systemLine = document.createElement('p');
    systemLine.className = 'system-message';
    systemLine.textContent = message.text;
    messageList.append(systemLine);
  } else {
    const messageElement = document.createElement('article');
    messageElement.className = 'message';

    const avatar = document.createElement('span');
    avatar.className = 'avatar';
    avatar.textContent = message.username.slice(0, 1).toUpperCase();

    const content = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const name = document.createElement('span');
    name.className = 'message-name';
    name.textContent = message.username;

    const time = document.createElement('time');
    time.className = 'message-time';
    time.dateTime = message.timestamp;
    time.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(message.timestamp));

    const text = document.createElement('p');
    text.className = 'message-text';
    text.textContent = message.text;

    meta.append(name, time);
    content.append(meta, text);
    messageElement.append(avatar, content);
    messageList.append(messageElement);
  }

  messageList.scrollTop = messageList.scrollHeight;
}

function renderMessages(messages) {
  messageList.replaceChildren();
  if (!messages.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-icon" aria-hidden="true">✳</span><h2>It starts with a hello.</h2><p>No messages here yet. Break the quiet and start a conversation with the room.</p>';
    messageList.append(empty);
    return;
  }
  messages.forEach(appendMessage);
}

function renderUsers(users) {
  userCount.textContent = String(users.length);
  userList.replaceChildren();

  users.forEach((username) => {
    const person = document.createElement('div');
    person.className = 'person';
    const avatar = document.createElement('span');
    avatar.className = 'person-avatar';
    avatar.textContent = username.slice(0, 1).toUpperCase();
    const name = document.createElement('span');
    name.textContent = username;
    const online = document.createElement('span');
    online.className = 'online-dot';
    online.setAttribute('aria-label', 'online');
    person.append(avatar, name, online);
    userList.append(person);
  });
}

function joinRoom(room) {
  currentRoom = room;
  joinError.textContent = '';
  socket.emit('room:join', { username: currentUsername, room });
}

joinForm.addEventListener('submit', (event) => {
  event.preventDefault();
  currentUsername = usernameInput.value.trim();
  joinRoom(roomSelect.value);
});

document.querySelector('#room-list').addEventListener('click', (event) => {
  const roomButton = event.target.closest('[data-room]');
  if (!roomButton || roomButton.dataset.room === currentRoom) return;
  joinRoom(roomButton.dataset.room);
});

document.querySelector('#leave-button').addEventListener('click', () => socket.emit('room:leave'));

messageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('message:send', { text });
  messageInput.value = '';
  messageInput.focus();
});

socket.on('room:joined', ({ username, room, users, messages }) => {
  currentUsername = username;
  currentRoom = room;
  joinView.hidden = true;
  chatApp.hidden = false;
  document.querySelector('#current-room').textContent = room;
  document.querySelector('#header-user').textContent = username;
  document.querySelectorAll('.room-link').forEach((button) => {
    button.classList.toggle('active', button.dataset.room === room);
    if (button.dataset.room === room) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  renderMessages(messages);
  renderUsers(users);
  messageInput.focus();

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

socket.on('room:users', renderUsers);
socket.on('message:new', (message) => {
  if (messageList.querySelector('.empty-state')) messageList.replaceChildren();
  appendMessage(message);

  if (message.type === 'user' && message.username !== currentUsername) {
    showToast(`${message.username}: ${message.text}`);
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`# ${currentRoom}`, { body: `${message.username}: ${message.text}` });
    }
  }
});

socket.on('chat:error', showChatError);
socket.on('room:left', () => {
  currentRoom = '';
  chatApp.hidden = true;
  joinView.hidden = false;
  joinError.textContent = '';
  usernameInput.focus();
});
socket.on('connect', () => document.querySelector('#connection-label').textContent = 'Connected');
socket.on('disconnect', () => {
  document.querySelector('#connection-label').textContent = 'Reconnecting...';
  showToast('Connection lost. Reconnecting...');
});