const router = require('express').Router();
const c = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect); // every cart route needs a logged-in user
router.route('/').get(c.getCart).post(c.addItem).delete(c.clearCart);
router.route('/:productId').put(c.updateItem).delete(c.removeItem);

module.exports = router;
