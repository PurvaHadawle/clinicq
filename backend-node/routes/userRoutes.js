const express = require('express');
const router = express.Router();
const { updateUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/:id', protect, updateUser);

module.exports = router;
