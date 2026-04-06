const User = require('../models/User');

const demoDoctors = [
    { name: 'Dr. Kedar Sharma', email: 'kedar@gmail.com', password: 'kedar123', phone: '9876543210', age: 42, gender: 'Male', role: 'doctor' },
    { name: 'Dr. Priya Mehta', email: 'mehta@gmail.com', password: 'metha123', phone: '9123456780', age: 38, gender: 'Female', role: 'doctor' }
];

const demoPatients = [
    { name: 'Vaibhav Desai', email: 'vaibhav@gmail.com', password: 'vaibhav123', phone: '9988776655', age: 28, gender: 'Male', role: 'patient' }
];

const seedApp = async () => {
    try {
        // 1. Seed Admin
        const adminExists = await User.findOne({ email: 'admin@clinic.com' });
        if (!adminExists) {
            await User.create({
                name: 'System Admin', email: 'admin@clinic.com', password: 'admin123', phone: '0000000000', age: 30, gender: 'Other', role: 'admin'
            });
            console.log('✅ Default Admin created successfully.');
        }

        // 2. Seed Demo Doctors
        for (const doc of demoDoctors) {
            const exists = await User.findOne({ email: doc.email });
            if (!exists) {
                await User.create(doc);
                console.log(`✅ Demo Doctor created: ${doc.name}`);
            }
        }

        // 3. Seed Demo Patients
        for (const pat of demoPatients) {
            const exists = await User.findOne({ email: pat.email });
            if (!exists) {
                await User.create(pat);
                console.log(`✅ Demo Patient created: ${pat.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    }
};

module.exports = seedApp;
