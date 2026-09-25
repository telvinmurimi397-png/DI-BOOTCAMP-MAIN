const faker = require('faker');

const users = [];

function addUser() {
  const user = {
    name: faker.name.findName(),
    addressStreet: faker.address.streetAddress(),
    country: faker.address.country()
  };

  users.push(user);
  return user;
}

module.exports = { users, addUser };
