const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const generateToken = require('../utils/generateToken');

/** Shape of the user object returned to the client (never includes the password). */
const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  isAdmin: user.isAdmin,
  token: generateToken(user._id),
});

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw httpError(400, 'Name, email and password are required');
  if (await User.findOne({ email: String(email).toLowerCase() }))
    throw httpError(400, 'An account with this email already exists');

  // isAdmin is never read from the request body, so users can't make themselves admin
  const user = await User.create({ name, email, password });
  res.status(201).json(userResponse(user));
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    '+password'
  );
  // Same message for both failures so attackers can't tell which emails exist
  if (!user || !(await user.matchPassword(password)))
    throw httpError(401, 'Invalid email or password');
  res.json(userResponse(user));
});

// GET /api/auth/me
exports.getMe = (req, res) => res.json(userResponse(req.user));

// PUT /api/auth/me  (update name, email and/or password)
exports.updateMe = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  await user.save();
  res.json(userResponse(user));
});

const { getFirebaseAuth } = require('../config/firebase');

// GET /api/auth/firebase-token  (admin)
// Mints a Firebase custom token carrying an `admin` claim. Firebase Storage rules
// use that claim so only store admins can upload product images.
exports.firebaseToken = asyncHandler(async (req, res) => {
  const token = await getFirebaseAuth().createCustomToken(String(req.user._id), {
    admin: true,
  });
  res.json({ token });
});
