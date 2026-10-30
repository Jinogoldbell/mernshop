const router = require('express').Router();
const {
  register,
  login,
  getMe,
  updateMe,
  firebaseToken,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/firebase-token', protect, admin, firebaseToken);
router.route('/me').get(protect, getMe).put(protect, updateMe);

module.exports = router;
