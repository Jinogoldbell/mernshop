const router = require('express').Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);
router.get('/', getUsers);
router.delete('/:id', deleteUser);

module.exports = router;
