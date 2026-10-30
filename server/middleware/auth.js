const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

/** Require a valid "Authorization: Bearer <jwt>" header and attach req.user. */
exports.protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw httpError(401, 'Not authorized, no token');

  let id;
  try {
    ({ id } = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET));
  } catch {
    throw httpError(401, 'Not authorized, token invalid or expired');
  }
  req.user = await User.findById(id);
  if (!req.user) throw httpError(401, 'Not authorized, user no longer exists');
  next();
});

/** Allow only admins. Must run after protect. */
exports.admin = (req, _res, next) =>
  req.user?.isAdmin ? next() : next(httpError(403, 'Admin access required'));
