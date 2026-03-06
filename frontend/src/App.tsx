import { useState, useEffect } from 'react'
import './index.css'

const API_URL = 'https://clinicq-cid1.onrender.com'

// Health motivational quotes that rotate every 5 seconds
const healthQuotes = [
    "Health is not valued until sickness comes. – Take care today!",
    "Your body hears everything your mind says. Stay positive!",
    "The greatest wealth is health. – Virgil",
    "Take care of your body. It's the only place you have to live.",
    "A healthy outside starts from the inside.",
    "Health is a relationship between you and your body.",
    "Prevention is better than cure.",
    "Your health is an investment, not an expense."
]

interface Clinic {
    id: number
    name: string
    locality: string
    address: string
    phone: string
    rating_avg: number
    total_ratings: number
    specialization: string
    doctor_name: string
    consultation_time: number
    min_wait_time: number
    opening_time: string
    closing_time: string
    queue_status: string
    patients_in_queue: number
    current_wait_time: number
    waiting_count?: number
    in_progress_count?: number
    completed_count?: number
}

function App() {
    const [view, setView] = useState('landing') // landing, login, dashboard, doctor
    const [user, setUser] = useState<any>(null)
    const [isDarkMode, setIsDarkMode] = useState(true)
    const [currentQuote, setCurrentQuote] = useState(0)
    const [clinics, setClinics] = useState<Clinic[]>([])
    const [selectedLocality, setSelectedLocality] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [isRegisterMode, setIsRegisterMode] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [age, setAge] = useState('')

    const [gender, setGender] = useState('Male')
    const [role, setRole] = useState('patient')
    const [myAppointments, setMyAppointments] = useState<any[]>([])
    const [doctorAppointments, setDoctorAppointments] = useState<any[]>([])

    // Doctor Setup Form State
    const [doctorForm, setDoctorForm] = useState({
        specialization: '',
        clinicName: '',
        address: '',
        locality: 'Airoli',
        experience: '',
        consultationTime: '15',
        minWaitTime: '10',
        openingTime: '09:00',
        closingTime: '21:00',
        degreeFile: null as File | null
    })
    const [doctorClinics, setDoctorClinics] = useState<any[]>([])
    const [currentClinicId, setCurrentClinicId] = useState<number | null>(null)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [bookingClinicId, setBookingClinicId] = useState<number | null>(null)
    const [pendingClinics, setPendingClinics] = useState<any[]>([])
    const [selectedCert, setSelectedCert] = useState<string | null>(null)

    // Rotate quotes every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % healthQuotes.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    // Apply theme
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode')
            document.body.classList.remove('light-mode')
        } else {
            document.body.classList.add('light-mode')
            document.body.classList.remove('dark-mode')
        }
    }, [isDarkMode])

    // Fetch clinics when locality changes
    useEffect(() => {
        if (view === 'dashboard') {
            fetchClinics()
        }
    }, [selectedLocality, view])

    useEffect(() => {
        if (view === 'admin-dashboard') {
            fetchPendingClinics()
        }
    }, [view])

    // Persistence
    useEffect(() => {
        const savedUser = localStorage.getItem('clinicQ_user')
        const savedView = localStorage.getItem('clinicQ_view')
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser)
            setUser(parsedUser)
            if (savedView) setView(savedView)

            if (parsedUser.role === 'doctor') {
                const savedClinics = localStorage.getItem('clinicQ_doctorClinics')
                const savedClinicId = localStorage.getItem('clinicQ_currentClinicId')
                if (savedClinics) setDoctorClinics(JSON.parse(savedClinics))
                if (savedClinicId) setCurrentClinicId(parseInt(savedClinicId))
            }
        } else {
            setEmail('')
            setPassword('')
            setPhone('')
        }
    }, [])

    useEffect(() => {
        if (user) {
            localStorage.setItem('clinicQ_user', JSON.stringify(user))
            localStorage.setItem('clinicQ_view', view)
            if (user.role === 'doctor') {
                localStorage.setItem('clinicQ_doctorClinics', JSON.stringify(doctorClinics))
                if (currentClinicId) localStorage.setItem('clinicQ_currentClinicId', currentClinicId.toString())
            }
        } else {
            localStorage.removeItem('clinicQ_user')
            localStorage.removeItem('clinicQ_view')
            localStorage.removeItem('clinicQ_doctorClinics')
            localStorage.removeItem('clinicQ_currentClinicId')
        }
    }, [user, view, doctorClinics, currentClinicId])

    // Clear form when switching views
    useEffect(() => {
        if (view === 'login') {
            setPhone('')
            setPassword('')
            setName('')
            setEmail('')
            setAge('')
            setGender('Male')
            setRole('patient')
            setIsRegisterMode(false)
        }
        if (view === 'profile' && user) {
            setName(user.name)
            setEmail(user.email)
            setPhone(user.phone)
            setAge(user.age?.toString() || '')
            setGender(user.gender || 'Male')

            // If doctor, populate clinic form with current clinic if available
            if (user.role === 'doctor' && currentClinicId) {
                const c = doctorClinics.find(cl => cl.id === currentClinicId)
                if (c) {
                    setDoctorForm(prev => ({
                        ...prev,
                        clinicName: c.name,
                        specialization: c.specialization,
                        address: c.address,
                        locality: c.locality,
                        consultationTime: c.consultation_time.toString(),
                        minWaitTime: (c.min_wait_time || 10).toString(),
                        openingTime: c.opening_time || '09:00',
                        closingTime: c.closing_time || '21:00',
                        experience: c.experience.toString()
                    }))
                }
            }
        }
    }, [view])

    const fetchClinics = async () => {
        try {
            const url = selectedLocality ? `${API_URL}/clinics?locality=${selectedLocality}` : `${API_URL}/clinics`
            const response = await fetch(url)
            const data = await response.json()
            if (data.success) {
                setClinics(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch clinics:', error)
        }
    }

    const fetchMyAppointments = async () => {
        if (!user) return
        try {
            const response = await fetch(`${API_URL}/appointments/my`)
            const data = await response.json()
            if (data.success) {
                // Client-side filter for demo (since backend doesn't filter by user yet)
                const myApts = data.data.filter((apt: any) => apt.patient_id === user.id)
                // Sort by ID desc (newest first)
                setMyAppointments(myApts.sort((a: any, b: any) => b.id - a.id))
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error)
        }
    }

    // Refresh appointments when user changes or view becomes dashboard
    useEffect(() => {
        if (user && view === 'dashboard') {
            fetchMyAppointments()
        }
    }, [user, view])

    const handleLogin = async (loginEmail: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password })
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.detail || 'Invalid credentials. Please check your email and password.')
                return
            }

            const data = await response.json()

            if (data.success) {
                setUser(data.user)

                if (data.user.role === 'doctor') {
                    // Check if doctor has a clinic setup
                    try {
                        const profileRes = await fetch(`${API_URL}/doctor/me?email=${data.user.email}`)
                        const profileData = await profileRes.json()

                        if (profileData.has_clinic) {
                            setDoctorClinics(profileData.clinics)
                            setCurrentClinicId(profileData.clinics[0].id)
                            setView('doctor-dashboard')
                            fetchDoctorAppointments(data.user.id)
                        } else {
                            setView('doctor-setup')
                        }
                    } catch (e) {
                        console.error("Failed to fetch doctor profile", e)
                        setView('doctor-setup') // Default to setup if error
                    }
                } else if (data.user.role === 'admin') {
                    setView('admin-dashboard')
                    fetchPendingClinics()
                } else {
                    setView('dashboard')
                }

                // Clear form
                setEmail('')
                setPassword('')
            } else {
                alert('Invalid credentials')
            }
        } catch (error) {
            alert('Login failed. Please check if backend is running.')
        }
    }

    const handleRegister = async () => {
        if (!email || !password || !name || !age || !phone) {
            alert('Please fill all required fields (Name, Email, Age, Phone, Password)')
            return
        }

        try {
            let certificateData = 'mock_cert.pdf'
            if (role === 'doctor' && doctorForm.degreeFile) {
                certificateData = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(doctorForm.degreeFile!)
                })
            }

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    password,
                    name,
                    email,
                    age: parseInt(age),
                    gender,
                    role: role
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.detail || 'Registration failed')
                return
            }

            const data = await response.json()

            if (data.success) {
                if (role === 'doctor') {
                    try {
                        await fetch(`${API_URL}/clinics`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: doctorForm.clinicName,
                                locality: doctorForm.locality,
                                address: doctorForm.address,
                                phone: phone,
                                specialization: doctorForm.specialization,
                                consultation_time: parseInt(doctorForm.consultationTime),
                                min_wait_time: parseInt(doctorForm.minWaitTime),
                                opening_time: doctorForm.openingTime,
                                closing_time: doctorForm.closingTime,
                                experience: parseInt(doctorForm.experience || '0'),
                                doctor_id: data.user.id,
                                certificate: certificateData
                            })
                        })
                    } catch (e) {
                        console.error("Clinic creation failed during registration", e)
                    }
                }
                alert('Registration successful! Logging you in...')
                // Auto-login after registration
                handleLogin(email, password)
            }
        } catch (error) {
            alert('Registration failed. Please try again.')
        }
    }

    const bookAppointment = async (clinicId: number, isEmergency: boolean = false) => {
        if (!user) {
            alert('Please login to book an appointment')
            setView('login')
            return
        }

        try {
            const response = await fetch(`${API_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctor_clinic_id: clinicId,
                    patient_id: user.id,
                    is_emergency: isEmergency
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Booking failed')
            }

            const data = await response.json()

            if (data.success) {
                alert(`Appointment booked! Token: #${data.data.queue_position}`)
                setShowBookingModal(false)
                fetchClinics() // Refresh clinics
                fetchMyAppointments() // Refresh my appointments
            }
        } catch (error) {
            console.error('Booking error:', error)
            alert('Failed to book appointment. Please try again.')
        }
    }

    // Landing Page
    const renderLanding = () => (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-brand">ClinicQ</div>
                <div className="nav-links">
                    <button className="btn-text" onClick={() => setView('landing')}>HOME</button>
                    <button className="btn-text" onClick={() => setView('about')}>ABOUT</button>
                    <a href="#features" className="btn-text" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>FEATURES</a>
                </div>
                <div className="nav-actions">
                    <button className="btn-outline" onClick={() => { setIsRegisterMode(true); setView('login'); }}>JOIN</button>
                    <button className="btn-text" onClick={() => { setIsRegisterMode(false); setView('login'); }}>LOG IN</button>
                </div>
            </nav>

            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Your Health. Our Priority.</h1>
                    <p className="hero-subtitle">Smart queue management for a healthier future.</p>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">1.2M+</span>
                            <span className="stat-label">PATIENTS</span>
                        </div>
                        <span className="stat-divider">•</span>
                        <div className="stat-item">
                            <span className="stat-value">500+</span>
                            <span className="stat-label">CLINICS</span>
                        </div>
                        <span className="stat-divider">•</span>
                        <div className="stat-item">
                            <span className="stat-value">REAL-TIME</span>
                        </div>
                    </div>

                    <div className="hero-search">
                        <input
                            type="text"
                            placeholder="Find your clinic..."
                            className="search-input"
                        />
                        <button className="btn-primary" onClick={() => setView('login')}>
                            GET STARTED
                        </button>
                    </div>

                    {/* Floating Quote Card (Moved) */}
                    <div className="floating-quote-card" style={{
                        marginTop: '30px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(10px)',
                        padding: '15px 20px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxWidth: '450px',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '20px' }}>💡</span>
                            <p key={currentQuote} style={{
                                margin: 0,
                                color: '#e2e8f0',
                                fontSize: '14px',
                                fontStyle: 'italic',
                                lineHeight: '1.4',
                                animation: 'fadeIn 0.5s ease-in-out'
                            }}>
                                "{healthQuotes[currentQuote]}"
                            </p>
                        </div>
                        <div className="quote-indicators" style={{ display: 'flex', gap: '5px', alignSelf: 'flex-end' }}>
                            {healthQuotes.map((_, index) => (
                                <span
                                    key={index}
                                    style={{
                                        width: index === currentQuote ? '20px' : '6px',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: index === currentQuote ? 'var(--primary-blue)' : 'rgba(255,255,255,0.2)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="hero-illustration" style={{ position: 'relative' }}>
                    <img
                        src="/hero-illustration.png"
                        alt="Modern Clinic Waiting Room"
                        className="hero-image"
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '400px',
                            objectFit: 'cover',
                            borderRadius: '20px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                        }}
                    />


                </div>
            </div>



            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-col">
                        <h3>ClinicQ</h3>
                        <p>Connecting patients with care, instantly.</p>
                    </div>
                    <div className="footer-col">
                        <h4>COMPANY</h4>
                        <a href="#about">About Us</a>
                        <a href="#careers">Careers</a>
                        <a href="#contact">Contact</a>
                    </div>
                    <div className="footer-col">
                        <h4>RESOURCES</h4>
                        <a href="#clinics">For Clinics</a>
                        <a href="#support">Support</a>
                        <a href="#blog">Blog</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    © 2026 ClinicQ Inc. All rights reserved.
                </div>
            </footer>
        </div>
    )

    // Login/Register Modal
    const renderLogin = () => (
        <div className="modal-overlay" onClick={() => setView('landing')}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setView('landing')}>×</button>

                <div className="auth-toggle">
                    <button
                        className={`toggle-btn ${!isRegisterMode ? 'active' : ''}`}
                        onClick={() => setIsRegisterMode(false)}
                    >
                        Login
                    </button>
                    <button
                        className={`toggle-btn ${isRegisterMode ? 'active' : ''}`}
                        onClick={() => setIsRegisterMode(true)}
                    >
                        Register
                    </button>
                </div>

                <h2>{isRegisterMode ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="login-subtitle">
                    {isRegisterMode ? 'Join ClinicQ to book appointments' : 'Sign in to manage your appointments'}
                </p>

                {isRegisterMode && (
                    <>
                        <div className="role-selection" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                            <button
                                className={`role-card ${role === 'patient' ? 'active' : ''}`}
                                onClick={() => setRole('patient')}
                                style={{
                                    flex: 1,
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: role === 'patient' ? '2px solid #007bff' : '1px solid #ddd',
                                    background: role === 'patient' ? 'rgba(0, 123, 255, 0.1)' : 'var(--input-bg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>👤</span>
                                <span style={{ fontWeight: 600 }}>Patient</span>
                            </button>
                            <button
                                className={`role-card ${role === 'doctor' ? 'active' : ''}`}
                                onClick={() => setRole('doctor')}
                                style={{
                                    flex: 1,
                                    padding: '15px',
                                    borderRadius: '10px',
                                    border: role === 'doctor' ? '2px solid #007bff' : '1px solid #ddd',
                                    background: role === 'doctor' ? 'rgba(0, 123, 255, 0.1)' : 'var(--input-bg)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>👨‍⚕️</span>
                                <span style={{ fontWeight: 600 }}>Doctor</span>
                            </button>
                        </div>
                        <div className="input-group">
                            <label>Full Name *</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input"
                            />
                        </div>

                        <div className="input-row">
                            <div className="input-group">
                                <label>Age *</label>
                                <input
                                    type="number"
                                    placeholder="Age"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="input"
                                />
                            </div>
                            <div className="input-group">
                                <label>Gender *</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="input"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                placeholder="Enter 10-digit phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="input"
                            />
                        </div>

                        {role === 'doctor' && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid var(--bg-border)', paddingTop: '20px' }}>
                                <h3 style={{ marginBottom: '15px', color: 'var(--primary-blue)' }}>Clinic Details</h3>
                                <div className="input-group">
                                    <label>Clinic Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Clinic Name"
                                        value={doctorForm.clinicName}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, clinicName: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Specialization *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Cardiologist"
                                        value={doctorForm.specialization}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Locality *</label>
                                    <select
                                        className="input"
                                        value={doctorForm.locality}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, locality: e.target.value })}
                                    >
                                        <option value="Airoli">Airoli</option>
                                        <option value="Vashi">Vashi</option>
                                        <option value="Nerul">Nerul</option>
                                        <option value="Koperkhairane">Koperkhairane</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Full Address *</label>
                                    <textarea
                                        placeholder="Clinic full address"
                                        value={doctorForm.address}
                                        onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })}
                                        className="input"
                                        rows={2}
                                    />
                                </div>
                                <div className="input-row">
                                    <div className="input-group">
                                        <label>Experience (Yrs)</label>
                                        <input
                                            type="number"
                                            value={doctorForm.experience}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Cons. Time (min)</label>
                                        <input
                                            type="number"
                                            value={doctorForm.consultationTime}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, consultationTime: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div className="input-row">
                                    <div className="input-group">
                                        <label>Opening Time</label>
                                        <input
                                            type="time"
                                            value={doctorForm.openingTime}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, openingTime: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Closing Time</label>
                                        <input
                                            type="time"
                                            value={doctorForm.closingTime}
                                            onChange={(e) => setDoctorForm({ ...doctorForm, closingTime: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Degree Certificate/Work Permit *</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setDoctorForm({ ...doctorForm, degreeFile: e.target.files ? e.target.files[0] : null })}
                                        className="input"
                                        accept=".pdf,.jpg,.png"
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Please upload your medical degree or clinic permit for admin verification.</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="input-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        autoComplete="off"
                    />
                </div>

                <div className="input-group">
                    <label>Password *</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        autoComplete="new-password"
                    />
                </div>

                <button
                    className="btn-primary full-width"
                    onClick={() => isRegisterMode ? handleRegister() : handleLogin(email, password)}
                >
                    {isRegisterMode ? 'REGISTER' : 'LOG IN'}
                </button>
            </div>
        </div >
    )

    // User Dashboard
    const renderDashboard = () => (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <span className="brand-icon">➕</span> ClinicQ
                </div>
                <div className="nav-right">
                    <button
                        className="theme-toggle"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                    <button className="btn-logout" onClick={() => {
                        setUser(null)
                        setView('landing')
                    }}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="dashboard-content">
                <div className="welcome-section">
                    <h1>Hello, <span className="user-name">{user?.name || 'User'}</span> 👋</h1>
                    <p>Find nearby clinics, book appointments, and track your queue in real-time.</p>
                </div>

                <section className="appointments-section">
                    <h2>📋 My Appointments Today</h2>
                    {myAppointments.length === 0 ? (
                        <div className="empty-state">
                            <p>No appointments today. Browse clinics below to book one!</p>
                        </div>
                    ) : (
                        <div className="appointments-grid" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {myAppointments.map((apt) => {
                                return (
                                    <div key={apt.id} className="appointment-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--bg-border)' }}>
                                        <div className="apt-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Token #{apt.queue_position}</span>
                                            <span className={`status-badge ${apt.status}`} style={{ textTransform: 'capitalize', padding: '4px 8px', borderRadius: '4px', background: 'var(--input-bg)' }}>
                                                {apt.status === 'booked' ? '📅 Booked' : apt.status}
                                            </span>
                                        </div>
                                        <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>{apt.clinic_name || 'Clinic'}</h3>
                                        <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            📍 {apt.clinic_address || 'Address'}
                                        </p>

                                        {apt.status === 'fake_emergency_reported' && (
                                            <div style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid #ef4444',
                                                borderRadius: '8px',
                                                padding: '10px',
                                                marginTop: '10px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                color: '#ef4444'
                                            }}>
                                                <span style={{ fontSize: '20px' }}>⚠️</span>
                                                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                                    The doctor has reported this emergency booking as FAKE. Please avoid misusing the emergency system.
                                                </div>
                                            </div>
                                        )}
                                        <div className="apt-actions" style={{ marginTop: '15px' }}>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(apt.clinic_address || '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn-outline"
                                                style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center', width: '100%', fontSize: '14px' }}
                                            >
                                                🗺️ Navigate to Clinic
                                            </a>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>

                <section className="browse-section">
                    <h2>🏥 Browse Clinics</h2>

                    <div className="filters">
                        <select
                            className="filter-select"
                            value={selectedLocality}
                            onChange={(e) => setSelectedLocality(e.target.value)}
                        >
                            <option value="">All Locations</option>
                            <option value="Airoli">Airoli</option>
                            <option value="Vashi">Vashi</option>
                            <option value="Nerul">Nerul</option>
                        </select>

                        <select
                            className="filter-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="rating">Sort by Rating</option>
                            <option value="wait">Sort by Wait Time</option>
                        </select>
                    </div>

                    <div className="clinics-grid">
                        {clinics.map((clinic) => (
                            <div key={clinic.id} className="clinic-card">
                                <div className="clinic-header">
                                    <h3>{clinic.name}</h3>
                                    <span className="wait-badge">{clinic.current_wait_time || 0} Min Wait</span>
                                </div>

                                <p className="clinic-address">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        📍 {clinic.address} <span style={{ fontSize: '12px', color: 'var(--primary-blue)' }}>(View Map)</span>
                                    </a>
                                </p>

                                <div className="clinic-stats">
                                    <div className="stat">
                                        <span className="stat-number">{clinic.patients_in_queue || 0}</span>
                                        <span className="stat-label">TOKENS<br />TODAY</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-number waiting">{clinic.waiting_count || 0}</span>
                                        <span className="stat-label">WAITING</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-number progress">{clinic.in_progress_count || 0}</span>
                                        <span className="stat-label">IN<br />PROGRESS</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-number completed">{clinic.completed_count || 0}</span>
                                        <span className="stat-label">COMPLETED</span>
                                    </div>
                                </div>

                                <div className="clinic-rating">
                                    ⭐ {clinic.rating_avg || 0}
                                    <span className="review-count">{clinic.total_ratings || 0} REVIEWS</span>
                                </div>

                                <div className="clinic-info">
                                    <span className="info-item">🕒 {clinic.opening_time || '09:00'} - {clinic.closing_time || '21:00'}</span>
                                    <span className="info-item">📞 {clinic.phone}</span>
                                </div>

                                <div className="doctor-info">
                                    <strong>{clinic.doctor_name}</strong>
                                    <div className="doctor-badges">
                                        <span className="badge waiting-badge">{clinic.waiting_count || 0} waiting</span>
                                        <span className="badge patient-badge">{clinic.patients_in_queue || 0} patients</span>
                                    </div>
                                    <span className={`status-badge ${clinic.queue_status === 'open' ? 'open' : 'closed'}`}>
                                        {clinic.queue_status === 'open' ? '🟢 Open' : '🔴 Closed'}
                                    </span>
                                </div>

                                <button
                                    className="btn-book"
                                    onClick={() => {
                                        setBookingClinicId(clinic.id)
                                        setShowBookingModal(true)
                                    }}
                                    disabled={clinic.queue_status !== 'open'}
                                >
                                    Book Now
                                </button>

                                <p className="estimated-wait">
                                    💡 If booked now: ~{clinic.current_wait_time || 0} min estimated wait
                                </p>

                                <button className="btn-rate">⭐ Rate Clinic</button>
                            </div>
                        ))}
                    </div>
                </section>

                {showBookingModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--bg-border)' }}>
                            <h2 style={{ marginBottom: '10px' }}>Select Booking Type</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>In case of emergencies, priority will be given.</p>
                            <div style={{ display: 'grid', gap: '15px' }}>
                                <button className="btn-primary" onClick={() => bookingClinicId && bookAppointment(bookingClinicId, false)}>
                                    📅 Normal Booking
                                </button>
                                <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => bookingClinicId && bookAppointment(bookingClinicId, true)}>
                                    🚨 Emergency Booking
                                </button>
                                <button className="btn-text" onClick={() => setShowBookingModal(false)} style={{ marginTop: '10px' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )



    const fetchDoctorAppointments = async (doctorId: number) => {
        try {
            const response = await fetch(`${API_URL}/doctor/appointments?doctor_id=${doctorId}`)
            const data = await response.json()
            if (data.success) {
                setDoctorAppointments(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch doctor appointments:', error)
        }
    }

    const handleDoctorSetupSubmit = async () => {
        if (!doctorForm.clinicName || !doctorForm.specialization || !doctorForm.address) {
            alert('Please fill all required fields')
            return
        }

        try {
            let certificateData = 'mock_cert.pdf'
            if (doctorForm.degreeFile) {
                certificateData = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(doctorForm.degreeFile!)
                })
            }

            const response = await fetch(`${API_URL}/clinics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: doctorForm.clinicName,
                    locality: doctorForm.locality,
                    address: doctorForm.address,
                    phone: user.phone || '0000000000',
                    specialization: doctorForm.specialization,
                    consultation_time: parseInt(doctorForm.consultationTime),
                    min_wait_time: parseInt(doctorForm.minWaitTime),
                    opening_time: doctorForm.openingTime,
                    closing_time: doctorForm.closingTime,
                    experience: parseInt(doctorForm.experience || '0'),
                    doctor_id: user.id,
                    certificate: certificateData
                })
            })

            const data = await response.json()
            if (data.success) {
                alert('Clinic Added Successfully!')
                const profileRes = await fetch(`${API_URL}/doctor/me?email=${user.email}`)
                const profileData = await profileRes.json()
                setDoctorClinics(profileData.clinics)
                setCurrentClinicId(data.data.id)
                setView('doctor-dashboard')
                fetchDoctorAppointments(user.id)
            }
        } catch (error) {
            alert('Setup failed. Please try again.')
        }
    }

    const handleUpdateUser = async () => {
        try {
            const response = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    age: parseInt(age),
                    gender
                })
            })
            const data = await response.json()
            if (data.success) {
                setUser(data.data)
                alert('Profile updated successfully!')
            }
        } catch (error) {
            alert('Update failed')
        }
    }

    const handleUpdateClinic = async () => {
        if (!currentClinicId) return
        try {
            let updatePayload: any = {
                name: doctorForm.clinicName,
                locality: doctorForm.locality,
                address: doctorForm.address,
                specialization: doctorForm.specialization,
                consultation_time: parseInt(doctorForm.consultationTime),
                min_wait_time: parseInt(doctorForm.minWaitTime),
                opening_time: doctorForm.openingTime,
                closing_time: doctorForm.closingTime,
                experience: parseInt(doctorForm.experience || '0')
            }

            if (doctorForm.degreeFile) {
                const certificateData = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => resolve(reader.result as string)
                    reader.readAsDataURL(doctorForm.degreeFile!)
                })
                updatePayload.certificate_url = certificateData
                updatePayload.verification_status = 'pending'
            }

            const response = await fetch(`${API_URL}/clinics/${currentClinicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            })
            const data = await response.json()
            if (data.success) {
                alert('Clinic updated successfully!')
                const updatedClinics = doctorClinics.map(c => c.id === currentClinicId ? data.data : c)
                setDoctorClinics(updatedClinics)
            }
        } catch (error) {
            alert('Clinic update failed')
        }
    }

    const renderAbout = () => (
        <div className="about-page" style={{ padding: '80px 40px', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
            <button className="btn-text" onClick={() => setView('landing')} style={{ marginBottom: '40px', color: 'var(--primary-blue)' }}>← Back to Home</button>
            <h1 style={{ fontSize: '48px', marginBottom: '24px' }}>About <span style={{ color: 'var(--primary-blue)' }}>ClinicQ</span></h1>
            <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '32px', color: 'var(--text-secondary)' }}>
                ClinicQ is a mission-driven digital platform dedicated to transforming the healthcare experience for local communities.
                We believe that quality time with your doctor shouldn't be preceded by hours of anxious waiting in crowded rooms.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px' }}>
                <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Our Mission</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        To reduce patient anxiety and clinical congestion through smart, real-time queue management technology.
                        We aim to make healthcare access as seamless as booking a ride or ordering food.
                    </p>
                </div>
                <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>For Patients</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Track your queue position from the comfort of your home. Get accurate wait time estimates and arrive
                        just when the doctor is ready to see you.
                    </p>
                </div>
                <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>For Doctors</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Streamline your patient flow, manage emergencies with priority handling, and reduce waiting room
                        crowding, allowing you to focus on what matters most—patient care.
                    </p>
                </div>
                <div>
                    <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>Technology</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Built with modern web technologies including React and FastAPI, ClinicQ uses intelligent
                        algorithms to predict wait times based on live clinical throughput.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '80px', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--bg-border)', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '16px' }}>Join the Healthcare Revolution</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Whether you're a doctor looking to manage your clinic or a patient looking for care.</p>
                <button className="btn-primary" onClick={() => setView('login')}>Get Started Today</button>
            </div>
        </div>
    )

    const fetchPendingClinics = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/pending-clinics`)
            const data = await response.json()
            if (data.success) {
                setPendingClinics(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch pending clinics:', error)
        }
    }

    const handleVerifyClinic = async (clinicId: number, status: 'approved' | 'rejected') => {
        try {
            const response = await fetch(`${API_URL}/admin/verify-clinic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clinic_id: clinicId, status })
            })
            const data = await response.json()
            if (data.success) {
                alert(`Clinic ${status} successfully!`)
                fetchPendingClinics()
            }
        } catch (error) {
            alert('Failed to verify clinic')
        }
    }

    const updateAppointmentStatus = async (aptId: number, status: 'completed' | 'warning' | 'fake_emergency' | 'in_progress') => {
        try {
            if (status === 'warning') {
                const reason = prompt("Enter warning message for user (e.g., 'Please arrive on time'):")
                if (!reason) return
            }

            if (status === 'fake_emergency') {
                const confirm = window.confirm("Are you sure you want to report this as a fake emergency? This will be flagged in the patient's record.")
                if (!confirm) return
            }

            const response = await fetch(`${API_URL}/appointments/${aptId}/status?status=${status}`, {
                method: 'PUT'
            })
            const data = await response.json()
            if (data.success) {
                if (status === 'completed') alert('Patient marked as Visited')
                else if (status === 'warning') alert('Warning sent to patient')
                else if (status === 'fake_emergency') alert('Fake emergency reported successfully')
                else if (status === 'in_progress') alert('Patient is now in consultation')

                fetchDoctorAppointments(user.id) // Refresh list
                fetchClinics() // Refresh clinic stats globally
            }
        } catch (error) {
            alert('Failed to update status')
        }
    }

    const renderDoctorSetup = () => (
        <div className="auth-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
            <h2>👨‍⚕️ Complete Your Profile</h2>
            <p className="subtitle">Set up your clinic details to start accepting appointments.</p>

            <div className="form-grid" style={{ display: 'grid', gap: '15px' }}>
                <div className="input-group">
                    <label>Specialization / Profession *</label>
                    <input
                        className="input"
                        placeholder="e.g. Cardiologist, General Physician"
                        value={doctorForm.specialization}
                        onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Clinic Name *</label>
                    <input
                        className="input"
                        placeholder="e.g. HealthFirst Clinic"
                        value={doctorForm.clinicName}
                        onChange={e => setDoctorForm({ ...doctorForm, clinicName: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Years of Experience</label>
                    <input
                        type="number"
                        className="input"
                        placeholder="e.g. 10"
                        value={doctorForm.experience}
                        onChange={e => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Clinic Address *</label>
                    <textarea
                        className="input"
                        rows={3}
                        placeholder="Full address for navigation"
                        value={doctorForm.address}
                        onChange={e => setDoctorForm({ ...doctorForm, address: e.target.value })}
                    />
                </div>

                <div className="input-group">
                    <label>Locality</label>
                    <select
                        className="input"
                        value={doctorForm.locality}
                        onChange={e => setDoctorForm({ ...doctorForm, locality: e.target.value })}
                    >
                        <option value="Airoli">Airoli</option>
                        <option value="Vashi">Vashi</option>
                        <option value="Nerul">Nerul</option>
                    </select>
                </div>

                <div className="input-row" style={{ display: 'flex', gap: '15px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Min Wait Time (min) *</label>
                        <input
                            type="number"
                            className="input"
                            value={doctorForm.minWaitTime}
                            onChange={e => setDoctorForm({ ...doctorForm, minWaitTime: e.target.value })}
                        />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Consultation Time (min) *</label>
                        <input
                            type="number"
                            className="input"
                            value={doctorForm.consultationTime}
                            onChange={e => setDoctorForm({ ...doctorForm, consultationTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="input-row" style={{ display: 'flex', gap: '15px' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Opening Time *</label>
                        <input
                            type="time"
                            className="input"
                            value={doctorForm.openingTime}
                            onChange={e => setDoctorForm({ ...doctorForm, openingTime: e.target.value })}
                        />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                        <label>Closing Time *</label>
                        <input
                            type="time"
                            className="input"
                            value={doctorForm.closingTime}
                            onChange={e => setDoctorForm({ ...doctorForm, closingTime: e.target.value })}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label>Degree Certificate / Medical License *</label>
                    <input
                        type="file"
                        className="input"
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => setDoctorForm({ ...doctorForm, degreeFile: e.target.files ? e.target.files[0] : null })}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>This will be manually verified by our admins.</p>
                </div>

                <button className="btn-primary full-width" onClick={handleDoctorSetupSubmit} style={{ marginTop: '20px' }}>
                    Create Clinic & Start Practicing
                </button>
            </div>
        </div>
    )

    const renderProfile = () => (
        <div className="dashboard">
            <nav className="dashboard-nav">
                <div className="nav-brand" onClick={() => setView(user?.role === 'doctor' ? 'doctor-dashboard' : 'dashboard')} style={{ cursor: 'pointer' }}>
                    ← Back to Dashboard
                </div>
                <h2>Edit Profile</h2>
                <div />
            </nav>

            <div className="dashboard-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--bg-border)', marginBottom: '30px' }}>
                    <h3>👤 Personal Information</h3>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="input-group">
                            <label>Name</label>
                            <input className="input" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Age</label>
                            <input className="input" type="number" value={age} onChange={e => setAge(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Gender</label>
                            <select className="input" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleUpdateUser}>Save Personal Info</button>
                </div>

                {user?.role === 'doctor' && (
                    <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--bg-border)' }}>
                        <h3>🏥 Clinic Information</h3>

                        <div className="clinic-list" style={{ marginBottom: '20px', display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                            {doctorClinics.map(c => (
                                <button
                                    key={c.id}
                                    className={`btn-outline ${currentClinicId === c.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentClinicId(c.id)
                                        setDoctorForm({
                                            ...doctorForm,
                                            clinicName: c.name,
                                            specialization: c.specialization,
                                            address: c.address,
                                            locality: c.locality,
                                            consultationTime: c.consultation_time.toString(),
                                            minWaitTime: (c.min_wait_time || 10).toString(),
                                            openingTime: c.opening_time || '09:00',
                                            closingTime: c.closing_time || '21:00',
                                            experience: c.experience.toString()
                                        })
                                    }}
                                    style={{ whiteSpace: 'nowrap', background: currentClinicId === c.id ? 'var(--primary-blue)' : 'transparent', color: currentClinicId === c.id ? 'white' : 'var(--text-primary)' }}
                                >
                                    {c.name}
                                </button>
                            ))}
                            <button className="btn-text"
                                onClick={() => {
                                    setDoctorForm({
                                        clinicName: '',
                                        specialization: '',
                                        address: '',
                                        locality: 'Airoli',
                                        experience: '',
                                        consultationTime: '15',
                                        minWaitTime: '10',
                                        openingTime: '09:00',
                                        closingTime: '21:00',
                                        degreeFile: null
                                    })
                                    setView('doctor-setup')
                                }}
                                style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}
                            >
                                + Add New Clinic
                            </button>
                        </div>

                        {currentClinicId && (
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label>Clinic Name</label>
                                    <input className="input" value={doctorForm.clinicName} onChange={e => setDoctorForm({ ...doctorForm, clinicName: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Specialization</label>
                                    <input className="input" value={doctorForm.specialization} onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Address</label>
                                    <textarea className="input" value={doctorForm.address} onChange={e => setDoctorForm({ ...doctorForm, address: e.target.value })} rows={2} />
                                </div>
                                <div className="input-group">
                                    <label>Opening Time</label>
                                    <input className="input" type="time" value={doctorForm.openingTime} onChange={e => setDoctorForm({ ...doctorForm, openingTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Closing Time</label>
                                    <input className="input" type="time" value={doctorForm.closingTime} onChange={e => setDoctorForm({ ...doctorForm, closingTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Min Wait Time (min)</label>
                                    <input className="input" type="number" value={doctorForm.minWaitTime} onChange={e => setDoctorForm({ ...doctorForm, minWaitTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Consultation Time (min)</label>
                                    <input className="input" type="number" value={doctorForm.consultationTime} onChange={e => setDoctorForm({ ...doctorForm, consultationTime: e.target.value })} />
                                </div>
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Update Degree Certificate / Medical License</label>
                                    <input
                                        type="file"
                                        className="input"
                                        accept=".pdf,.jpg,.png"
                                        onChange={(e) => setDoctorForm({ ...doctorForm, degreeFile: e.target.files ? e.target.files[0] : null })}
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Note: This will reset your verification status to 'pending'.</p>
                                </div>
                            </div>
                        )}
                        <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleUpdateClinic}>Update Clinic Info</button>
                    </div>
                )}
            </div>
        </div>
    )

    const renderDoctorDashboard = () => {
        const currentClinic = doctorClinics.find(c => c.id === currentClinicId)

        return (
            <div className="dashboard">
                {currentClinic?.verification_status === 'pending' && (
                    <div style={{ background: '#f59e0b', color: '#fff', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        ⏳ Clinic Verification Pending: Your clinic will be visible to patients once an admin approves your certificate.
                    </div>
                )}
                {currentClinic?.verification_status === 'rejected' && (
                    <div style={{ background: '#ef4444', color: '#fff', padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                        ❌ Clinic Verification Rejected: Please contact admin or update your clinic details.
                    </div>
                )}
                {currentClinic?.verification_status === 'approved' && (
                    <div style={{ background: '#10b981', color: '#fff', padding: '8px', textAlign: 'center', fontWeight: '500', fontSize: '13px' }}>
                        ✅ Verified Clinic: Active and visible to patients.
                    </div>
                )}
                <nav className="dashboard-nav">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="nav-brand" onClick={() => setView('profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="doctor-profile-logo" style={{
                                width: '45px',
                                height: '45px',
                                background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                boxShadow: '0 4px 12px rgba(0, 114, 255, 0.3)',
                                border: '2px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                🩺
                            </div>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', borderLeft: '1px solid var(--bg-border)', paddingLeft: '20px', color: 'var(--primary-blue)' }}>
                            {currentClinic?.name || 'Doctor Panel'}
                        </div>
                    </div>
                    <button className="btn-logout" onClick={() => {
                        setUser(null);
                        setView('landing');
                    }}>Logout</button>
                </nav>

                <div className="dashboard-content">
                    <div className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Welcome, {user?.name || 'Doctor'}</h1>
                            <p>Managing queue for: <strong>{currentClinic?.name}</strong> ({currentClinic?.locality})</p>
                        </div>
                        {doctorClinics.length > 1 && (
                            <div className="clinic-selector">
                                <label style={{ marginRight: '10px' }}>Switch Clinic:</label>
                                <select
                                    className="filter-select"
                                    value={currentClinicId || ''}
                                    onChange={(e) => {
                                        const id = parseInt(e.target.value)
                                        setCurrentClinicId(id)
                                        fetchDoctorAppointments(user.id)
                                    }}
                                >
                                    {doctorClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="doctor-actions" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <button className="btn-outline" onClick={() => fetchDoctorAppointments(user.id)}>🔄 Refresh List</button>
                        <button className="btn-primary" onClick={() => {
                            const newStatus = currentClinic?.queue_status === 'open' ? 'closed' : 'open'
                            handleUpdateClinicStatus(newStatus)
                        }}>
                            {currentClinic?.queue_status === 'open' ? '🔴 Close Queue' : '🟢 Open Queue'}
                        </button>
                    </div>

                    <div className="appointments-list">
                        {doctorAppointments.length === 0 ? (
                            <div className="empty-state">
                                <p>No active appointments for this clinic.</p>
                            </div>
                        ) : (
                            <div className="appointments-grid" style={{ display: 'grid', gap: '15px' }}>
                                {doctorAppointments
                                    .filter(apt => apt.doctor_clinic_id === currentClinicId)
                                    .map(apt => (
                                        <div key={apt.id} className="appointment-card" style={{
                                            borderLeft: apt.is_emergency ? '4px solid red' : '4px solid var(--primary-blue)',
                                            background: 'var(--bg-card)', padding: '15px', borderRadius: '8px',
                                            boxShadow: apt.is_emergency ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {apt.is_emergency && <span style={{ color: '#ef4444' }}>🚨 PRIORITY</span>}
                                                    Patient: {apt.patient_name || 'Unknown'}
                                                </h3>
                                                <span className="status-badge" style={{ background: apt.is_emergency ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 123, 255, 0.2)', color: apt.is_emergency ? '#ef4444' : 'var(--primary-blue)' }}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                            <p>📱 {apt.patient_phone} | Age: {apt.patient_age}</p>
                                            <p>Token: <strong style={{ fontSize: '18px', color: 'var(--primary-blue)' }}>#{apt.queue_position}</strong></p>

                                            {apt.is_emergency && <p style={{ color: '#ef4444', fontWeight: 'bold' }}>🚨 Emergency: {apt.emergency_reason}</p>}

                                            <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                {apt.status === 'completed' || apt.status === 'fake_emergency_reported' ? (
                                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                                        <button
                                                            className="btn-primary"
                                                            style={{ backgroundColor: 'var(--bg-border)', color: 'var(--text-secondary)', cursor: 'default', flex: 1 }}
                                                            disabled
                                                        >
                                                            ✅ Visited
                                                        </button>
                                                        {apt.is_emergency && apt.status === 'completed' && (
                                                            <button
                                                                className="btn-outline"
                                                                style={{ borderColor: '#f59e0b', color: '#f59e0b', flex: 1 }}
                                                                onClick={() => updateAppointmentStatus(apt.id, 'fake_emergency')}
                                                            >
                                                                🚩 Report Fake Emergency
                                                            </button>
                                                        )}
                                                        {apt.status === 'fake_emergency_reported' && (
                                                            <button
                                                                className="btn-outline"
                                                                style={{ borderColor: '#ef4444', color: '#ef4444', cursor: 'default', flex: 1 }}
                                                                disabled
                                                            >
                                                                🚩 Reported Fake
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', width: '100%' }}>
                                                        {apt.status !== 'in_progress' && (
                                                            <button
                                                                className="btn-primary"
                                                                style={{ backgroundColor: '#f59e0b', flex: 1, minWidth: '120px' }}
                                                                onClick={() => updateAppointmentStatus(apt.id, 'in_progress')}
                                                            >
                                                                ⌛ In Progress
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-primary"
                                                            style={{ backgroundColor: '#10b981', flex: 1, minWidth: '120px' }}
                                                            onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                                                        >
                                                            ✅ Mark Visited
                                                        </button>
                                                        <button
                                                            className="btn-outline"
                                                            style={{ borderColor: '#ef4444', color: '#ef4444', flex: 1, minWidth: '120px' }}
                                                            onClick={() => updateAppointmentStatus(apt.id, 'warning')}
                                                        >
                                                            ⚠️ Send Alert
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const handleUpdateClinicStatus = async (status: string) => {
        if (!currentClinicId) return
        try {
            const response = await fetch(`${API_URL}/clinics/${currentClinicId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue_status: status })
            })
            const data = await response.json()
            if (data.success) {
                const updatedClinics = doctorClinics.map(c => c.id === currentClinicId ? data.data : c)
                setDoctorClinics(updatedClinics)
            }
        } catch (error) {
            alert('Failed to update status')
        }
    }

    const renderAdminDashboard = () => (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h1>🛡️ Admin Verification Hub</h1>
                    <button
                        className="btn-outline"
                        onClick={fetchPendingClinics}
                        style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        🔄 Refresh List
                    </button>
                </div>
                <button className="btn-outline" onClick={() => setView('landing')}>Logout</button>
            </div>

            {pendingClinics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--bg-border)' }}>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>No pending clinic verifications at the moment.</p>
                </div>
            ) : (
                <div className="clinic-list" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {pendingClinics.map(clinic => (
                        <div key={clinic.id} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--bg-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <h2 style={{ marginBottom: '10px' }}>{clinic.name}</h2>
                                    <p>🩺 <strong>Dr. {clinic.doctor_name}</strong> ({clinic.specialization})</p>
                                    <p>📍 {clinic.address}</p>
                                    <p>📅 Experience: {clinic.experience} years</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <button
                                            className="btn-outline"
                                            style={{ display: 'inline-block' }}
                                            onClick={() => setSelectedCert(clinic.certificate_url || 'Clinic Medical License')}
                                        >
                                            📄 View Certificate
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={() => handleVerifyClinic(clinic.id, 'approved')}>Approve</button>
                                        <button className="btn-primary" style={{ backgroundColor: '#ef4444' }} onClick={() => handleVerifyClinic(clinic.id, 'rejected')}>Reject</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Certificate Viewer Modal */}
            {selectedCert && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '30px',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        border: '1px solid var(--bg-border)',
                        color: 'var(--text-primary)'
                    }}>
                        <button
                            onClick={() => setSelectedCert(null)}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '20px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                fontSize: '24px',
                                cursor: 'pointer'
                            }}
                        >
                            ✖️
                        </button>
                        <h2 style={{ marginBottom: '20px' }}>Certificate Verification</h2>
                        <div style={{
                            background: '#fff',
                            color: '#333',
                            padding: '20px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            minHeight: '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '10px double #ddd'
                        }}>
                            {selectedCert.startsWith('data:') ? (
                                selectedCert.includes('pdf') ? (
                                    <iframe src={selectedCert} style={{ width: '100%', height: '500px', border: 'none' }} title="Certificate PDF" />
                                ) : (
                                    <img src={selectedCert} alt="Certificate" style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: '8px' }} />
                                )
                            ) : (
                                <>
                                    <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎓</div>
                                    <h1 style={{ fontFamily: 'serif', marginBottom: '20px' }}>MEDICAL LICENSE</h1>
                                    <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>This certifies that the doctor associated with</p>
                                    <h2 style={{ color: 'var(--primary-blue)', marginBottom: '10px' }}>{selectedCert}</h2>
                                    <p>has submitted the required documentation for registration.</p>
                                    <div style={{ marginTop: '40px', borderTop: '1px solid #000', width: '200px', padding: '10px' }}>
                                        <em style={{ fontSize: '12px' }}>Authorized Signature</em>
                                    </div>
                                </>
                            )}
                        </div>
                        <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            File Reference: {selectedCert.startsWith('data:') ? 'Attached Document' : selectedCert}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <>
            {view === 'landing' && renderLanding()}
            {view === 'about' && renderAbout()}
            {view === 'login' && renderLogin()}
            {view === 'dashboard' && renderDashboard()}
            {view === 'doctor-setup' && renderDoctorSetup()}
            {view === 'doctor-dashboard' && renderDoctorDashboard()}
            {view === 'admin-dashboard' && renderAdminDashboard()}
            {view === 'profile' && renderProfile()}
        </>
    )
}

export default App
