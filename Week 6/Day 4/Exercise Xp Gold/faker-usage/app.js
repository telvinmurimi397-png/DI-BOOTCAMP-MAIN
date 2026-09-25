const { users, addUser } = require('./users');

for (let index = 0; index < 3; index += 1) {
  addUser();
}

console.table(users);
