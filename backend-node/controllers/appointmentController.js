const Appointment = require('../models/Appointment');
const Counter = require('../models/Counter');
const Clinic = require('../models/Clinic');
const User = require('../models/User');

const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const bookAppointment = async (req, res) => {
    try {
        const { doctor_clinic_id, patient_id, is_emergency } = req.body;
        const today = getTodayDate();

        // Check if clinic exists
        const clinic = await Clinic.findById(doctor_clinic_id);
        if (!clinic) return res.status(404).json({ success: false, detail: 'Clinic not found' });

        // Auto increment logic (Daily Reset)
        let counter = await Counter.findOne({ clinicId: doctor_clinic_id, date: today });
        if (!counter) {
            counter = new Counter({ clinicId: doctor_clinic_id, date: today, seq: 1 });
            await counter.save();
        } else {
            counter.seq += 1;
            await counter.save();
        }

        const newApt = new Appointment({
            clinicId: doctor_clinic_id,
            patientId: patient_id || req.user._id,
            queuePosition: counter.seq,
            status: 'booked',
            isEmergency: is_emergency || false,
            date: today
        });

        const saved = await newApt.save();

        req.app.get('io').to(doctor_clinic_id.toString()).emit('queue_updated', { clinicId: doctor_clinic_id });
        req.app.get('io').emit('queue_updated', { clinicId: doctor_clinic_id });

        res.status(201).json({
            success: true,
            data: { queue_position: saved.queuePosition, id: saved._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const getMyAppointments = async (req, res) => {
    try {
        // patient_id from query or from JWT
        const patientId = req.query.patient_id || req.user._id;
        const apts = await Appointment.find({ patientId }).populate('clinicId');
        
        const mapped = apts.map(a => ({
            id: a._id,
            status: a.status,
            queue_position: a.queuePosition,
            clinic_name: a.clinicId ? a.clinicId.name : 'Unknown Clinic',
            clinic_address: a.clinicId ? a.clinicId.address : '',
            doctor_clinic_id: a.clinicId ? a.clinicId._id.toString() : null,
            patient_id: a.patientId.toString(),
            is_emergency: a.isEmergency,
            date: a.date
        }));

        res.json({ success: true, data: mapped });
    } catch(err) {
        res.status(500).json({ success: false, detail: err.message });
    }
};

const getDoctorAppointments = async (req, res) => {
    try {
        const doctor_id = req.query.doctor_id || req.user._id;
        // get doctor's clinics
        const clinics = await Clinic.find({ doctorId: doctor_id });
        const clinicIds = clinics.map(c => c._id);

        const today = getTodayDate();
        // Return active queue components only
        const apts = await Appointment.find({
            clinicId: { $in: clinicIds },
            date: today,
            status: { $in: ['booked', 'waiting', 'in_progress', 'fake_emergency_reported', 'completed'] }
        }).populate('patientId');
        
        const mapped = apts.map(a => ({
            id: a._id,
            patient_id: a.patientId?._id,
            patient_name: a.patientId?.name || 'Unknown',
            patient_phone: a.patientId?.phone || '',
            patient_age: a.patientId?.age || '',
            queue_position: a.queuePosition,
            status: a.status,
            is_emergency: a.isEmergency,
            doctor_clinic_id: a.clinicId ? a.clinicId.toString() : null
        }));

        res.json({ success: true, data: mapped });
    } catch(err) {
        res.status(500).json({ success: false, detail: err.message });
    }
};

const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        let status = req.query.status || req.body.status;

        // Map frontend status to Mongoose enum values
        const statusMap = {
            'fake_emergency': 'fake_emergency_reported',
            'warning': 'booked' // warning is just an alert, keep status as booked
        };
        const dbStatus = statusMap[status] || status;

        const validStatuses = ['booked', 'waiting', 'in_progress', 'completed', 'cancelled', 'fake_emergency_reported'];
        if (!validStatuses.includes(dbStatus)) {
            return res.status(400).json({ success: false, detail: `Invalid status: ${status}` });
        }

        const apt = await Appointment.findById(id);
        if(!apt) return res.status(404).json({ success: false, detail: 'Not found' });

        apt.status = dbStatus;
        await apt.save();

        req.app.get('io').to(apt.clinicId.toString()).emit('queue_updated', { clinicId: apt.clinicId });
        req.app.get('io').emit('queue_updated', { clinicId: apt.clinicId });

        res.json({ success: true, data: apt });
    } catch(err) {
        res.status(500).json({ success: false, detail: err.message });
    }
};

module.exports = { bookAppointment, getMyAppointments, getDoctorAppointments, updateAppointmentStatus };
