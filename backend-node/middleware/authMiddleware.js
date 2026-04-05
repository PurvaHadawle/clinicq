const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            console.error('Token parsing error:', error);
        }
    }

    if (!token) {
        console.log('No token provided in request');
        return res.status(401).json({ success: false, detail: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ success: false, detail: 'Not authorized, user not found' });
        }
        next();
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        res.status(401).json({ success: false, detail: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ success: false, detail: 'Not authorized as an admin' });
    }
};

const doctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') {
        next();
    } else {
        res.status(401).json({ success: false, detail: 'Not authorized as a doctor' });
    }
};

module.exports = { protect, admin, doctor };
