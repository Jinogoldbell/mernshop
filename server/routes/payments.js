const router = require('express').Router();
const { getConfig, createRazorpayOrder } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/config', getConfig);
router.post('/razorpay/order', protect, createRazorpayOrder);

module.exports = router;
