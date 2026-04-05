const express = require('express');
const router = express.Router();
const { getPendingClinics, verifyClinic } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/pending-clinics', protect, admin, getPendingClinics);
router.post('/verify-clinic', protect, admin, verifyClinic);

module.exports = router;
