const router = require('express').Router();
const c = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.route('/').get(c.getProducts).post(protect, admin, c.createProduct);
// Fixed paths must be declared before "/:id"
router.get('/featured', c.getFeatured);
router.get('/categories', c.getCategories);
router
  .route('/:id')
  .get(c.getProduct)
  .put(protect, admin, c.updateProduct)
  .delete(protect, admin, c.deleteProduct);

module.exports = router;
