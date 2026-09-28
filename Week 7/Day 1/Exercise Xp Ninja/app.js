const express = require('express');
const greetingRouter = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use('/', greetingRouter);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Emoji greeting app is running at http://localhost:${port}`);
  });
}

module.exports = app;