import { initAccount } from '../account-ui.js';
import { mountChat } from '../chat.js';

async function init() {
  const account = await initAccount({
    active: '/account/messages',
    title: 'Messages',
    subtitle: 'Ask shops about products, delivery and your orders.',
    actions: '<a class="btn btn-secondary btn-sm" href="/explore">Find a shop</a>'
  });
  if (!account) return;

  mountChat(account.content, { user: account.user, role: 'buyer' });
}

init();
