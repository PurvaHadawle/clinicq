const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seedController');

// POST /api/seed  — requires { secret: 'clinicq-seed-2024' } in body
router.post('/', seedDatabase);

module.exports = router;
