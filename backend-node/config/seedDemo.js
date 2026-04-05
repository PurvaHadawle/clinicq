require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');

const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const Counter = require('../models/Counter');

const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ─────────────────────────────────────────────
// DEMO DOCTORS
// ─────────────────────────────────────────────
const doctors = [
    {
        name: 'Dr. Kedar Sharma',
        email: 'kedar@gmail.com',
        password: 'kedar123',
        phone: '9876543210',
        age: 42,
        gender: 'Male',
        role: 'doctor'
    },
    {
        name: 'Dr. Priya Mehta',
        email: 'mehta@gmail.com',
        password: 'metha123',
        phone: '9123456780',
        age: 38,
        gender: 'Female',
        role: 'doctor'
    },
    {
        name: 'Dr. Rajesh Patil',
        email: 'rajesh@gmail.com',
        password: 'rajesh123',
        phone: '9812345670',
        age: 50,
        gender: 'Male',
        role: 'doctor'
    },
    {
        name: 'Dr. Sunita Nair',
        email: 'sunita@gmail.com',
        password: 'sunita123',
        phone: '9900112233',
        age: 45,
        gender: 'Female',
        role: 'doctor'
    }
];

// ─────────────────────────────────────────────
// DEMO PATIENTS
// ─────────────────────────────────────────────
const patients = [
    {
        name: 'Vaibhav Desai',
        email: 'vaibhav@gmail.com',
        password: 'vaibhav123',
        phone: '9988776655',
        age: 28,
        gender: 'Male',
        role: 'patient'
    },
    {
        name: 'Ananya Joshi',
        email: 'ananya@gmail.com',
        password: 'ananya123',
        phone: '9977665544',
        age: 24,
        gender: 'Female',
        role: 'patient'
    },
    {
        name: 'Ramesh Kumar',
        email: 'ramesh@gmail.com',
        password: 'ramesh123',
        phone: '9966554433',
        age: 55,
        gender: 'Male',
        role: 'patient'
    },
    {
        name: 'Sneha Kulkarni',
        email: 'sneha@gmail.com',
        password: 'sneha123',
        phone: '9955443322',
        age: 32,
        gender: 'Female',
        role: 'patient'
    },
    {
        name: 'Vikram Rao',
        email: 'vikram@gmail.com',
        password: 'vikram123',
        phone: '9944332211',
        age: 41,
        gender: 'Male',
        role: 'patient'
    }
];

// ─────────────────────────────────────────────
// DEMO CLINICS (linked to doctor by index)
// ─────────────────────────────────────────────
const clinicDefs = [
    {
        doctorIndex: 0, // kedar
        name: 'HealthFirst Multispecialty Clinic',
        locality: 'Airoli',
        address: 'Shop No. 7, Sector 4 Market, Airoli, Navi Mumbai - 400708',
        phone: '022-27691234',
        specialization: 'General Physician',
        experience: 15,
        consultationTime: 12,
        minWaitTime: 5,
        openingTime: '09:00',
        closingTime: '21:00',
        rating_avg: 4.5,
        total_ratings: 182,
        queueStatus: 'open',
        verificationStatus: 'approved'
    },
    {
        doctorIndex: 1, // mehta
        name: 'HeartFirst Cardiac Care',
        locality: 'Vashi',
        address: 'Plot 12, Sector 17, Vashi, Navi Mumbai - 400703',
        phone: '022-27891567',
        specialization: 'Cardiologist',
        experience: 12,
        consultationTime: 20,
        minWaitTime: 10,
        openingTime: '10:00',
        closingTime: '20:00',
        rating_avg: 4.8,
        total_ratings: 247,
        queueStatus: 'open',
        verificationStatus: 'approved'
    },
    {
        doctorIndex: 2, // rajesh
        name: 'Patil Orthopaedic & Spine Centre',
        locality: 'Nerul',
        address: '302, Sai Complex, Sector 19A, Nerul, Navi Mumbai - 400706',
        phone: '022-27717890',
        specialization: 'Orthopaedic Surgeon',
        experience: 22,
        consultationTime: 15,
        minWaitTime: 8,
        openingTime: '08:30',
        closingTime: '19:30',
        rating_avg: 4.6,
        total_ratings: 315,
        queueStatus: 'open',
        verificationStatus: 'approved'
    },
    {
        doctorIndex: 3, // sunita
        name: 'Nair Skin & Wellness Clinic',
        locality: 'Airoli',
        address: '15, Palm Beach Road, Sector 10, Airoli, Navi Mumbai - 400708',
        phone: '022-27654321',
        specialization: 'Dermatologist',
        experience: 18,
        consultationTime: 10,
        minWaitTime: 5,
        openingTime: '09:30',
        closingTime: '20:30',
        rating_avg: 4.7,
        total_ratings: 198,
        queueStatus: 'open',
        verificationStatus: 'approved'
    },
    {
        doctorIndex: 0, // kedar has a second clinic
        name: 'Sharma Child & Family Care',
        locality: 'Vashi',
        address: 'F-5, Pride Complex, Sector 9, Vashi, Navi Mumbai - 400703',
        phone: '022-27651111',
        specialization: 'Paediatrician',
        experience: 15,
        consultationTime: 15,
        minWaitTime: 5,
        openingTime: '17:00',
        closingTime: '21:00',
        rating_avg: 4.3,
        total_ratings: 94,
        queueStatus: 'open',
        verificationStatus: 'approved'
    }
];

// ─────────────────────────────────────────────
// DEMO TODAY APPOINTMENTS (realistic queue)
// ─────────────────────────────────────────────
// Format: { clinicIndex, patientIndex, isEmergency, status, queuePos }
const appointmentDefs = [
    // HealthFirst – 5 appointments
    { clinicIndex: 0, patientIndex: 0, isEmergency: false, status: 'completed',   queuePos: 1 },
    { clinicIndex: 0, patientIndex: 1, isEmergency: false, status: 'completed',   queuePos: 2 },
    { clinicIndex: 0, patientIndex: 2, isEmergency: true,  status: 'in_progress', queuePos: 3 },
    { clinicIndex: 0, patientIndex: 3, isEmergency: false, status: 'booked',      queuePos: 4 },
    { clinicIndex: 0, patientIndex: 4, isEmergency: false, status: 'booked',      queuePos: 5 },

    // HeartFirst – 4 appointments
    { clinicIndex: 1, patientIndex: 2, isEmergency: false, status: 'completed',   queuePos: 1 },
    { clinicIndex: 1, patientIndex: 0, isEmergency: false, status: 'in_progress', queuePos: 2 },
    { clinicIndex: 1, patientIndex: 4, isEmergency: false, status: 'booked',      queuePos: 3 },
    { clinicIndex: 1, patientIndex: 1, isEmergency: true,  status: 'booked',      queuePos: 4 },

    // Patil Orthopaedic – 3 appointments
    { clinicIndex: 2, patientIndex: 3, isEmergency: false, status: 'completed',   queuePos: 1 },
    { clinicIndex: 2, patientIndex: 4, isEmergency: false, status: 'booked',      queuePos: 2 },
    { clinicIndex: 2, patientIndex: 2, isEmergency: false, status: 'booked',      queuePos: 3 },

    // Nair Skin – 3 appointments
    { clinicIndex: 3, patientIndex: 1, isEmergency: false, status: 'completed',   queuePos: 1 },
    { clinicIndex: 3, patientIndex: 3, isEmergency: false, status: 'booked',      queuePos: 2 },
    { clinicIndex: 3, patientIndex: 0, isEmergency: false, status: 'booked',      queuePos: 3 },
];

// ─────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────
const seedDemo = async () => {
    await connectDB();
    const today = getTodayDate();

    console.log('\n🌱 Starting demo seed...\n');

    // 1. Create/find doctors
    const createdDoctors = [];
    for (const doc of doctors) {
        let existing = await User.findOne({ email: doc.email });
        if (!existing) {
            existing = await User.create(doc);
            console.log(`  ✅ Doctor created: ${doc.name}`);
        } else {
            console.log(`  ⚡ Doctor exists: ${doc.name}`);
        }
        createdDoctors.push(existing);
    }

    // 2. Create/find patients
    const createdPatients = [];
    for (const pat of patients) {
        let existing = await User.findOne({ email: pat.email });
        if (!existing) {
            existing = await User.create(pat);
            console.log(`  ✅ Patient created: ${pat.name}`);
        } else {
            console.log(`  ⚡ Patient exists: ${pat.name}`);
        }
        createdPatients.push(existing);
    }

    // 3. Create/find clinics
    const createdClinics = [];
    for (const clinicDef of clinicDefs) {
        const doctor = createdDoctors[clinicDef.doctorIndex];
        let existing = await Clinic.findOne({ name: clinicDef.name, doctorId: doctor._id });
        if (!existing) {
            existing = await Clinic.create({
                ...clinicDef,
                doctorId: doctor._id,
                doctorName: doctor.name
            });
            console.log(`  ✅ Clinic created: ${clinicDef.name}`);
        } else {
            console.log(`  ⚡ Clinic exists: ${clinicDef.name}`);
        }
        createdClinics.push(existing);
    }

    // 4. Create today's appointments (skip if already seeded today)
    for (const aptDef of appointmentDefs) {
        const clinic = createdClinics[aptDef.clinicIndex];
        const patient = createdPatients[aptDef.patientIndex];

        const existing = await Appointment.findOne({
            clinicId: clinic._id,
            patientId: patient._id,
            date: today,
            queuePosition: aptDef.queuePos
        });

        if (!existing) {
            await Appointment.create({
                clinicId: clinic._id,
                patientId: patient._id,
                queuePosition: aptDef.queuePos,
                status: aptDef.status,
                isEmergency: aptDef.isEmergency,
                date: today
            });

            // Update counter
            await Counter.findOneAndUpdate(
                { clinicId: clinic._id, date: today },
                { $max: { seq: aptDef.queuePos } },
                { upsert: true }
            );
        }
    }
    console.log(`  ✅ Today's appointments seeded (${today})`);

    console.log('\n✨ Demo seed complete!\n');
    console.log('📋 Login credentials:');
    console.log('  ADMIN    → admin@clinic.com   / admin123');
    console.log('  DOCTOR   → kedar@gmail.com    / kedar123   (2 clinics)');
    console.log('  DOCTOR   → mehta@gmail.com    / metha123');
    console.log('  DOCTOR   → rajesh@gmail.com   / rajesh123');
    console.log('  DOCTOR   → sunita@gmail.com   / sunita123');
    console.log('  PATIENT  → vaibhav@gmail.com  / vaibhav123');
    console.log('  PATIENT  → ananya@gmail.com   / ananya123');
    console.log('  PATIENT  → ramesh@gmail.com   / ramesh123\n');

    process.exit(0);
};

seedDemo().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
