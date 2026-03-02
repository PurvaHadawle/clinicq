"""
Database models and configuration for the Clinic Queue Management System.
Uses SQLAlchemy ORM with SQLite (PostgreSQL-compatible schema).
"""
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Enum as SQLEnum, CheckConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

DATABASE_URL = "sqlite:///./clinic_queue.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------- ENUMS ----------
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class AppointmentStatus(str, enum.Enum):
    BOOKED = "booked"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class EmergencyStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class QueueStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


# ---------- MODELS ----------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(15), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.PATIENT.value)
    locality = Column(String(100))
    emergency_strikes = Column(Integer, default=0)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointments = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
    ratings = relationship("Rating", back_populates="patient")


class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(Text)
    locality = Column(String(100), nullable=False, index=True)
    phone = Column(String(15))
    opening_time = Column(String(10), default="09:00")
    closing_time = Column(String(10), default="18:00")
    avg_consultation_time = Column(Integer, default=15)  # minutes
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctors = relationship("Doctor", back_populates="clinic")
    ratings = relationship("Rating", back_populates="clinic")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    specialization = Column(String(100), nullable=False)
    consultation_time = Column(Integer, default=15)  # minutes
    max_patients_per_day = Column(Integer, default=30)
    is_available = Column(Boolean, default=True)
    queue_status = Column(String(20), default=QueueStatus.ACTIVE.value)

    # Relationships
    user = relationship("User")
    clinic = relationship("Clinic", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    token_number = Column(Integer, nullable=False)
    queue_position = Column(Integer, nullable=False)
    status = Column(String(20), default=AppointmentStatus.BOOKED.value)
    is_emergency = Column(Boolean, default=False)
    emergency_reason = Column(Text)
    emergency_status = Column(String(20))
    has_arrived = Column(Boolean, default=False)
    arrived_at = Column(DateTime)
    scheduled_date = Column(DateTime, nullable=False)
    estimated_wait_time = Column(Integer)  # minutes
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("User", back_populates="appointments", foreign_keys=[patient_id])
    doctor = relationship("Doctor", back_populates="appointments")
    clinic = relationship("Clinic")


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default=EmergencyStatus.PENDING.value)
    reviewed_by = Column(Integer, ForeignKey("doctors.id"))
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment")
    patient = relationship("User")
    reviewer = relationship("Doctor")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    rating = Column(Integer, nullable=False)  # 1–5
    review = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )

    # Relationships
    patient = relationship("User", back_populates="ratings")
    clinic = relationship("Clinic", back_populates="ratings")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))  # queue_update, emergency, reminder
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")


# ---------- DATABASE INIT ----------
def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
