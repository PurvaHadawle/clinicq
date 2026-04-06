require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Connect Database
connectDB();

// Seed Default Admin & Demo Users
const seedApp = require('./config/seed');
seedApp();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { 
        origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], 
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());

// Set socket io instance to app
app.set('io', io);

// Socket connections authentication
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        // We'll allow public connection but mark them as unauthorized
        socket.isAuth = false;
        return next();
    }
    jwt.verify(token, process.env.JWT_SECRET || 'secret123', (err, decoded) => {
        if (err) {
            socket.isAuth = false;
        } else {
            socket.isAuth = true;
            socket.user = decoded;
        }
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}, Auth: ${socket.isAuth}`);
    
    socket.on('join_clinic_queue', (clinicId) => {
        socket.join(clinicId);
        console.log(`User joined clinic room: ${clinicId}`);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedRoutes = require('./routes/seedRoutes');

// Auth Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: { success: false, detail: 'Too many requests, please try again later.' }
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/seed', seedRoutes);
// Backward compat: /api/doctor/me -> clinics/doctor, /api/doctor/appointments -> appointments/doctor
app.get('/api/doctor/me', require('./controllers/clinicController').getDoctorClinics);
app.get('/api/doctor/appointments', require('./controllers/appointmentController').getDoctorAppointments);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
