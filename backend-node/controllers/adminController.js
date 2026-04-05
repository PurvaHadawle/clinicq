const Clinic = require('../models/Clinic');

const getPendingClinics = async (req, res) => {
    try {
        const clinics = await Clinic.find({ verificationStatus: 'pending' })
            .populate('doctorId', 'name email phone');
        
        const mappedClinics = clinics.map(c => ({
            ...c._doc,
            id: c._id.toString(),
            doctor_name: c.doctorId?.name || 'Unknown Doctor'
        }));
        
        res.json({ success: true, data: mappedClinics });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const verifyClinic = async (req, res) => {
    try {
        // Accept both clinic_id and clinicId from frontend
        const clinicId = req.body.clinicId || req.body.clinic_id;
        const status = req.body.status;
        if (!clinicId || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, detail: 'Invalid input' });
        }
        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
             return res.status(404).json({ success: false, detail: 'Clinic not found' });
        }
        clinic.verificationStatus = status;
        await clinic.save();
        res.json({ success: true, data: { ...clinic._doc, id: clinic._id.toString() } });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

module.exports = { getPendingClinics, verifyClinic };
