const User = require('../models/User');
const Clinic = require('../models/Clinic');

const SEED_SECRET = process.env.SEED_SECRET || 'clinicq-seed-2024';

const seedDatabase = async (req, res) => {
    const { secret } = req.body;

    if (secret !== SEED_SECRET) {
        return res.status(403).json({ success: false, detail: 'Invalid seed secret.' });
    }

    const results = [];

    try {
        // ── ADMIN ──────────────────────────────────────────────
        const adminData = { name: 'System Admin', email: 'admin@clinic.com', password: 'admin123', phone: '0000000000', age: 30, gender: 'Other', role: 'admin' };
        let admin = await User.findOne({ email: adminData.email });
        if (!admin) { admin = await User.create(adminData); results.push('✅ Admin created'); }
        else results.push('⚡ Admin exists');

        // ── DOCTORS ───────────────────────────────────────────
        const doctorsData = [
            { name: 'Dr. Kedar Sharma',  email: 'kedar@gmail.com',  password: 'kedar123',  phone: '9876543210', age: 42, gender: 'Male',   role: 'doctor' },
            { name: 'Dr. Priya Mehta',   email: 'mehta@gmail.com',  password: 'metha123',  phone: '9123456780', age: 38, gender: 'Female', role: 'doctor' },
            { name: 'Dr. Rajesh Patil',  email: 'rajesh@gmail.com', password: 'rajesh123', phone: '9812345670', age: 50, gender: 'Male',   role: 'doctor' },
            { name: 'Dr. Sunita Nair',   email: 'sunita@gmail.com', password: 'sunita123', phone: '9900112233', age: 45, gender: 'Female', role: 'doctor' }
        ];

        const createdDoctors = [];
        for (const d of doctorsData) {
            let doc = await User.findOne({ email: d.email });
            if (!doc) { doc = await User.create(d); results.push(`✅ Doctor: ${d.name}`); }
            else results.push(`⚡ Doctor exists: ${d.name}`);
            createdDoctors.push(doc);
        }

        // ── PATIENTS ──────────────────────────────────────────
        const patientsData = [
            { name: 'Vaibhav Desai',    email: 'vaibhav@gmail.com', password: 'vaibhav123', phone: '9988776655', age: 28, gender: 'Male',   role: 'patient' },
            { name: 'Ananya Joshi',     email: 'ananya@gmail.com',  password: 'ananya123',  phone: '9977665544', age: 24, gender: 'Female', role: 'patient' },
            { name: 'Ramesh Kumar',     email: 'ramesh@gmail.com',  password: 'ramesh123',  phone: '9966554433', age: 55, gender: 'Male',   role: 'patient' }
        ];
        for (const p of patientsData) {
            const exists = await User.findOne({ email: p.email });
            if (!exists) { await User.create(p); results.push(`✅ Patient: ${p.name}`); }
            else results.push(`⚡ Patient exists: ${p.name}`);
        }

        // ── CLINICS ───────────────────────────────────────────
        const clinicsData = [
            { doctorIndex: 0, name: 'HealthFirst Multispecialty Clinic', locality: 'Airoli', address: 'Shop No. 7, Sector 4 Market, Airoli, Navi Mumbai - 400708', phone: '022-27691234', specialization: 'General Physician',      experience: 15, consultationTime: 12, minWaitTime: 5,  openingTime: '09:00', closingTime: '21:00', rating_avg: 4.5, total_ratings: 182, queueStatus: 'open', verificationStatus: 'approved' },
            { doctorIndex: 1, name: 'HeartFirst Cardiac Care',           locality: 'Vashi',  address: 'Plot 12, Sector 17, Vashi, Navi Mumbai - 400703',              phone: '022-27891567', specialization: 'Cardiologist',             experience: 12, consultationTime: 20, minWaitTime: 10, openingTime: '10:00', closingTime: '20:00', rating_avg: 4.8, total_ratings: 247, queueStatus: 'open', verificationStatus: 'approved' },
            { doctorIndex: 2, name: 'Patil Orthopaedic & Spine Centre',  locality: 'Nerul',  address: '302, Sai Complex, Sector 19A, Nerul, Navi Mumbai - 400706',    phone: '022-27717890', specialization: 'Orthopaedic Surgeon',      experience: 22, consultationTime: 15, minWaitTime: 8,  openingTime: '08:30', closingTime: '19:30', rating_avg: 4.6, total_ratings: 315, queueStatus: 'open', verificationStatus: 'approved' },
            { doctorIndex: 3, name: 'Nair Skin & Wellness Clinic',       locality: 'Airoli', address: '15, Palm Beach Road, Sector 10, Airoli, Navi Mumbai - 400708', phone: '022-27654321', specialization: 'Dermatologist',            experience: 18, consultationTime: 10, minWaitTime: 5,  openingTime: '09:30', closingTime: '20:30', rating_avg: 4.7, total_ratings: 198, queueStatus: 'open', verificationStatus: 'approved' },
            { doctorIndex: 0, name: 'Sharma Child & Family Care',        locality: 'Vashi',  address: 'F-5, Pride Complex, Sector 9, Vashi, Navi Mumbai - 400703',    phone: '022-27651111', specialization: 'Paediatrician',            experience: 15, consultationTime: 15, minWaitTime: 5,  openingTime: '17:00', closingTime: '21:00', rating_avg: 4.3, total_ratings: 94,  queueStatus: 'open', verificationStatus: 'approved' },
        ];
        for (const c of clinicsData) {
            const doctor = createdDoctors[c.doctorIndex];
            const exists = await Clinic.findOne({ name: c.name, doctorId: doctor._id });
            if (!exists) {
                await Clinic.create({ ...c, doctorId: doctor._id, doctorName: doctor.name });
                results.push(`✅ Clinic: ${c.name}`);
            } else results.push(`⚡ Clinic exists: ${c.name}`);
        }

        return res.json({ success: true, results });
    } catch (error) {
        return res.status(500).json({ success: false, detail: error.message });
    }
};

module.exports = { seedDatabase };
