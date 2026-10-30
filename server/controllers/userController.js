const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

// GET /api/users  (admin)
exports.getUsers = asyncHandler(async (_req, res) => {
  res.json(await User.find().sort({ createdAt: -1 }));
});

// DELETE /api/users/:id  (admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id))
    throw httpError(400, "You can't delete your own account");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, 'User not found');
  res.json({ message: 'User deleted' });
});
