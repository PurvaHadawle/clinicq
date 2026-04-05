const express = require('express');
const router = express.Router();
const { getClinics, getDoctorClinics, createClinic, getClinicById, updateClinic } = require('../controllers/clinicController');
const { protect, doctor } = require('../middleware/authMiddleware');

router.get('/', getClinics);
router.get('/doctor', getDoctorClinics);
router.post('/', protect, doctor, createClinic);
router.get('/:id', getClinicById);
router.put('/:id', protect, doctor, updateClinic);

module.exports = router;
