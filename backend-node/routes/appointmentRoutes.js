const express = require('express');
const router = express.Router();
const { bookAppointment, getMyAppointments, getDoctorAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect, doctor } = require('../middleware/authMiddleware');

router.post('/', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);
router.get('/doctor', protect, doctor, getDoctorAppointments);
router.put('/:id/status', protect, updateAppointmentStatus);

module.exports = router;
