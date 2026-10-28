import { api } from './api.js';
import { icon } from './icons.js';
import { avatar, toast, errorMessage } from './ui.js';
import { escapeHtml, chatTime, formatDate, truncate } from './format.js';

function clockTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const start = (entry) => new Date(entry.getFullYear(), entry.getMonth(), entry.getDate()).getTime();
  const diff = Math.round((start(today) - start(date)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return formatDate(value, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function mountChat(container, { user, role = 'buyer' }) {
  const isSeller = role === 'seller';
  const state = {
    conversations: [],
    activeId: null,
    active: null,
    messages: [],
    openToken: 0,
    loading: false,
    sending: false
  };
  let socket = null;
  let typingStopTimer = null;
  let typingHideTimer = null;

  container.innerHTML = `
    <div class="chat-shell chat-page" data-chat-shell>
      <section class="chat-list" aria-label="Conversations">
        <div class="chat-list-head">
          <h2>Messages</h2>
          <div class="input-group">
            <span class="input-icon">${icon('search', { size: 16 })}</span>
            <input class="input" type="search" placeholder="Search conversations" aria-label="Search conversations" data-chat-search>
          </div>
        </div>
        <div class="chat-list-items" data-chat-list></div>
      </section>
      <section class="chat-panel" data-chat-panel>
        ${panelPlaceholder()}
      </section>
    </div>`;

  const shell = container.querySelector('[data-chat-shell]');
  const listHost = container.querySelector('[data-chat-list]');
  const panel = container.querySelector('[data-chat-panel]');
  const search = container.querySelector('[data-chat-search]');

  function panelPlaceholder() {
    return `<div class="chat-empty">
      <div class="empty-icon">${icon('message', { size: 25 })}</div>
      <strong>Pick a conversation</strong>
      <p>Message a shop from any product page to ask about an item, delivery or order.</p>
      <a class="btn btn-secondary btn-sm" href="/explore">Browse products</a>
    </div>`;
  }

  function conversationAvatar(conversation) {
    return avatar(conversation.title || 'Shop', {
      image: conversation.avatarUrl || null
    });
  }

  function lastMessageText(conversation) {
    if (!conversation.lastMessage) return 'No messages yet';
    const prefix = conversation.lastMessageSenderId === user.id ? 'You: ' : '';
    return `${prefix}${conversation.lastMessage}`;
  }

  function renderList() {
    if (!state.conversations.length) {
      listHost.innerHTML = `<div class="table-empty" style="padding:34px 20px;display:grid;gap:10px;justify-items:center">
        <div class="empty-icon" style="margin-bottom:0">${icon('message', { size: 23 })}</div>
        <strong style="color:var(--ink);font-size:13px">No conversations yet</strong>
        <p style="font-size:11.5px;line-height:1.5;max-width:220px">${
          isSeller
            ? 'Buyers who have questions about your products will appear here.'
            : 'Ask a shop about a product and your chat will appear here.'
        }</p>
        ${
          isSeller
            ? '<a class="btn btn-secondary btn-sm" href="/seller/products">Manage products</a>'
            : '<a class="btn btn-secondary btn-sm" href="/explore">Browse products</a>'
        }
      </div>`;
      return;
    }

    const term = search.value.trim().toLowerCase();
    const filtered = state.conversations.filter((conversation) =>
      `${conversation.title || ''} ${conversation.subtitle || ''} ${conversation.lastMessage || ''}`
        .toLowerCase()
        .includes(term)
    );

    if (!filtered.length) {
      listHost.innerHTML = `<div class="table-empty">No conversations match “${escapeHtml(term)}”.</div>`;
      return;
    }

    listHost.innerHTML = filtered
      .map(
        (conversation) => `<button class="chat-conv${conversation.id === state.activeId ? ' active' : ''}" type="button" data-conv-id="${
          conversation.id
        }">
          ${conversationAvatar(conversation)}
          <div class="grow">
            <strong>${escapeHtml(conversation.title || 'Conversation')}</strong>
            <p>${escapeHtml(truncate(lastMessageText(conversation), 64))}</p>
          </div>
          <div class="chat-meta">
            <time>${conversation.lastMessageCreatedAt ? chatTime(conversation.lastMessageCreatedAt) : ''}</time>
            ${
              Number(conversation.unreadCount) > 0
                ? `<span class="unread-dot">${conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>`
                : ''
            }
          </div>
        </button>`
      )
      .join('');
  }

  function updateUnreadBadges() {
    const total = state.conversations.reduce(
      (sum, conversation) => sum + (Number(conversation.unreadCount) || 0),
      0
    );
    document
      .querySelectorAll('[data-account-unread], [data-nav-badge="messages"], [data-nav-badge-top], [data-unread-count]')
      .forEach((badge) => {
        badge.textContent = String(total);
        badge.classList.toggle('hidden', total === 0);
      });
  }

  function sortConversations() {
    state.conversations.sort((a, b) => {
      const aTime = new Date(a.lastMessageCreatedAt || a.lastMessageAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.lastMessageCreatedAt || b.lastMessageAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  async function loadConversations() {
    try {
      const data = await api.get('/messages/conversations');
      state.conversations = data.conversations || [];
      sortConversations();
      renderList();
      updateUnreadBadges();
    } catch (error) {
      listHost.innerHTML = `<div class="table-empty" style="display:grid;gap:10px;justify-items:center">
        <p>${escapeHtml(errorMessage(error))}</p>
        <button class="btn btn-secondary btn-sm" type="button" data-chat-retry>Try again</button>
      </div>`;
      listHost.querySelector('[data-chat-retry]')?.addEventListener('click', loadConversations);
    }
  }

  function updateConversationPreview(message, { incrementUnread = false } = {}) {
    const conversation = state.conversations.find((entry) => entry.id === Number(message.conversationId));
    if (!conversation) {
      loadConversations();
      return;
    }
    conversation.lastMessage = message.body;
    conversation.lastMessageSenderId = message.senderId;
    conversation.lastMessageCreatedAt = message.createdAt;
    conversation.lastMessageAt = message.createdAt;
    if (incrementUnread) {
      conversation.unreadCount = (Number(conversation.unreadCount) || 0) + 1;
    }
    sortConversations();
    renderList();
    updateUnreadBadges();
  }

  function messageHtml(message) {
    const mine = message.senderId === user.id;
    return `<div class="msg${mine ? ' mine' : ''}" data-message-id="${message.id}">
      <div class="msg-bubble">${escapeHtml(message.body)}</div>
      <span class="msg-time">${clockTime(message.createdAt)}</span>
    </div>`;
  }

  function isNearBottom(host) {
    return host.scrollHeight - host.scrollTop - host.clientHeight < 90;
  }

  function scrollToBottom() {
    const host = panel.querySelector('[data-chat-messages]');
    if (host) host.scrollTop = host.scrollHeight;
  }

  function renderMessages() {
    const host = panel.querySelector('[data-chat-messages]');
    if (!host) return;
    let lastDay = '';
    host.innerHTML = state.messages
      .map((message) => {
        const key = dayKey(message.createdAt);
        const separator =
          key !== lastDay ? `<div class="chat-date-sep">${escapeHtml(dayLabel(message.createdAt))}</div>` : '';
        lastDay = key;
        return `${separator}${messageHtml(message)}`;
      })
      .join('');
    scrollToBottom();
  }

  function appendMessage(message) {
    if (state.messages.some((entry) => entry.id === message.id)) return;
    const host = panel.querySelector('[data-chat-messages]');
    if (!host) return;
    const nearBottom = isNearBottom(host);
    const previous = state.messages[state.messages.length - 1];
    const separator =
      !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
        ? `<div class="chat-date-sep">${escapeHtml(dayLabel(message.createdAt))}</div>`
        : '';
    host.insertAdjacentHTML('beforeend', `${separator}${messageHtml(message)}`);
    state.messages.push(message);
    if (nearBottom || message.senderId === user.id) scrollToBottom();
  }

  function showTyping(name) {
    const host = panel.querySelector('[data-chat-messages]');
    if (!host) return;
    clearTimeout(typingHideTimer);
    let typing = host.querySelector('[data-typing]');
    if (!typing) {
      typing = document.createElement('div');
      typing.className = 'msg';
      typing.dataset.typing = 'true';
      typing.innerHTML = `<div class="typing" aria-label="${escapeHtml(name || 'Someone')} is typing"><span></span><span></span><span></span></div>`;
      host.appendChild(typing);
      scrollToBottom();
    }
    const status = panel.querySelector('[data-chat-status]');
    if (status) status.textContent = 'typing…';
    typingHideTimer = setTimeout(hideTyping, 5000);
  }

  function hideTyping() {
    clearTimeout(typingHideTimer);
    panel.querySelector('[data-typing]')?.remove();
    const status = panel.querySelector('[data-chat-status]');
    if (status && state.active) status.textContent = state.active.subtitle || '';
  }

  function emitTyping() {
    if (!socket || !state.activeId) return;
    socket.emit('typing:start', { conversationId: state.activeId });
    clearTimeout(typingStopTimer);
    typingStopTimer = setTimeout(() => {
      socket?.emit('typing:stop', { conversationId: state.activeId });
    }, 1200);
  }

  function syncConversationUrl(conversationId) {
    const url = new URL(window.location.href);
    if (conversationId) url.searchParams.set('conversation', String(conversationId));
    else url.searchParams.delete('conversation');
    window.history.replaceState({}, '', url);
  }

  function renderPanel() {
    const conversation = state.active;
    if (!conversation) {
      panel.innerHTML = panelPlaceholder();
      return;
    }

    panel.innerHTML = `
      <div class="chat-panel-head">
        <button class="icon-btn chat-back" type="button" data-chat-back aria-label="Back to conversations">
          Back
        </button>
        ${conversationAvatar(conversation)}
        <div class="grow">
          <strong>${escapeHtml(conversation.title || 'Conversation')}</strong>
          <span data-chat-status>${escapeHtml(conversation.subtitle || '')}</span>
        </div>
        ${
          !isSeller && conversation.shopSlug
            ? `<a class="icon-btn" href="/shop/${encodeURIComponent(
                conversation.shopSlug
              )}" aria-label="Visit shop" title="Visit shop">${icon('store', { size: 18 })}</a>`
            : ''
        }
      </div>
      <div class="chat-messages" data-chat-messages></div>
      <div class="chat-composer">
        <textarea rows="1" maxlength="4000" placeholder="Write a message…" aria-label="Message" data-chat-input></textarea>
        <button class="btn btn-primary btn-icon" type="button" data-chat-send aria-label="Send message">${icon(
          'send',
          { size: 18 }
        )}</button>
      </div>`;

    renderMessages();
    bindComposer();
  }

  function bindComposer() {
    const input = panel.querySelector('[data-chat-input]');
    const send = panel.querySelector('[data-chat-send]');
    if (!input || !send) return;

    const grow = () => {
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
    };

    input.addEventListener('input', () => {
      grow();
      if (input.value.trim()) emitTyping();
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
    send.addEventListener('click', sendMessage);
    input.focus({ preventScroll: true });
    grow();
  }

  async function sendMessage() {
    if (state.sending || !state.activeId) return;
    const input = panel.querySelector('[data-chat-input]');
    const send = panel.querySelector('[data-chat-send]');
    const body = input?.value.trim();
    if (!body) {
      input?.focus();
      return;
    }

    state.sending = true;
    if (send) {
      send.disabled = true;
      send.classList.add('is-loading');
    }

    try {
      const data = await api.post(`/messages/conversations/${state.activeId}/messages`, { body });
      if (input) {
        input.value = '';
        input.style.height = 'auto';
        input.focus();
      }
      appendMessage(data.message);
      updateConversationPreview(data.message);
      socket?.emit('typing:stop', { conversationId: state.activeId });
      clearTimeout(typingStopTimer);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      state.sending = false;
      if (send) {
        send.disabled = false;
        send.classList.remove('is-loading');
      }
    }
  }

  async function openConversation(conversationId, { updateUrl = true } = {}) {
    const id = Number(conversationId);
    if (!Number.isInteger(id) || id <= 0) return;

    state.activeId = id;
    shell.classList.add('thread-open');
    if (updateUrl) syncConversationUrl(id);
    renderList();
    hideTyping();

    const token = ++state.openToken;
    panel.innerHTML = `<div class="chat-empty"><span class="spinner dark lg"></span><span style="display:block;margin-top:10px">Loading conversation…</span></div>`;

    try {
      const data = await api.get(`/messages/conversations/${id}`);
      if (token !== state.openToken) return;

      state.active = data.conversation;
      state.messages = data.messages || [];
      state.active.unreadCount = 0;

      const conversation = state.conversations.find((entry) => entry.id === id);
      if (conversation) {
        conversation.unreadCount = 0;
        conversation.title = state.active.title || conversation.title;
        conversation.subtitle = state.active.subtitle || conversation.subtitle;
        conversation.avatarUrl = state.active.avatarUrl || conversation.avatarUrl;
        conversation.shopSlug = state.active.shopSlug || conversation.shopSlug;
      }
      renderList();
      updateUnreadBadges();
      renderPanel();
      socket?.emit('conversation:read', { conversationId: id });
    } catch (error) {
      if (token !== state.openToken) return;
      panel.innerHTML = `<div class="chat-empty">
        <div class="empty-icon">${icon('alert-circle', { size: 24 })}</div>
        <strong>Could not open this chat</strong>
        <p>${escapeHtml(errorMessage(error))}</p>
        <button class="btn btn-secondary btn-sm" type="button" data-chat-reopen>Try again</button>
      </div>`;
      panel.querySelector('[data-chat-reopen]')?.addEventListener('click', () => openConversation(id, { updateUrl: false }));
      if (error?.status === 404) {
        loadConversations();
      }
    }
  }

  listHost.addEventListener('click', (event) => {
    const button = event.target.closest('[data-conv-id]');
    if (button) openConversation(button.dataset.convId);
  });

  search.addEventListener('input', renderList);

  panel.addEventListener('click', (event) => {
    const back = event.target.closest('[data-chat-back]');
    if (!back) return;
    shell.classList.remove('thread-open');
    syncConversationUrl(null);
    renderList();
  });

  function connectSocket() {
    if (typeof window.io !== 'function') return;
    socket = window.io();

    socket.on('message:new', ({ conversationId, message }) => {
      if (!message) return;
      const mine = message.senderId === user.id;
      const isActive = Number(conversationId) === Number(state.activeId);
      if (isActive) hideTyping();
      updateConversationPreview(message, { incrementUnread: !isActive && !mine });
      if (isActive) {
        appendMessage(message);
        if (!mine) socket?.emit('conversation:read', { conversationId });
      }
    });

    socket.on('conversation:updated', ({ conversationId }) => {
      if (!state.conversations.some((conversation) => conversation.id === Number(conversationId))) {
        loadConversations();
      }
    });

    socket.on('typing:start', ({ conversationId, userId, name }) => {
      if (Number(conversationId) === Number(state.activeId) && userId !== user.id) {
        showTyping(name);
      }
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (Number(conversationId) === Number(state.activeId)) hideTyping();
    });
  }

  connectSocket();
  loadConversations().then(() => {
    const requested = Number(new URLSearchParams(window.location.search).get('conversation'));
    if (Number.isInteger(requested) && requested > 0) {
      openConversation(requested, { updateUrl: false });
    }
  });

  return {
    refresh: loadConversations,
    destroy() {
      socket?.disconnect();
      socket = null;
      clearTimeout(typingStopTimer);
      clearTimeout(typingHideTimer);
    }
  };
}
