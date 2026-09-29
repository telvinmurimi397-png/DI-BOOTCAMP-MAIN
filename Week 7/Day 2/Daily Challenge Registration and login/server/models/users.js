const db = require('../config/db');

const publicColumns = ['id', 'email', 'username', 'first_name', 'last_name'];

function list() {
  return db('users').select(publicColumns).orderBy('id');
}

function find(id) {
  return db('users').select(publicColumns).where({ id }).first();
}

function findForLogin(username) {
  return db('hashpwd')
    .join('users', 'users.id', 'hashpwd.user_id')
    .where('hashpwd.username', username)
    .select(
      'users.id',
      'users.email',
      'users.username',
      'users.first_name',
      'users.last_name',
      'hashpwd.password as passwordHash',
    )
    .first();
}

async function create(user, passwordHash) {
  return db.transaction(async (trx) => {
    const [created] = await trx('users')
      .insert(user)
      .returning(publicColumns);

    await trx('hashpwd').insert({
      user_id: created.id,
      username: created.username,
      password: passwordHash,
    });

    return created;
  });
}

async function update(id, changes) {
  return db.transaction(async (trx) => {
    const userChanges = { ...changes };
    const passwordHash = userChanges.passwordHash;
    delete userChanges.passwordHash;

    let updated;
    if (Object.keys(userChanges).length > 0) {
      [updated] = await trx('users')
        .where({ id })
        .update(userChanges)
        .returning(publicColumns);
    } else {
      updated = await trx('users').select(publicColumns).where({ id }).first();
    }

    if (!updated) return null;

    const credentialChanges = {};
    if (Object.hasOwn(userChanges, 'username')) credentialChanges.username = updated.username;
    if (passwordHash) credentialChanges.password = passwordHash;
    if (Object.keys(credentialChanges).length > 0) {
      await trx('hashpwd').where({ user_id: id }).update(credentialChanges);
    }

    return updated;
  });
}

module.exports = { list, find, findForLogin, create, update };