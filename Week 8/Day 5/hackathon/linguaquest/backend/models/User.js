class User {
  constructor({ name, email }) {
    this.name = name;
    this.email = email.toLowerCase();
  }
}

module.exports = User;
