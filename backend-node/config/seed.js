const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@clinic.com' });

        if (!adminExists) {
            const adminUser = await User.create({
                name: 'System Admin',
                email: 'admin@clinic.com',
                password: 'admin123', // Will be hashed by pre-save hook in User model
                phone: '0000000000',
                age: 30,
                gender: 'Other',
                role: 'admin'
            });
            console.log('✅ Default Admin created successfully.');
        } else {
            console.log('⚡ Admin already exists.');
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    }
};

module.exports = seedAdmin;
