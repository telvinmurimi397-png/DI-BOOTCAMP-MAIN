#!/usr/bin/env node
'use strict';

const BASE_URL = (process.env.SMOKE_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@stokana.co.ke';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || 'Admin@2026';
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const PASSWORD = 'Smoke@2026Pass';

const RULES = [
  [1, 'Buyer can register and log in'],
  [2, 'Seller cannot publish until the admin approves the shop'],
  [3, 'A seller cannot edit another seller’s products'],
  [4, 'Products appear only in their assigned category'],
  [5, 'A sold-out product cannot be purchased'],
  [6, 'Two buyers cannot buy the same final item'],
  [7, 'Chat opens between the correct buyer and seller'],
  [8, 'An unpaid order is not marked as paid'],
  [9, 'Payment retries cannot duplicate payments or commissions'],
  [10, 'A buyer cannot view another buyer’s orders or chats']
];

class HttpClient {
  constructor(label) {
    this.label = label;
    this.cookies = new Map();
  }

  async request(method, path, body) {
    const headers = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (this.cookies.size) {
      headers.cookie = [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
    }

    let response;
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000)
      });
    } catch (error) {
      throw new Error(
        `[${this.label}] ${method} ${path} failed: ${error.message}. Is the API running at ${BASE_URL}?`
      );
    }

    if (typeof response.headers.getSetCookie === 'function') {
      for (const raw of response.headers.getSetCookie()) {
        const [pair, ...attributes] = raw.split(';');
        const separator = pair.indexOf('=');
        if (separator < 1) continue;
        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1);
        const expired =
          attributes.some((attribute) => /^expires=thu, 01 jan 1970/i.test(attribute.trim())) ||
          attributes.some((attribute) => /^max-age=0$/i.test(attribute.trim()));
        if (!value || expired) this.cookies.delete(name);
        else this.cookies.set(name, value);
      }
    }

    const text = await response.text();
    let data = text;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { status: response.status, data };
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body = {}) {
    return this.request('POST', path, body);
  }

  patch(path, body = {}) {
    return this.request('PATCH', path, body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function preview(data) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  return (text || '').slice(0, 400);
}

function expectStatus(response, expected, label) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(response.status)) {
    throw new Error(`${label}: expected HTTP ${allowed.join(' or ')}, got ${response.status} — ${preview(response.data)}`);
  }
  return response.data;
}

function sameId(left, right) {
  return Number(left) === Number(right);
}

function needs(value, label) {
  if (value === undefined || value === null) {
    throw new Error(`${label} is missing because an earlier step did not complete.`);
  }
  return value;
}

async function register(client, payload, label) {
  const data = expectStatus(await client.post('/api/auth/register', payload), 201, `${label} registration`);
  assert(data.user?.id, `${label} registration did not return a user.`);
  return data.user;
}

async function loginAdmin(client) {
  const data = expectStatus(
    await client.post('/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    200,
    'Admin sign-in'
  );
  assert(data.user?.role === 'admin', 'The configured admin account did not sign in with the admin role.');
}

async function main() {
  console.log(`\nSTOKANA business-rule smoke test`);
  console.log(`API: ${BASE_URL}`);
  console.log(`Run: ${RUN_ID}\n`);

  const health = new HttpClient('health');
  try {
    const data = expectStatus(await health.get('/api/health'), 200, 'API health check');
    assert(data.status === 'ok', `API reported status "${data.status}" instead of "ok".`);
  } catch (error) {
    console.error(`Cannot run the smoke test: ${error.message}`);
    console.error('Start the backend (`npm start`) and seed the demo database, then run `npm run test:smoke`.');
    process.exitCode = 1;
    return;
  }

  const ctx = {
    admin: new HttpClient('admin'),
    adminReady: false,
    buyerOneClient: new HttpClient('buyer-one'),
    buyerTwoClient: new HttpClient('buyer-two'),
    sellerMainClient: new HttpClient('seller-main'),
    sellerOtherClient: new HttpClient('seller-other'),
    buyerOne: null,
    buyerTwo: null,
    sellerMain: null,
    sellerOther: null,
    categoryA: null,
    categoryB: null,
    mainProduct: null,
    soldOutProduct: null,
    orderNumber: null,
    conversationId: null
  };

  const results = [];
  const run = async (number, action) => {
    const title = RULES.find(([id]) => id === number)[1];
    process.stdout.write(`  ${String(number).padStart(2)}. ${title} ... `);
    try {
      await action();
      results.push({ number, title, ok: true });
      console.log('PASS');
    } catch (error) {
      results.push({ number, title, ok: false, error: error.message });
      console.log('FAIL');
      console.log(`      ${error.message}`);
    }
  };

  await run(1, async () => {
    ctx.buyerOne = await register(
      ctx.buyerOneClient,
      {
        fullName: 'Smoke Buyer One',
        email: `smoke.b1.${RUN_ID}@stokana.test`,
        phone: '0712 345 678',
        password: PASSWORD,
        role: 'buyer'
      },
      'Buyer one'
    );
    ctx.buyerTwo = await register(
      ctx.buyerTwoClient,
      {
        fullName: 'Smoke Buyer Two',
        email: `smoke.b2.${RUN_ID}@stokana.test`,
        phone: '0712 345 679',
        password: PASSWORD,
        role: 'buyer'
      },
      'Buyer two'
    );

    assert(ctx.buyerOne.role === 'buyer', 'Buyer one was not registered with the buyer role.');
    assert(ctx.buyerTwo.role === 'buyer', 'Buyer two was not registered with the buyer role.');

    const me = expectStatus(await ctx.buyerOneClient.get('/api/auth/me'), 200, 'Buyer session');
    assert(me.user?.id === ctx.buyerOne.id, 'The buyer session was not created after registration.');

    expectStatus(await ctx.buyerOneClient.post('/api/auth/logout'), 200, 'Buyer sign-out');
    const signedOut = expectStatus(await ctx.buyerOneClient.get('/api/auth/me'), 200, 'Signed-out session');
    assert(signedOut.user === null, 'The buyer was still signed in after logging out.');

    const signedIn = expectStatus(
      await ctx.buyerOneClient.post('/api/auth/login', {
        email: `smoke.b1.${RUN_ID}@stokana.test`,
        password: PASSWORD
      }),
      200,
      'Buyer login'
    );
    assert(signedIn.user?.id === ctx.buyerOne.id, 'Buyer login returned a different account.');
  });

  await run(2, async () => {
    await loginAdmin(ctx.admin);
    ctx.adminReady = true;

    ctx.sellerMain = await register(
      ctx.sellerMainClient,
      {
        fullName: 'Smoke Seller Main',
        email: `smoke.seller.${RUN_ID}@stokana.test`,
        phone: '0722 345 678',
        password: PASSWORD,
        role: 'seller',
        shopName: `Smoke Shop ${RUN_ID}`,
        shopDescription: 'A temporary shop created by the automated smoke test.',
        shopCounty: 'Nairobi',
        shopTown: 'Westlands'
      },
      'Seller'
    );
    const sellerProfileId = ctx.sellerMain.sellerProfile?.id;
    assert(sellerProfileId, 'Seller registration did not create a shop profile.');
    assert(ctx.sellerMain.sellerProfile.status === 'pending', 'A new shop should start in pending review.');

    const categories = expectStatus(await ctx.buyerOneClient.get('/api/categories'), 200, 'Category list');
    const active = (categories.categories || []).filter((category) => category.isActive !== false);
    assert(active.length >= 2, 'At least two active categories are required for this test.');
    ctx.categoryA = active[0];
    ctx.categoryB = active.find((category) => category.id !== ctx.categoryA.id);

    const draft = {
      name: `Smoke Test Kettle ${RUN_ID}`,
      categoryId: ctx.categoryA.id,
      description: 'A temporary kettle used only by the automated STOKANA smoke test.',
      price: 1500,
      stock: 1,
      condition: 'new',
      location: 'Nairobi',
      imageUrls: ['/assets/products/mouse.jpg']
    };

    const blocked = await ctx.sellerMainClient.post('/api/seller/products', draft);
    expectStatus(blocked, 403, 'Unapproved seller publishing a product');
    assert(
      blocked.data?.code === 'SELLER_NOT_APPROVED',
      'The unapproved-seller response did not include the SELLER_NOT_APPROVED code.'
    );

    expectStatus(
      await ctx.admin.patch(`/api/admin/sellers/${sellerProfileId}/review`, { action: 'approve' }),
      200,
      'Admin shop approval'
    );

    const productData = expectStatus(
      await ctx.sellerMainClient.post('/api/seller/products', draft),
      201,
      'Approved seller product creation'
    );
    ctx.mainProduct = productData.product;
    assert(ctx.mainProduct?.status === 'pending', 'A new product should await admin approval.');

    const soldOutData = expectStatus(
      await ctx.sellerMainClient.post('/api/seller/products', {
        ...draft,
        name: `Smoke Sold Out Item ${RUN_ID}`,
        stock: 0
      }),
      201,
      'Sold-out product creation'
    );
    ctx.soldOutProduct = soldOutData.product;

    for (const product of [ctx.mainProduct, ctx.soldOutProduct]) {
      expectStatus(
        await ctx.buyerOneClient.get(`/api/products/${product.slug}`),
        404,
        'Unapproved product visibility'
      );
    }

    for (const product of [ctx.mainProduct, ctx.soldOutProduct]) {
      const approval = expectStatus(
        await ctx.admin.patch(`/api/admin/products/${product.id}/review`, { action: 'approve' }),
        200,
        'Admin product approval'
      );
      assert(approval.product?.status === 'approved', 'The product was not approved.');
    }

    expectStatus(
      await ctx.buyerOneClient.get(`/api/products/${ctx.mainProduct.slug}`),
      200,
      'Approved product visibility'
    );
  });

  await run(3, async () => {
    const canAct = needs(ctx.mainProduct, 'The approved product');
    ctx.sellerOther = await register(
      ctx.sellerOtherClient,
      {
        fullName: 'Smoke Seller Other',
        email: `smoke.other.${RUN_ID}@stokana.test`,
        phone: '0733 345 678',
        password: PASSWORD,
        role: 'seller',
        shopName: `Smoke Other Shop ${RUN_ID}`,
        shopDescription: 'A second temporary shop used to verify product ownership.',
        shopCounty: 'Nairobi',
        shopTown: 'Kilimani'
      },
      'Other seller'
    );
    const otherProfileId = ctx.sellerOther.sellerProfile?.id;
    needs(otherProfileId, 'The other seller shop profile');
    expectStatus(
      await ctx.admin.patch(`/api/admin/sellers/${otherProfileId}/review`, { action: 'approve' }),
      200,
      'Other shop approval'
    );

    expectStatus(
      await ctx.sellerOtherClient.patch(`/api/seller/products/${canAct.id}`, { price: 99 }),
      404,
      'Cross-seller product update'
    );
    expectStatus(
      await ctx.sellerOtherClient.get(`/api/seller/products/${canAct.id}`),
      404,
      'Cross-seller product read'
    );

    const detail = expectStatus(
      await ctx.buyerOneClient.get(`/api/products/${canAct.slug}`),
      200,
      'Product after cross-seller attempt'
    );
    assert(Number(detail.product.price) === 1500, 'Another seller was able to change the product price.');
  });

  await run(4, async () => {
    const product = needs(ctx.mainProduct, 'The approved product');
    const categoryA = needs(ctx.categoryA, 'The assigned category');
    const categoryB = needs(ctx.categoryB, 'The comparison category');
    const term = encodeURIComponent(RUN_ID);

    const inCategory = expectStatus(
      await ctx.buyerOneClient.get(
        `/api/products?category=${encodeURIComponent(categoryA.slug)}&q=${term}&limit=48`
      ),
      200,
      'Assigned category listing'
    );
    assert(
      inCategory.products.some((item) => item.slug === product.slug),
      'The product was missing from its assigned category.'
    );

    const otherCategory = expectStatus(
      await ctx.buyerOneClient.get(
        `/api/products?category=${encodeURIComponent(categoryB.slug)}&q=${term}&limit=48`
      ),
      200,
      'Other category listing'
    );
    assert(
      !otherCategory.products.some((item) => item.slug === product.slug),
      'The product appeared in a category it was not assigned to.'
    );

    const detail = expectStatus(
      await ctx.buyerOneClient.get(`/api/products/${product.slug}`),
      200,
      'Product category detail'
    );
    assert(detail.product.categorySlug === categoryA.slug, 'The product detail showed the wrong category.');
  });

  await run(5, async () => {
    const soldOut = needs(ctx.soldOutProduct, 'The sold-out product');
    const detail = expectStatus(
      await ctx.buyerOneClient.get(`/api/products/${soldOut.slug}`),
      200,
      'Sold-out product detail'
    );
    assert(Number(detail.product.stock) === 0, 'The sold-out product did not have zero stock.');

    const attempt = await ctx.buyerTwoClient.post('/api/cart/items', {
      productId: soldOut.id,
      quantity: 1
    });
    expectStatus(attempt, 409, 'Adding a sold-out product to the cart');

    const cart = expectStatus(await ctx.buyerTwoClient.get('/api/cart'), 200, 'Sold-out cart check');
    assert(
      !cart.items.some((item) => item.productId === soldOut.id),
      'A sold-out product was added to the cart.'
    );
  });

  await run(6, async () => {
    const product = needs(ctx.mainProduct, 'The final-stock product');
    const buyerOne = needs(ctx.buyerOne, 'Buyer one');
    const buyerTwo = needs(ctx.buyerTwo, 'Buyer two');

    expectStatus(
      await ctx.buyerOneClient.post('/api/cart/items', { productId: product.id, quantity: 1 }),
      201,
      'Buyer one cart add'
    );
    expectStatus(
      await ctx.buyerTwoClient.post('/api/cart/items', { productId: product.id, quantity: 1 }),
      201,
      'Buyer two cart add'
    );

    const checkout = expectStatus(
      await ctx.buyerOneClient.post('/api/orders/checkout', {
        shippingName: 'Smoke Buyer One',
        shippingPhone: '0712 345 678',
        shippingCounty: 'Nairobi',
        shippingTown: 'Westlands',
        shippingAddress: '12 Smoke Test Lane, near Shell station',
        notes: `Smoke run ${RUN_ID}`
      }),
      201,
      'Buyer one checkout'
    );
    ctx.orderNumber = checkout.order?.orderNumber;
    assert(ctx.orderNumber, 'Checkout did not return an order number.');

    const secondCheckout = await ctx.buyerTwoClient.post('/api/orders/checkout', {
      shippingName: 'Smoke Buyer Two',
      shippingPhone: '0712 345 679',
      shippingCounty: 'Nairobi',
      shippingTown: 'Kilimani',
      shippingAddress: '48 Smoke Test Road, opposite the mall'
    });
    expectStatus(secondCheckout, 409, 'Buyer two checkout for the final item');

    const detail = expectStatus(
      await ctx.buyerOneClient.get(`/api/products/${product.slug}`),
      200,
      'Product after final-item checkout'
    );
    assert(Number(detail.product.stock) === 0, 'Stock was not reduced to zero after the checkout.');
    assert(buyerOne.id !== buyerTwo.id, 'The two buyers resolved to the same account.');
  });

  await run(7, async () => {
    const seller = needs(ctx.sellerMain, 'The approved seller');
    const buyerOne = needs(ctx.buyerOne, 'Buyer one');
    const buyerTwo = needs(ctx.buyerTwo, 'Buyer two');

    const started = expectStatus(
      await ctx.buyerOneClient.post('/api/messages/conversations', { sellerId: seller.id }),
      201,
      'Starting a buyer–seller conversation'
    );
    ctx.conversationId = started.conversation?.id;
    assert(ctx.conversationId, 'Starting a conversation did not return an id.');
    assert(
      sameId(started.conversation.buyerId, buyerOne.id),
      'The conversation was opened for the wrong buyer.'
    );
    assert(
      sameId(started.conversation.sellerId, seller.id),
      'The conversation was opened with the wrong seller.'
    );

    const body = `Smoke hello ${RUN_ID}`;
    const sent = expectStatus(
      await ctx.buyerOneClient.post(`/api/messages/conversations/${ctx.conversationId}/messages`, { body }),
      201,
      'Sending a chat message'
    );
    assert(sent.message?.body === body, 'The sent message was not returned.');

    const inbox = expectStatus(
      await ctx.sellerMainClient.get(`/api/messages/conversations/${ctx.conversationId}`),
      200,
      'Seller reading the conversation'
    );
    assert(
      sameId(inbox.conversation.buyerId, buyerOne.id) && sameId(inbox.conversation.sellerId, seller.id),
      'The seller opened the wrong conversation.'
    );
    assert(
      inbox.messages.some((message) => message.body === body && sameId(message.senderId, buyerOne.id)),
      'The seller could not see the buyer’s message.'
    );

    const list = expectStatus(
      await ctx.sellerMainClient.get('/api/messages/conversations'),
      200,
      'Seller conversation list'
    );
    assert(
      list.conversations.some((conversation) => conversation.id === ctx.conversationId),
      'The conversation was missing from the seller’s inbox.'
    );

    const separate = expectStatus(
      await ctx.buyerTwoClient.post('/api/messages/conversations', { sellerId: seller.id }),
      201,
      'Buyer two starting a conversation'
    );
    assert(
      !sameId(separate.conversation?.id, ctx.conversationId),
      'Two buyers were placed in the same buyer–seller conversation.'
    );
    assert(sameId(separate.conversation.buyerId, buyerTwo.id), 'Buyer two’s conversation had the wrong buyer.');
  });

  await run(8, async () => {
    const orderNumber = needs(ctx.orderNumber, 'The pending order');

    const detail = expectStatus(
      await ctx.buyerOneClient.get(`/api/orders/${orderNumber}`),
      200,
      'Unpaid order detail'
    );
    assert(detail.order.status === 'pending_payment', 'The unpaid order had the wrong status.');
    assert(detail.order.paymentStatus === 'unpaid', 'The unpaid order was marked as paid.');
    assert(detail.order.paidAt === null, 'The unpaid order already had a paid timestamp.');
    assert(
      detail.order.payments.length > 0 && detail.order.payments.every((payment) => payment.status === 'pending'),
      'The unpaid order did not have only pending payments.'
    );

    const sellerOrders = expectStatus(
      await ctx.sellerMainClient.get('/api/seller/orders?limit=30'),
      200,
      'Seller orders before payment'
    );
    assert(
      !sellerOrders.orders.some((order) => order.orderNumber === orderNumber),
      'An unpaid order was visible in the seller’s paid orders.'
    );

    const commissions = expectStatus(
      await ctx.admin.get('/api/admin/commissions'),
      200,
      'Commissions before payment'
    );
    assert(
      !commissions.recent.some((entry) => entry.orderNumber === orderNumber),
      'A commission was recorded before the order was paid.'
    );
  });

  await run(9, async () => {
    const orderNumber = needs(ctx.orderNumber, 'The pending order');

    const paid = expectStatus(
      await ctx.buyerOneClient.post(`/api/orders/${orderNumber}/payment/simulate`, { outcome: 'success' }),
      200,
      'Simulated payment'
    );
    assert(paid.alreadyProcessed === false, 'The first payment was treated as already processed.');
    assert(paid.order?.paymentStatus === 'paid', 'The order was not marked paid.');

    const firstDetail = expectStatus(
      await ctx.buyerOneClient.get(`/api/orders/${orderNumber}`),
      200,
      'Paid order detail'
    );
    const successfulFirst = firstDetail.order.payments.filter((payment) => payment.status === 'success');
    assert(successfulFirst.length === 1, `Expected one successful payment, found ${successfulFirst.length}.`);

    const duplicate = expectStatus(
      await ctx.buyerOneClient.post(`/api/orders/${orderNumber}/payment/simulate`, { outcome: 'success' }),
      200,
      'Duplicate payment callback'
    );
    assert(duplicate.alreadyProcessed === true, 'A duplicate payment callback was processed again.');

    const secondDetail = expectStatus(
      await ctx.buyerOneClient.get(`/api/orders/${orderNumber}`),
      200,
      'Order after duplicate payment callback'
    );
    assert(
      secondDetail.order.payments.length === 1,
      `Duplicate payment records were created (${secondDetail.order.payments.length} found).`
    );
    assert(
      secondDetail.order.payments.filter((payment) => payment.status === 'success').length === 1,
      'A duplicate successful payment was recorded.'
    );

    const commissions = expectStatus(
      await ctx.admin.get('/api/admin/commissions'),
      200,
      'Commissions after payment'
    );
    const matches = commissions.recent.filter((entry) => entry.orderNumber === orderNumber);
    assert(matches.length === 1, `Expected one commission for the paid order, found ${matches.length}.`);

    const sellerOrders = expectStatus(
      await ctx.sellerMainClient.get('/api/seller/orders?limit=30'),
      200,
      'Seller orders after payment'
    );
    const orderMatches = sellerOrders.orders.filter((order) => order.orderNumber === orderNumber);
    assert(orderMatches.length === 1, `Expected one paid order for the seller, found ${orderMatches.length}.`);
    assert(orderMatches[0].shipmentId, 'A shipment was not created for the paid order.');

    const item = secondDetail.order.items[0];
    assert(item?.shipmentId, 'The paid order item did not link to a shipment.');
  });

  await run(10, async () => {
    const orderNumber = needs(ctx.orderNumber, 'The paid order');
    const conversationId = needs(ctx.conversationId, 'The private conversation');
    const otherSeller = needs(ctx.sellerOther, 'The other seller');

    expectStatus(
      await ctx.buyerTwoClient.get(`/api/orders/${orderNumber}`),
      404,
      'Another buyer reading the order'
    );
    expectStatus(
      await ctx.buyerTwoClient.get(`/api/messages/conversations/${conversationId}`),
      404,
      'Another buyer reading the private chat'
    );
    expectStatus(
      await ctx.sellerOtherClient.get(`/api/messages/conversations/${conversationId}`),
      404,
      'Another seller reading the private chat'
    );

    const buyerOrders = expectStatus(
      await ctx.buyerTwoClient.get('/api/orders?limit=30'),
      200,
      'Another buyer’s order list'
    );
    assert(
      !buyerOrders.orders.some((order) => order.orderNumber === orderNumber),
      'Another buyer could list the order.'
    );

    const conversations = expectStatus(
      await ctx.buyerTwoClient.get('/api/messages/conversations'),
      200,
      'Another buyer’s chat list'
    );
    assert(
      !conversations.conversations.some((conversation) => conversation.id === conversationId),
      'Another buyer could list the private conversation.'
    );
  });

  await cleanup(ctx);

  const passed = results.filter((result) => result.ok).length;
  console.log(`\n${passed}/${RULES.length} business rules passed.`);
  if (passed !== RULES.length) {
    console.log('\nFailed rules:');
    for (const result of results.filter((entry) => !entry.ok)) {
      console.log(`  ${result.number}. ${result.title}\n     ${result.error}`);
    }
    process.exitCode = 1;
  }
}

async function cleanup(ctx) {
  if (!ctx.adminReady) return;

  process.stdout.write('\nCleaning up test data ... ');
  const ignore = () => {};

  if (ctx.buyerTwo) await ctx.buyerTwoClient.delete('/api/cart').catch(ignore);

  for (const product of [ctx.mainProduct, ctx.soldOutProduct]) {
    if (!product?.id) continue;
    await ctx.admin
      .patch(`/api/admin/products/${product.id}/review`, { action: 'archive' })
      .catch(ignore);
  }

  for (const seller of [ctx.sellerMain, ctx.sellerOther]) {
    const profileId = seller?.sellerProfile?.id;
    if (!profileId) continue;
    await ctx.admin
      .patch(`/api/admin/sellers/${profileId}/review`, {
        action: 'suspend',
        reason: 'Automated smoke test cleanup'
      })
      .catch(ignore);
  }

  const userIds = [ctx.buyerOne?.id, ctx.buyerTwo?.id, ctx.sellerMain?.id, ctx.sellerOther?.id].filter(Boolean);
  for (const userId of userIds) {
    await ctx.admin.patch(`/api/admin/users/${userId}/status`, { isActive: false }).catch(ignore);
  }

  console.log('done.');
}

main().catch((error) => {
  console.error('\nSmoke test crashed:', error);
  process.exitCode = 1;
});
