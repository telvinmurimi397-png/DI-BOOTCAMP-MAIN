const fs = require('node:fs/promises');
const path = require('node:path');

const databasePath = path.join(__dirname, '..', 'database', 'db.json');
let writeQueue = Promise.resolve();

async function readDatabase() {
  const database = JSON.parse(await fs.readFile(databasePath, 'utf8'));
  for (const collection of ['users', 'reports', 'cleanups', 'projects', 'sponsorships']) {
    if (!Array.isArray(database[collection])) throw new Error(`Database collection ${collection} must be an array.`);
  }
  return database;
}

function updateDatabase(update) {
  const write = writeQueue.then(async () => {
    const database = await readDatabase();
    const result = await update(database);
    const temporaryPath = `${databasePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, databasePath);
    return result;
  });
  writeQueue = write.catch(() => {});
  return write;
}

module.exports = { readDatabase, updateDatabase };