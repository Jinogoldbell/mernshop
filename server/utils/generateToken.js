const jwt = require('jsonwebtoken');

/** Sign a JWT containing only the user id. */
module.exports = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
