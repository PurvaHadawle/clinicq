const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

const registerUser = async (req, res) => {
    const { name, email, password, phone, age, gender, role } = req.body;
    try {
        if (!name || !email || !password || !phone || !age || !role) {
             return res.status(400).json({ success: false, detail: 'Please provide all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, detail: 'User already exists' });
        }

        const user = await User.create({
            name, email, password, phone, age, gender, role
        });

        if (user) {
            res.status(201).json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    age: user.age,
                    gender: user.gender
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ success: false, detail: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    age: user.age,
                    gender: user.gender
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ success: false, detail: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, detail: error.message });
    }
};

module.exports = { registerUser, loginUser, getMe };
