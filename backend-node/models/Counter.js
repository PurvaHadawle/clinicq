const mongoose = require('mongoose');

const counterSchema = mongoose.Schema({
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
