const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');

const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Build queue stats for clinics by injecting today's appointment counts.
 */
const buildClinicResponse = async (clinic) => {
    const today = getTodayDate();
    const todayApts = await Appointment.find({ clinicId: clinic._id, date: today });

    const waiting_count = todayApts.filter(a => ['booked', 'waiting'].includes(a.status)).length;
    const in_progress_count = todayApts.filter(a => a.status === 'in_progress').length;
    const completed_count = todayApts.filter(a => a.status === 'completed').length;
    const patients_in_queue = todayApts.filter(a => !['cancelled'].includes(a.status)).length;

    const consultTime = clinic.consultationTime || 15;
    const current_wait_time = waiting_count * consultTime;

    return {
        ...clinic._doc,
        id: clinic._id.toString(),
        doctor_name: clinic.doctorId?.name || clinic.doctorName || 'Unknown Doctor',
        // Map camelCase fields to snake_case for frontend compatibility
        consultation_time: clinic.consultationTime,
        min_wait_time: clinic.minWaitTime,
        opening_time: clinic.openingTime,
        closing_time: clinic.closingTime,
        queue_status: clinic.queueStatus,
        verification_status: clinic.verificationStatus,
        // Live stats
        waiting_count,
        in_progress_count,
        completed_count,
        patients_in_queue,
        current_wait_time
    };
};

const getClinics = async (req, res) => {
    try {
        const locality = req.query.locality;
        const query = locality ? { locality: new RegExp(locality, 'i'), verificationStatus: 'approved' } : { verificationStatus: 'approved' };
        const clinics = await Clinic.find(query).populate('doctorId', 'name');

        const mappedClinics = await Promise.all(clinics.map(buildClinicResponse));
        res.json({ success: true, data: mappedClinics });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const getDoctorClinics = async (req, res) => {
    try {
        const email = req.query.email;
        const User = require('../models/User');
        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (req.user) {
            user = req.user;
        }
        if (!user || user.role !== 'doctor') {
            return res.status(404).json({ success: false, detail: 'Doctor not found' });
        }

        const clinics = await Clinic.find({ doctorId: user._id });
        const mappedClinics = await Promise.all(clinics.map(buildClinicResponse));

        res.json({
            success: true,
            has_clinic: mappedClinics.length > 0,
            clinics: mappedClinics,
            user: { id: user._id, name: user.name, email: user.email, role: 'doctor' }
        });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const createClinic = async (req, res) => {
    try {
        const newClinic = new Clinic({
            ...req.body,
            doctorId: req.user._id,
            doctorName: req.user.name,
            verificationStatus: 'pending' // Requires admin approval before appearing in search or allowing queue management
        });
        const savedClinic = await newClinic.save();
        const responseData = await buildClinicResponse(savedClinic);
        res.status(201).json({ success: true, data: responseData });
    } catch (err) {
        res.status(500).json({ success: false, detail: err.message });
    }
};

const getClinicById = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id).populate('doctorId', 'name');
        if (!clinic) return res.status(404).json({ success: false, detail: 'Clinic not found' });
        const responseData = await buildClinicResponse(clinic);
        res.json({ success: true, data: responseData });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const updateClinic = async (req, res) => {
    try {
        const clinic = await Clinic.findById(req.params.id);
        if (!clinic) return res.status(404).json({ success: false, detail: 'Clinic not found' });

        // Ensure user is the doctor of this clinic or admin
        if (clinic.doctorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, detail: 'Not authorized' });
        }

        // Allow explicit field updates
        const allowedFields = ['name', 'locality', 'address', 'phone', 'specialization',
            'consultationTime', 'minWaitTime', 'openingTime', 'closingTime',
            'experience', 'queueStatus'];
        allowedFields.forEach(key => {
            if (req.body[key] !== undefined) {
                // Prevent opening queue if not approved
                if (key === 'queueStatus' && req.body[key] === 'open' && clinic.verificationStatus !== 'approved') {
                    throw new Error('Clinic must be approved by admin before opening queue');
                }
                clinic[key] = req.body[key];
            }
        });

        // Reset to pending if updated by doctor (requires re-verification)
        if (req.user.role === 'doctor') {
            clinic.verificationStatus = 'pending';
        }

        const updatedClinic = await clinic.save();
        const responseData = await buildClinicResponse(updatedClinic);
        res.json({ success: true, data: responseData });
    } catch (err) {
        res.status(500).json({ success: false, detail: err.message });
    }
};

module.exports = { getClinics, getDoctorClinics, createClinic, getClinicById, updateClinic };
