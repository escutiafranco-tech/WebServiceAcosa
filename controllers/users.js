const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// GET /users  (protegida)
router.get('/', protect, userController.getAllUsers);

module.exports = router;