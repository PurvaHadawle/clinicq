# ClinicQ - Digital Queue Management System

## 🏥 Project Overview

**ClinicQ** is a comprehensive digital queue management system designed for small local clinics. It reduces patient waiting time through real-time queue tracking, smart appointment scheduling, and priority handling for emergencies.

## 📁 Project Structure

```
clinic-queue-system/
├── SYSTEM_DESIGN_DOCUMENT.md    # Complete product & technical documentation
├── api-documentation.yaml        # OpenAPI 3.0 API specification
├── backend/                      # FastAPI backend
│   ├── main.py                  # Main application server
│   └── requirements.txt         # Python dependencies
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx             # Main application component
│   │   └── index.css           # Healthcare design system
│   └── package.json
└── README.md                     # This file
```

## 🚀 Quick Start

### Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Backend will run on: **http://localhost:8000**
API Documentation: **http://localhost:8000/docs**

### Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not done)
npm install

# Run development server
npm run dev
```

Frontend will run on: **http://localhost:5173**

## 👤 Demo Credentials

**Patient Login:**
- Phone: `1234567890`
- Password: `demo123`

**Doctor Login:**
- Phone: `9876543210`
- Password: `demo123`

## ✨ Key Features

### Patient Features
- ✅ Browse clinics by locality
- ✅ Real-time queue position tracking
- ✅ Accurate wait time estimation
- ✅ Book appointments instantly
- ✅ "I've reached clinic" confirmation
- ✅ Emergency request with reason
- ✅ Rate clinic after visit

### Doctor Features
- ✅ Today's queue overview
- ✅ Emergency vs regular queue separation
- ✅ One-click patient completion
- ✅ Approve/reject emergency requests
- ✅ Queue auto-advances on visit completion
- ✅ Set average consultation time
- ✅ Pause/close queue controls

## 🎨 Design Highlights

### Healthcare-Friendly UI
- **Soft Color Palette**: Blue (#4A90E2), Teal (#5ABFAB), Green (#7ED321)
- **Rounded Components**: 8-16px border radius for approachability
- **Large Touch Targets**: 48×48px minimum for elderly accessibility
- **Calm Aesthetics**: Reduces patient anxiety

### Accessibility (WCAG 2.1 AA)
- ✅ 4.5:1 contrast ratio for text
- ✅ Large fonts (16px+ body text)
- ✅ Screen reader compatible
- ✅ Keyboard navigation support

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Clinics
- `GET /api/clinics` - List all clinics (with filters)
- `GET /api/clinics/{id}` - Get clinic details

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/my` - Get my appointments
- `PUT /api/appointments/{id}/arrive` - Mark "I've arrived"

### Queue
- `GET /api/queue/{clinic_id}` - Get current queue state
- `GET /api/queue/my-position/{appointment_id}` - Get my position

### Emergency (Patient)
- `POST /api/emergency` - Request emergency priority
- `GET /api/emergency/status/{id}` - Check status

### Doctor
- `GET /api/doctor/queue` - Get today's queue
- `PUT /api/doctor/appointments/{id}/visit` - Mark as visited
- `PUT /api/doctor/emergencies/{id}/approve` - Approve emergency
- `PUT /api/doctor/emergencies/{id}/reject` - Reject emergency

Full API documentation: `api-documentation.yaml`

## 🗄️ Database Schema (Current: In-Memory)

The demo uses in-memory data structures. For production, PostgreSQL schema is provided in `SYSTEM_DESIGN_DOCUMENT.md`:

- **users** - Patient and doctor accounts
- **clinics** - Clinic information
- **doctor_clinic** - Doctor-clinic associations
- **appointments** - Appointment bookings
- **emergency_log** - Emergency request tracking
- **ratings** - Clinic ratings and feedback

## 🧮 Queue Algorithm

**Hybrid FIFO + Priority Queue:**
- Emergency requests use a min-heap (priority queue)
- Regular appointments use FIFO (deque)
- Emergencies always processed before regular patients
- Wait time = (patients_ahead × avg_consultation_time) × 1.1

## 🔌 Real-Time Updates

- **WebSocket endpoint**: `/ws/queue/{clinic_id}`
- Broadcasts queue updates to all connected patients
- Auto-refresh every 30 seconds
- Instant updates on:
  - Patient completion
  - Emergency approval
  - Queue position changes

## 📊 Tech Stack

| Layer | Technology | Why? |
|-------|-----------|------|
| **Backend** | FastAPI | Async support, WebSocket, auto docs |
| **Frontend** | React + Vite | Modern, component-based, fast |
| **Database** | PostgreSQL (planned) | ACID, JSON support, triggers |
| **Cache** | Redis (planned) | Session storage, queue state |
| **Real-time** | WebSocket | Live queue updates |

## 📖 Documentation

1. **System Design Document** (`SYSTEM_DESIGN_DOCUMENT.md`)
   - Complete product design + architecture
   - UI/UX design system
   - Database schema with SQL
   - Queue algorithm implementation
   - Research gap analysis
   - Future enhancements

2. **API Documentation** (`api-documentation.yaml`)
   - OpenAPI 3.0 specification
   - All endpoints with examples
   - Request/response schemas
   - View at: http://localhost:8000/docs

## 🎯 Success Metrics

**Patient Satisfaction:**
- 60%+ reduction in perceived wait time
- 4.5+ star average rating

**Operational Efficiency:**
- 40% reduction in no-shows
- 20% increase in daily throughput

## 🔮 Future Enhancements

### Phase 2 (6-12 months)
- AI-powered wait time prediction
- Telemedicine integration
- Multi-language support (Hindi, Marathi, Tamil)
- Digital prescription management

### Phase 3 (12-24 months)
- Symptom checker & triage
- Insurance integration
- Unified health records
- Analytics dashboard

## 🧪 Testing

**Manual Testing Flow:**

1. **Patient Flow:**
   - Login as patient (1234567890 / demo123)
   - Browse clinics in "Airoli" locality
   - Book appointment at any clinic
   - See queue position and wait time
   - Mark "I've reached clinic"

2. **Doctor Flow:**
   - Login as doctor (9876543210 / demo123)
   - View today's queue with patients
   - Mark first patient as "Visited"
   - Queue auto-advances to next patient

3. **Emergency Flow:**
   - As patient, request emergency from queue screen
   - As doctor, approve/reject emergency request
   - See emergency patient moved to top of queue

## 🤝 Contributing

This is an engineering project for educational purposes. Contributions and feedback are welcome!

## 📄 License

Educational project - Free to use for learning purposes

## 👨‍💻 Author

**Engineering Project**: Digital Queue Management System for Local Clinics

---

**For complete technical documentation, see `SYSTEM_DESIGN_DOCUMENT.md`**
