const express = require('express');
const router = express.Router();
const { getMenusByRole } = require('../controllers/menuController'); // ← getMenusByRole NO getMenus
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMenusByRole); // ← getMenusByRole NO getMenus

module.exports = router;
