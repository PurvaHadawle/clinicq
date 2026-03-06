from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json
import time
from collections import deque
from heapq import heappush, heappop

app = FastAPI(title="ClinicQ API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should list specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ========== IN-MEMORY DATA STORE (Demo) ==========
users_db: Dict[int, dict] = {}
clinics_db: Dict[int, dict] = {}
appointments_db: Dict[int, dict] = {}
emergency_log_db: Dict[int, dict] = {}
ratings_db: List[dict] = []

# ========== SEED DATA ==========

# --- USERS (3 Doctors + 5 Patients + 1 Admin) ---
users_db = {
    # ===== DOCTORS =====
    1: {
        "id": 1,
        "phone": "9876543210",
        "name": "Dr. Anjali Sharma",
        "email": "anjali@doctor.com",
        "age": 38,
        "gender": "Female",
        "role": "doctor",
        "password": "doctor123"
    },
    2: {
        "id": 2,
        "phone": "9876543211",
        "name": "Dr. Rahul Mehta",
        "email": "rahul@doctor.com",
        "age": 45,
        "gender": "Male",
        "role": "doctor",
        "password": "doctor123"
    },
    3: {
        "id": 3,
        "phone": "9876543212",
        "name": "Dr. Priya Singh",
        "email": "priya@doctor.com",
        "age": 42,
        "gender": "Female",
        "role": "doctor",
        "password": "doctor123"
    },

    # ===== PATIENTS =====
    4: {
        "id": 4,
        "phone": "9123456780",
        "name": "Rohan Desai",
        "email": "rohan@patient.com",
        "age": 28,
        "gender": "Male",
        "role": "patient",
        "password": "patient123"
    },
    5: {
        "id": 5,
        "phone": "9123456781",
        "name": "Sneha Kulkarni",
        "email": "sneha@patient.com",
        "age": 32,
        "gender": "Female",
        "role": "patient",
        "password": "patient123"
    },
    6: {
        "id": 6,
        "phone": "9123456782",
        "name": "Amit Patil",
        "email": "amit@patient.com",
        "age": 55,
        "gender": "Male",
        "role": "patient",
        "password": "patient123"
    },
    7: {
        "id": 7,
        "phone": "9123456783",
        "name": "Kavita Joshi",
        "email": "kavita@patient.com",
        "age": 24,
        "gender": "Female",
        "role": "patient",
        "password": "patient123"
    },
    8: {
        "id": 8,
        "phone": "9123456784",
        "name": "Vikram Rao",
        "email": "vikram@patient.com",
        "age": 40,
        "gender": "Male",
        "role": "patient",
        "password": "patient123"
    },

    # ===== ADMIN =====
    9: {
        "id": 9,
        "phone": "9000000000",
        "name": "Super Admin",
        "email": "admin@clinicq.com",
        "age": 35,
        "gender": "Other",
        "role": "admin",
        "password": "admin123"
    }
}

# --- CLINICS (6 clinics linked to the 3 doctors, mixed statuses) ---
clinics_db = {
    1: {
        "id": 1,
        "name": "Sharma Family Clinic",
        "locality": "Airoli",
        "address": "Shop 12, Sector 8, Airoli, Navi Mumbai 400708",
        "phone": "9876543210",
        "rating_avg": 4.7,
        "total_ratings": 120,
        "specialization": "General Physician",
        "doctor_name": "Dr. Anjali Sharma",
        "doctor_id": 1,
        "consultation_time": 15,
        "min_wait_time": 10,
        "opening_time": "09:00",
        "closing_time": "18:00",
        "experience": 12,
        "queue_status": "open",
        "verification_status": "approved",
        "certificate_url": "approved_cert_sharma.pdf"
    },
    2: {
        "id": 2,
        "name": "CarePlus Pediatrics",
        "locality": "Airoli",
        "address": "Plot 45, Sector 5, Airoli, Navi Mumbai 400708",
        "phone": "9876543211",
        "rating_avg": 4.5,
        "total_ratings": 85,
        "specialization": "Pediatrician",
        "doctor_name": "Dr. Rahul Mehta",
        "doctor_id": 2,
        "consultation_time": 20,
        "min_wait_time": 15,
        "opening_time": "10:00",
        "closing_time": "20:00",
        "experience": 18,
        "queue_status": "open",
        "verification_status": "approved",
        "certificate_url": "approved_cert_mehta.pdf"
    },
    3: {
        "id": 3,
        "name": "HeartCare Wellness Center",
        "locality": "Vashi",
        "address": "1st Floor, Shopprix Mall, Sector 12, Vashi, Navi Mumbai 400703",
        "phone": "9876543212",
        "rating_avg": 4.8,
        "total_ratings": 200,
        "specialization": "Cardiologist",
        "doctor_name": "Dr. Priya Singh",
        "doctor_id": 3,
        "consultation_time": 25,
        "min_wait_time": 20,
        "opening_time": "08:00",
        "closing_time": "16:00",
        "experience": 15,
        "queue_status": "open",
        "verification_status": "approved",
        "certificate_url": "approved_cert_singh.pdf"
    },
    4: {
        "id": 4,
        "name": "Sharma Skin & Hair Clinic",
        "locality": "Nerul",
        "address": "Shop 3, D-Mart Complex, Sector 21, Nerul, Navi Mumbai 400706",
        "phone": "9876543210",
        "rating_avg": 4.3,
        "total_ratings": 60,
        "specialization": "Dermatologist",
        "doctor_name": "Dr. Anjali Sharma",
        "doctor_id": 1,
        "consultation_time": 20,
        "min_wait_time": 15,
        "opening_time": "14:00",
        "closing_time": "21:00",
        "experience": 12,
        "queue_status": "open",
        "verification_status": "approved",
        "certificate_url": "approved_cert_sharma_derm.pdf"
    },
    5: {
        "id": 5,
        "name": "Mehta Children's Hospital",
        "locality": "Vashi",
        "address": "Near Vashi Railway Station, Sector 9, Vashi, Navi Mumbai 400703",
        "phone": "9876543211",
        "rating_avg": 0,
        "total_ratings": 0,
        "specialization": "Pediatric Surgery",
        "doctor_name": "Dr. Rahul Mehta",
        "doctor_id": 2,
        "consultation_time": 30,
        "min_wait_time": 20,
        "opening_time": "09:00",
        "closing_time": "17:00",
        "experience": 18,
        "queue_status": "closed",
        "verification_status": "pending",
        "certificate_url": "pending_cert_mehta_surgery.pdf"
    },
    6: {
        "id": 6,
        "name": "Singh Heart & Lung Institute",
        "locality": "Nerul",
        "address": "2nd Floor, Seawoods Grand Central, Nerul, Navi Mumbai 400706",
        "phone": "9876543212",
        "rating_avg": 0,
        "total_ratings": 0,
        "specialization": "Pulmonologist",
        "doctor_name": "Dr. Priya Singh",
        "doctor_id": 3,
        "consultation_time": 30,
        "min_wait_time": 25,
        "opening_time": "10:00",
        "closing_time": "18:00",
        "experience": 15,
        "queue_status": "closed",
        "verification_status": "pending",
        "certificate_url": "pending_cert_singh_lung.pdf"
    }
}

# --- APPOINTMENTS (8 pre-booked, various statuses) ---
appointments_db = {
    1: {
        "id": 1,
        "doctor_clinic_id": 1,
        "patient_id": 4,
        "patient_name": "Rohan Desai",
        "patient_phone": "9123456780",
        "doctor_id": 1,
        "queue_position": 1,
        "status": "in_progress",
        "is_emergency": False,
        "booked_at": "2026-03-02T08:30:00",
        "estimated_wait": 0
    },
    2: {
        "id": 2,
        "doctor_clinic_id": 1,
        "patient_id": 5,
        "patient_name": "Sneha Kulkarni",
        "patient_phone": "9123456781",
        "doctor_id": 1,
        "queue_position": 2,
        "status": "waiting",
        "is_emergency": False,
        "booked_at": "2026-03-02T08:35:00",
        "estimated_wait": 15
    },
    3: {
        "id": 3,
        "doctor_clinic_id": 1,
        "patient_id": 6,
        "patient_name": "Amit Patil",
        "patient_phone": "9123456782",
        "doctor_id": 1,
        "queue_position": 3,
        "status": "waiting",
        "is_emergency": True,
        "booked_at": "2026-03-02T08:40:00",
        "estimated_wait": 10
    },
    4: {
        "id": 4,
        "doctor_clinic_id": 2,
        "patient_id": 7,
        "patient_name": "Kavita Joshi",
        "patient_phone": "9123456783",
        "doctor_id": 2,
        "queue_position": 1,
        "status": "in_progress",
        "is_emergency": False,
        "booked_at": "2026-03-02T09:00:00",
        "estimated_wait": 0
    },
    5: {
        "id": 5,
        "doctor_clinic_id": 2,
        "patient_id": 8,
        "patient_name": "Vikram Rao",
        "patient_phone": "9123456784",
        "doctor_id": 2,
        "queue_position": 2,
        "status": "waiting",
        "is_emergency": False,
        "booked_at": "2026-03-02T09:10:00",
        "estimated_wait": 20
    },
    6: {
        "id": 6,
        "doctor_clinic_id": 3,
        "patient_id": 4,
        "patient_name": "Rohan Desai",
        "patient_phone": "9123456780",
        "doctor_id": 3,
        "queue_position": 1,
        "status": "waiting",
        "is_emergency": False,
        "booked_at": "2026-03-02T09:15:00",
        "estimated_wait": 25
    },
    7: {
        "id": 7,
        "doctor_clinic_id": 3,
        "patient_id": 5,
        "patient_name": "Sneha Kulkarni",
        "patient_phone": "9123456781",
        "doctor_id": 3,
        "queue_position": 2,
        "status": "waiting",
        "is_emergency": True,
        "booked_at": "2026-03-02T09:20:00",
        "estimated_wait": 15
    },
    8: {
        "id": 8,
        "doctor_clinic_id": 4,
        "patient_id": 6,
        "patient_name": "Amit Patil",
        "patient_phone": "9123456782",
        "doctor_id": 1,
        "queue_position": 1,
        "status": "completed",
        "is_emergency": False,
        "booked_at": "2026-03-01T14:00:00",
        "estimated_wait": 0
    }
}

# --- RATINGS (sample reviews) ---
ratings_db = [
    {"id": 1, "appointment_id": 8, "clinic_id": 4, "patient_id": 6, "stars": 5, "wait_time_rating": "short", "comment": "Dr. Sharma is very thorough. Skin treatment worked great!", "created_at": "2026-03-01T15:00:00"},
    {"id": 2, "appointment_id": 0, "clinic_id": 1, "patient_id": 7, "stars": 4, "wait_time_rating": "moderate", "comment": "Good clinic, wait was a bit but doctor is excellent.", "created_at": "2026-02-28T10:00:00"},
    {"id": 3, "appointment_id": 0, "clinic_id": 2, "patient_id": 4, "stars": 5, "wait_time_rating": "short", "comment": "Dr. Mehta is amazing with kids. Highly recommend!", "created_at": "2026-02-27T11:00:00"},
    {"id": 4, "appointment_id": 0, "clinic_id": 3, "patient_id": 8, "stars": 5, "wait_time_rating": "short", "comment": "Best cardiologist in Navi Mumbai. Saved my father's life.", "created_at": "2026-02-26T09:00:00"},
]

appointment_counter = 9

# ========== PYDANTIC MODELS ==========
class UserRegister(BaseModel):
    phone: str
    name: str
    email: str # Compulsory
    age: int
    gender: str
    password: str
    role: str

class UserLogin(BaseModel):
    email: str # Use email instead of phone
    password: str

class AppointmentCreate(BaseModel):
    doctor_clinic_id: int
    patient_id: int
    is_emergency: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    password: Optional[str] = None

class ClinicCreate(BaseModel):
    name: str
    locality: str
    address: str
    phone: str
    specialization: str
    consultation_time: int
    min_wait_time: int
    opening_time: str
    closing_time: str
    experience: int
    doctor_id: int
    certificate: Optional[str] = None

class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    locality: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    consultation_time: Optional[int] = None
    min_wait_time: Optional[int] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    experience: Optional[int] = None
    queue_status: Optional[str] = None
    verification_status: Optional[str] = None
    certificate_url: Optional[str] = None

class AdminVerification(BaseModel):
    clinic_id: int
    status: str # approved, rejected
    message: Optional[str] = None

class EmergencyRequest(BaseModel):
    appointment_id: int
    reason: str
    description: Optional[str] = None

class RatingCreate(BaseModel):
    appointment_id: int
    stars: int
    wait_time_rating: Optional[str] = None
    comment: Optional[str] = None

# ========== QUEUE MANAGER ==========
class QueueManager:
    def __init__(self):
        self.queues: Dict[int, dict] = {}  # {clinic_id: {emergency: [], regular: deque()}}
    
    def initialize_queue(self, clinic_id: int):
        if clinic_id not in self.queues:
            self.queues[clinic_id] = {
                "emergency": [],
                "regular": deque()
            }
    
    def add_appointment(self, clinic_id: int, appointment_id: int):
        self.initialize_queue(clinic_id)
        self.queues[clinic_id]["regular"].append(appointment_id)
        return len(self.queues[clinic_id]["regular"])
    
    def add_emergency_appointment(self, clinic_id: int, appointment_id: int):
        self.initialize_queue(clinic_id)
        heappush(self.queues[clinic_id]["emergency"], (time.time(), appointment_id))
        return f"E{len(self.queues[clinic_id]['emergency'])}"
    
    def promote_to_emergency(self, clinic_id: int, appointment_id: int):
        self.initialize_queue(clinic_id)
        # Remove from regular queue
        if appointment_id in self.queues[clinic_id]["regular"]:
            self.queues[clinic_id]["regular"].remove(appointment_id)
        # Add to emergency queue
        heappush(self.queues[clinic_id]["emergency"], (1, appointment_id))
    
    def get_position(self, clinic_id: int, appointment_id: int):
        self.initialize_queue(clinic_id)
        
        # Check emergency queue
        for i, (_, apt_id) in enumerate(self.queues[clinic_id]["emergency"]):
            if apt_id == appointment_id:
                return f"E{i+1}"
        
        # Check regular queue
        for i, apt_id in enumerate(self.queues[clinic_id]["regular"]):
            if apt_id == appointment_id:
                return i + 1
        
        return None
    
    def get_queue_state(self, clinic_id: int):
        self.initialize_queue(clinic_id)
        return {
            "emergency": [apt_id for _, apt_id in self.queues[clinic_id]["emergency"]],
            "regular": list(self.queues[clinic_id]["regular"])
        }
    
    def remove_patient(self, clinic_id: int, appointment_id: int):
        self.initialize_queue(clinic_id)
        
        # Remove from emergency
        self.queues[clinic_id]["emergency"] = [
            (p, apt) for p, apt in self.queues[clinic_id]["emergency"] 
            if apt != appointment_id
        ]
        
        # Remove from regular
        if appointment_id in self.queues[clinic_id]["regular"]:
            self.queues[clinic_id]["regular"].remove(appointment_id)

queue_manager = QueueManager()

# ========== WEBSOCKET MANAGER ==========
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, clinic_id: int):
        await websocket.accept()
        if clinic_id not in self.active_connections:
            self.active_connections[clinic_id] = []
        self.active_connections[clinic_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, clinic_id: int):
        if clinic_id in self.active_connections:
            self.active_connections[clinic_id].remove(websocket)
    
    async def broadcast(self, message: dict, clinic_id: int):
        if clinic_id in self.active_connections:
            for connection in self.active_connections[clinic_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

ws_manager = ConnectionManager()

# ========== HELPER FUNCTIONS ==========
def calculate_wait_time(clinic_id: int, position):
    clinic = clinics_db.get(clinic_id)
    if not clinic:
        return {"wait_minutes": 0, "estimated_turn": "", "patients_ahead": 0}
    
    consultation_time = clinic.get("consultation_time", 15)
    
    if isinstance(position, str):  # Emergency
        emergency_ahead = int(position[1:]) - 1
        patients_ahead = emergency_ahead
    else:  # Regular
        queue_state = queue_manager.get_queue_state(clinic_id)
        emergency_count = len(queue_state["emergency"])
        patients_ahead = emergency_count + position - 1
    
    min_wait = clinic.get("min_wait_time", 10)
    estimated_minutes = max(min_wait, int(patients_ahead * consultation_time * 1.1))
    estimated_turn = (datetime.now() + timedelta(minutes=estimated_minutes)).strftime("%I:%M %p")
    
    return {
        "wait_minutes": estimated_minutes,
        "estimated_turn": estimated_turn,
        "patients_ahead": patients_ahead
    }

# ========== API ENDPOINTS ==========

@app.get("/")
def root():
    return {
        "message": "ClinicQ API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Authentication
@app.post("/api/auth/register")
def register(user: UserRegister):
    print(f"DEBUG: Registering user with email: {user.email}")
    # Check if email exists
    for u in users_db.values():
        if u.get("email", "").lower() == user.email.lower():
            print(f"DEBUG: Registration failed - Email {user.email} already exists")
            raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = len(users_db) + 1
    new_user = {
        "id": user_id,
        **user.model_dump()
    }
    users_db[user_id] = new_user
    print(f"DEBUG: User registered successfully: {user.email} (ID: {user_id})")
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": {k: v for k, v in new_user.items() if k != "password"}
    }

@app.post("/api/auth/login")
def login(credentials: UserLogin):
    print(f"DEBUG: Login attempt for email: {credentials.email}")
    for user in users_db.values():
        if user.get("email", "").lower() == credentials.email.lower():
            if user["password"] == credentials.password:
                print(f"DEBUG: Login successful for email: {credentials.email}")
                return {
                    "success": True,
                    "access_token": f"mock_token_{user['id']}",
                    "user": {k: v for k, v in user.items() if k != "password"}
                }
            else:
                print(f"DEBUG: Login failed - Incorrect password for email: {credentials.email}")
    
    print(f"DEBUG: Login failed - Email {credentials.email} not found")
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Clinics
@app.get("/api/clinics")
def list_clinics(locality: Optional[str] = None, include_pending: bool = False):
    clinics = list(clinics_db.values())
    
    if locality:
        clinics = [c for c in clinics if c["locality"].lower() == locality.lower()]
    
    # By default, only show approved clinics
    if not include_pending:
        clinics = [c for c in clinics if c.get("verification_status") == "approved"]
    
    # Add queue info
    for clinic in clinics:
        # Calculate stats from appointments_db
        clinic_apts = [a for a in appointments_db.values() if a["doctor_clinic_id"] == clinic["id"]]
        
        waiting_count = len([a for a in clinic_apts if a["status"] in ["booked", "waiting"]])
        in_progress_count = len([a for a in clinic_apts if a["status"] == "in_progress"])
        completed_count = len([a for a in clinic_apts if a["status"] == "completed"])
        tokens_today = len(clinic_apts)
        
        clinic["patients_in_queue"] = tokens_today
        clinic["waiting_count"] = waiting_count
        clinic["in_progress_count"] = in_progress_count
        clinic["completed_count"] = completed_count
        clinic["current_wait_time"] = waiting_count * clinic["consultation_time"]
    
    return {"success": True, "data": clinics}

@app.get("/api/clinics/{clinic_id}")
def get_clinic(clinic_id: int):
    clinic = clinics_db.get(clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic_apts = [a for a in appointments_db.values() if a["doctor_clinic_id"] == clinic_id]
    
    waiting_count = len([a for a in clinic_apts if a["status"] in ["booked", "waiting"]])
    in_progress_count = len([a for a in clinic_apts if a["status"] == "in_progress"])
    completed_count = len([a for a in clinic_apts if a["status"] == "completed"])
    tokens_today = len(clinic_apts)
    
    clinic["patients_in_queue"] = tokens_today
    clinic["waiting_count"] = waiting_count
    clinic["in_progress_count"] = in_progress_count
    clinic["completed_count"] = completed_count
    
    return {"success": True, "data": clinic}

@app.post("/api/clinics")
def create_clinic(clinic: ClinicCreate):
    # Check if doctor exists
    if clinic.doctor_id not in users_db:
        raise HTTPException(status_code=404, detail="Doctor not found")

    clinic_id = len(clinics_db) + 1
    new_clinic = {
        "id": clinic_id,
        "name": clinic.name,
        "locality": clinic.locality,
        "address": clinic.address,
        "phone": clinic.phone,
        "rating_avg": 0,
        "total_ratings": 0,
        "specialization": clinic.specialization,
        "doctor_name": users_db[clinic.doctor_id]["name"],
        "doctor_id": clinic.doctor_id,
        "consultation_time": clinic.consultation_time,
        "min_wait_time": clinic.min_wait_time,
        "opening_time": clinic.opening_time,
        "closing_time": clinic.closing_time,
        "experience": clinic.experience,
        "queue_status": "closed",
        "verification_status": "pending",
        "certificate_url": clinic.certificate
    }
    clinics_db[clinic_id] = new_clinic
    return {"success": True, "data": new_clinic}

@app.put("/api/clinics/{clinic_id}")
def update_clinic(clinic_id: int, update_data: ClinicUpdate):
    clinic = clinics_db.get(clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        clinic[key] = value
        
    return {"success": True, "data": clinic}

@app.delete("/api/clinics/{clinic_id}")
def delete_clinic(clinic_id: int):
    clinic = clinics_db.pop(clinic_id, None)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return {"success": True, "message": f"Clinic '{clinic['name']}' (ID {clinic_id}) deleted"}

@app.put("/api/users/{user_id}")
def update_user(user_id: int, update_data: UserUpdate):
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        user[key] = value
        
# Admin Endpoints
@app.get("/api/admin/pending-clinics")
def get_pending_clinics():
    pending = [c for c in clinics_db.values() if c.get("verification_status") == "pending"]
    return {"success": True, "data": pending}

@app.post("/api/admin/verify-clinic")
def verify_clinic(verification: AdminVerification):
    clinic = clinics_db.get(verification.clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic["verification_status"] = verification.status
    return {"success": True, "message": f"Clinic {verification.status}"}

@app.get("/api/doctor/me")
def get_doctor_profile(email: str):
    # Find user
    user = next((u for u in users_db.values() if u.get("email") == email), None)
    if not user or user["role"] != "doctor":
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Find clinics
    doctor_clinics = [c for c in clinics_db.values() if c.get("doctor_id") == user["id"]]
    
    return {
        "success": True, 
        "has_clinic": len(doctor_clinics) > 0,
        "clinics": doctor_clinics,
        "user": user
    }

@app.get("/api/doctor/appointments")
def get_doctor_appointments(doctor_id: int):
    # Find clinic for this doctor
    clinic = next((c for c in clinics_db.values() if c.get("doctor_id") == doctor_id), None)
    if not clinic:
         return {"success": True, "data": []} # No clinic, no appointments
    
    # Get appointments for this clinic
    apts = [a for a in appointments_db.values() if a["doctor_clinic_id"] == clinic["id"]]
    
    # Add patient details
    for apt in apts:
        patient = users_db.get(apt["patient_id"])
        if patient:
            apt["patient_name"] = patient["name"]
            apt["patient_phone"] = patient["phone"]
            apt["patient_age"] = patient["age"]
            apt["patient_gender"] = patient["gender"]
            
    return {"success": True, "data": apts}

@app.put("/api/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, status: str): # status: completed, warning
    apt = appointments_db.get(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if status == 'completed':
        apt["status"] = "completed"
        apt["visited_at"] = datetime.now().isoformat()
        # Remove from queue logic
        clinic_id = apt["doctor_clinic_id"]
        queue_manager.remove_patient(clinic_id, appointment_id)
        
    elif status == 'in_progress':
        apt["status"] = "in_progress"
        apt["started_at"] = datetime.now().isoformat()

    elif status == 'warning':
        apt["status"] = "warning_sent"
        # Logic to notify user would go here
    
    elif status == 'fake_emergency':
        apt["status"] = "fake_emergency_reported"
        # Logic to flag patient for penalty would go here
    
    return {"success": True, "message": f"Status updated to {status}"}

# Appointments
@app.post("/api/appointments")
async def book_appointment(appointment: AppointmentCreate):
    global appointment_counter
    
    clinic = clinics_db.get(appointment.doctor_clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    if clinic["queue_status"] != "open":
        raise HTTPException(status_code=400, detail="Queue is not accepting appointments")
    
    # Create appointment
    apt_id = appointment_counter
    appointment_counter += 1
    
    if appointment.is_emergency:
        position = queue_manager.add_emergency_appointment(clinic["id"], apt_id)
    else:
        position = queue_manager.add_appointment(clinic["id"], apt_id)
    
    appointments_db[apt_id] = {
        "id": apt_id,
        "patient_id": appointment.patient_id,
        "doctor_clinic_id": clinic["id"],
        "queue_position": position,
        "status": "booked",
        "is_emergency": appointment.is_emergency,
        "booked_at": datetime.now().isoformat(),
        "emergency_reason": "Emergency Booking" if appointment.is_emergency else None
    }
    
    wait_info = calculate_wait_time(clinic["id"], position)
    
    # Broadcast queue update
    await ws_manager.broadcast(
        {"type": "queue_update", "clinic_id": clinic["id"]},
        clinic["id"]
    )
    
    return {
        "success": True,
        "data": {
            "appointment_id": apt_id,
            "queue_position": position,
            "estimated_wait": wait_info["wait_minutes"],
            "estimated_turn": wait_info["estimated_turn"],
            "doctor": {
                "name": clinic["doctor_name"],
                "specialization": clinic["specialization"]
            },
            "clinic": {
                "name": clinic["name"],
                "address": clinic["address"]
            }
        }
    }

@app.get("/api/appointments/my")
def my_appointments():
    # Return all appointments with clinic details
    apts = []
    for apt in appointments_db.values():
        clinic = clinics_db.get(apt["doctor_clinic_id"])
        apt_copy = apt.copy()
        if clinic:
            apt_copy["clinic_name"] = clinic["name"]
            apt_copy["clinic_address"] = clinic["address"]
        apts.append(apt_copy)
    return {
        "success": True,
        "data": apts
    }

@app.get("/api/appointments/{appointment_id}")
def get_appointment(appointment_id: int):
    apt = appointments_db.get(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return {"success": True, "data": apt}

@app.put("/api/appointments/{appointment_id}/arrive")
def mark_arrived(appointment_id: int):
    apt = appointments_db.get(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    apt["status"] = "waiting"
    apt["arrived_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "message": "Arrival confirmed. You're in the waiting area."
    }

# Queue
@app.get("/api/queue/{clinic_id}")
def get_queue(clinic_id: int):
    clinic = clinics_db.get(clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    queue_state = queue_manager.get_queue_state(clinic_id)
    
    emergency_queue = []
    for i, apt_id in enumerate(queue_state["emergency"]):
        apt = appointments_db.get(apt_id)
        if apt:
            emergency_queue.append({
                "appointment_id": apt_id,
                "patient_name": f"Patient #{apt_id}",
                "position": f"E{i+1}",
                "reason": apt.get("emergency_reason", "")
            })
    
    regular_queue = []
    for i, apt_id in enumerate(queue_state["regular"]):
        apt = appointments_db.get(apt_id)
        if apt:
            wait_info = calculate_wait_time(clinic_id, i+1)
            regular_queue.append({
                "appointment_id": apt_id,
                "patient_name": f"Patient #{apt_id}",
                "position": i + 1,
                "status": apt["status"],
                "estimated_time": wait_info["estimated_turn"]
            })
    
    return {
        "success": True,
        "data": {
            "doctor_clinic_id": clinic_id,
            "queue_status": clinic["queue_status"],
            "total_patients": len(emergency_queue) + len(regular_queue),
            "emergency_queue": emergency_queue,
            "regular_queue": regular_queue,
            "avg_wait_time": clinic["consultation_time"],
            "last_updated": datetime.now().isoformat()
        }
    }

@app.get("/api/queue/my-position/{appointment_id}")
def get_my_position(appointment_id: int):
    apt = appointments_db.get(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    clinic_id = apt["doctor_clinic_id"]
    position = queue_manager.get_position(clinic_id, appointment_id)
    
    if position is None:
        raise HTTPException(status_code=404, detail="Not in queue")
    
    wait_info = calculate_wait_time(clinic_id, position)
    
    return {
        "success": True,
        "data": {
            "appointment_id": appointment_id,
            "position": position,
            "estimated_wait_minutes": wait_info["wait_minutes"],
            "estimated_turn": wait_info["estimated_turn"],
            "patients_ahead": wait_info["patients_ahead"]
        }
    }

# Emergency
@app.post("/api/emergency")
def request_emergency(request: EmergencyRequest):
    apt = appointments_db.get(request.appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    emergency_id = len(emergency_log_db) + 1
    emergency_log_db[emergency_id] = {
        "id": emergency_id,
        "appointment_id": request.appointment_id,
        "patient_id": apt["patient_id"],
        "reason": request.reason,
        "description": request.description,
        "status": "pending",
        "created_at": datetime.now().isoformat()
    }
    
    apt["is_emergency"] = True
    apt["emergency_reason"] = request.reason
    apt["emergency_status"] = "pending"
    
    return {
        "success": True,
        "message": "Emergency request submitted. Waiting for doctor approval.",
        "emergency_id": emergency_id
    }

# Doctor endpoints
@app.get("/api/doctor/queue")
def doctor_queue():
    # Return queue for demo clinic (clinic_id=1)
    return get_queue(1)

@app.put("/api/doctor/appointments/{appointment_id}/visit")  
async def mark_visited(appointment_id: int):
    apt = appointments_db.get(appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    apt["status"] = "completed"
    apt["visited_at"] = datetime.now().isoformat()
    
    clinic_id = apt["doctor_clinic_id"]
    queue_manager.remove_patient(clinic_id, appointment_id)
    
    # Broadcast update
    await ws_manager.broadcast(
        {"type": "queue_update", "clinic_id": clinic_id},
        clinic_id
    )
    
    return {
        "success": True,
        "message": "Patient marked as visited"
    }

@app.put("/api/doctor/emergencies/{emergency_id}/approve")
async def approve_emergency(emergency_id: int):
    emergency = emergency_log_db.get(emergency_id)
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    emergency["status"] = "approved"
    
    apt_id = emergency["appointment_id"]
    apt = appointments_db.get(apt_id)
    if apt:
        apt["emergency_status"] = "approved"
        clinic_id = apt["doctor_clinic_id"]
        queue_manager.promote_to_emergency(clinic_id, apt_id)
        
        # Broadcast update
        await ws_manager.broadcast(
            {"type": "emergency_approved", "appointment_id": apt_id},
            clinic_id
        )
    
    return {
        "success": True,
        "message": "Emergency approved"
    }

@app.put("/api/doctor/emergencies/{emergency_id}/reject")
def reject_emergency(emergency_id: int):
    emergency = emergency_log_db.get(emergency_id)
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    emergency["status"] = "rejected"
    
    apt_id = emergency["appointment_id"]
    apt = appointments_db.get(apt_id)
    if apt:
        apt["emergency_status"] = "rejected"
    
    return {
        "success": True,
        "message": "Emergency rejected"
    }

# Ratings
@app.post("/api/ratings")
def submit_rating(rating: RatingCreate):
    apt = appointments_db.get(rating.appointment_id)
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if apt["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed appointments")
    
    clinic_id = apt["doctor_clinic_id"]
    
    new_rating = {
        "id": len(ratings_db) + 1,
        "appointment_id": rating.appointment_id,
        "clinic_id": clinic_id,
        "stars": rating.stars,
        "wait_time_rating": rating.wait_time_rating,
        "comment": rating.comment,
        "created_at": datetime.now().isoformat()
    }
    ratings_db.append(new_rating)
    
    # Update clinic rating
    clinic = clinics_db.get(clinic_id)
    if clinic:
        clinic_ratings = [r for r in ratings_db if r["clinic_id"] == clinic_id]
        if clinic_ratings:
            avg = sum(r["stars"] for r in clinic_ratings) / len(clinic_ratings)
            clinic["rating_avg"] = round(avg, 1)
            clinic["total_ratings"] = len(clinic_ratings)
    
    return {
        "success": True,
        "message": "Thank you for your feedback!"
    }

# WebSocket
@app.websocket("/ws/queue/{clinic_id}")
async def websocket_endpoint(websocket: WebSocket, clinic_id: int):
    await ws_manager.connect(websocket, clinic_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo heartbeat
            await websocket.send_json({"type": "heartbeat", "status": "connected"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, clinic_id)

# Import asyncio for background tasks
import asyncio

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False if os.environ.get("RENDER") else True)
