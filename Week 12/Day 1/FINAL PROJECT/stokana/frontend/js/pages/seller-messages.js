import { initDashboard } from '../dashboard.js';
import { mountChat } from '../chat.js';

async function init() {
  const dashboard = await initDashboard({
    role: 'seller',
    active: '/seller/messages',
    title: 'Messages',
    subtitle: 'Answer buyer questions and keep conversations moving.'
  });
  if (!dashboard) return;

  mountChat(dashboard.content, { user: dashboard.user, role: 'seller' });
}

init();
