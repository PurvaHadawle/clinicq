const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    queuePosition: { type: Number, required: true },
    status: { type: String, enum: ['booked', 'waiting', 'in_progress', 'completed', 'cancelled', 'fake_emergency_reported'], default: 'booked' },
    isEmergency: { type: Boolean, default: false },
    estimatedWait: { type: Number, default: 0 },
    date: { type: String, required: true } // format: YYYY-MM-DD
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
