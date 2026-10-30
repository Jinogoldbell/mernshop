const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.route('/').post(c.createOrder).get(admin, c.getAllOrders);
router.get('/mine', c.getMyOrders);
router.put('/:id/status', admin, c.updateStatus);
router.get('/:id', c.getOrder);

module.exports = router;
