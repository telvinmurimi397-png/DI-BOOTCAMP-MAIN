const express = require('express');

const router = express.Router();
const emojis = ['😀', '🎉', '🌟', '🎈', '👋'];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderPage(title, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root { color-scheme: light; font-family: Georgia, 'Times New Roman', serif; color: #183b38; background: #f4f7ed; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 15% 20%, #d7e9ca 0, transparent 28%), radial-gradient(circle at 85% 80%, #f5d8b8 0, transparent 30%), #f4f7ed; }
    main { width: min(100%, 480px); padding: 40px; border: 1px solid #d6dfce; background: rgba(255, 255, 252, .9); box-shadow: 12px 12px 0 #dce7d4; }
    .eyebrow { margin: 0 0 12px; color: #57766d; font: 700 11px/1.4 Arial, sans-serif; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(34px, 9vw, 52px); line-height: 1.05; }
    .intro { margin: 14px 0 28px; color: #54665e; font: 16px/1.6 Arial, sans-serif; }
    label { display: block; margin: 18px 0 7px; font: 700 12px Arial, sans-serif; }
    input, select { width: 100%; min-height: 48px; padding: 10px 12px; border: 1px solid #b8c8b8; border-radius: 0; background: #fff; color: #183b38; font: 16px Arial, sans-serif; }
    input:focus-visible, select:focus-visible, button:focus-visible, a:focus-visible { outline: 3px solid #d78654; outline-offset: 3px; }
    button, .link { min-height: 48px; display: inline-flex; align-items: center; justify-content: center; margin-top: 22px; padding: 0 20px; border: 0; background: #245c4c; color: #fff; font: 700 14px Arial, sans-serif; text-decoration: none; cursor: pointer; }
    button:hover, .link:hover { background: #174235; }
    .error { margin: 18px 0 0; padding: 12px; border-left: 3px solid #bb533e; background: #fff0e9; color: #762f24; font: 14px/1.5 Arial, sans-serif; }
    .greeting { margin: 22px 0 0; font-size: clamp(26px, 7vw, 38px); line-height: 1.25; overflow-wrap: anywhere; }
    @media (max-width: 420px) { main { padding: 28px 22px; } }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
}

function renderForm(name = '', selectedEmoji = emojis[0], error = '') {
  const options = emojis.map((emoji) => (
    `<option value="${emoji}"${emoji === selectedEmoji ? ' selected' : ''}>${emoji}</option>`
  )).join('');
  const errorMessage = error ? `<p class="error" role="alert">${error}</p>` : '';

  return renderPage('Emoji Greeting', `<main>
    <p class="eyebrow">A little hello</p>
    <h1>Send a bright greeting.</h1>
    <p class="intro">Add your name, pick an emoji, and make the day a little friendlier.</p>
    <form action="/greet" method="post">
      <label for="name">Your name</label>
      <input id="name" name="name" type="text" maxlength="50" autocomplete="name" required value="${escapeHtml(name)}">
      <label for="emoji">Choose an emoji</label>
      <select id="emoji" name="emoji">${options}</select>
      <button type="submit">Make my greeting</button>
      ${errorMessage}
    </form>
  </main>`);
}

// Exercise Xp Ninja: display the name-and-emoji form.
router.get('/', (req, res) => {
  res.type('html').send(renderForm());
});

// Validate the form and render an escaped, personalized greeting.
router.post('/greet', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const emoji = typeof req.body?.emoji === 'string' ? req.body.emoji : '';

  if (!name || name.length > 50) {
    return res.status(400).type('html').send(
      renderForm(name.slice(0, 50), emojis.includes(emoji) ? emoji : emojis[0], 'Enter a name up to 50 characters long.')
    );
  }
  if (!emojis.includes(emoji)) {
    return res.status(400).type('html').send(renderForm(name, emojis[0], 'Choose one of the listed emojis.'));
  }

  const greeting = `<main>
    <p class="eyebrow">Your greeting</p>
    <h1>Well, hello there.</h1>
    <p class="greeting" role="status">${emoji} Hello, ${escapeHtml(name)}!</p>
    <a class="link" href="/">Make another</a>
  </main>`;
  res.type('html').send(renderPage('Your Greeting', greeting));
});

module.exports = router;