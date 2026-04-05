const mongoose = require('mongoose');

const clinicSchema = mongoose.Schema({
    name: { type: String, required: true },
    locality: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    specialization: { type: String },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String },
    consultationTime: { type: Number, default: 15 },
    minWaitTime: { type: Number, default: 10 },
    openingTime: { type: String },
    closingTime: { type: String },
    experience: { type: Number, default: 0 },
    rating_avg: { type: Number, default: 0 },
    total_ratings: { type: Number, default: 0 },
    queueStatus: { type: String, enum: ['open', 'closed'], default: 'open' },
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Clinic', clinicSchema);
