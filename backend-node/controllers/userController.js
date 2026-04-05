const User = require('../models/User');

const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, detail: 'User not found' });
        }
        
        // Check authorization
        if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
             return res.status(403).json({ success: false, detail: 'Not authorized to update this user' });
        }
        
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;
        user.age = req.body.age || user.age;
        user.gender = req.body.gender || user.gender;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            success: true,
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                age: updatedUser.age,
                gender: updatedUser.gender
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

module.exports = { updateUser };
