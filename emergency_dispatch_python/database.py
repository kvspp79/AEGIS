"""
Persistent SQLite Database Module for Emergency Dispatch Management.
Provides ACID transaction support, persistence across application restarts,
and automatic table creation and initial seeding.
"""

import sqlite3
import json
from typing import List, Dict, Optional, Any
from models import Incident, Responder, Hospital, ResourceSupply, Coordinates, SeverityLevel, DisasterType, ResponderType, ResponderStatus, IncidentStatus


class DatabaseManager:
    """Manages SQLite database storage for incidents, vehicles, hospitals, and audit logs."""

    def __init__(self, db_path: str = "emergency_dispatch.db"):
        self.db_path = db_path
        self._mem_conn = sqlite3.connect(":memory:", check_same_thread=False) if db_path == ":memory:" else None
        if self._mem_conn:
            self._mem_conn.row_factory = sqlite3.Row
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        if self._mem_conn:
            return self._mem_conn
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Creates tables if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS incidents (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    status TEXT NOT NULL,
                    location_name TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    reported_at TEXT NOT NULL,
                    casualties INTEGER DEFAULT 0,
                    affected_population INTEGER DEFAULT 0,
                    description TEXT,
                    base_priority INTEGER DEFAULT 50,
                    aging_minutes INTEGER DEFAULT 0,
                    calculated_priority INTEGER,
                    assigned_responder_ids TEXT
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS responders (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT NOT NULL,
                    base_station TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    capacity INTEGER DEFAULT 2,
                    crew_count INTEGER DEFAULT 3,
                    speed_kmh INTEGER DEFAULT 50,
                    readiness_time_minutes INTEGER DEFAULT 3,
                    current_incident_id TEXT,
                    specialties TEXT
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS hospitals (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    location_name TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    capacity_total INTEGER NOT NULL,
                    capacity_current INTEGER NOT NULL,
                    medical_staff_present INTEGER DEFAULT 1,
                    status TEXT DEFAULT 'OPEN',
                    contact_phone TEXT
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dispatches (
                    id TEXT PRIMARY KEY,
                    incident_id TEXT NOT NULL,
                    responder_id TEXT NOT NULL,
                    hospital_id TEXT,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    route_distance_km REAL,
                    eta_minutes INTEGER,
                    notes TEXT
                );
            """)

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    details TEXT NOT NULL
                );
            """)

            conn.commit()

    # --- Incident Operations ---

    def save_incident(self, inc: Incident) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            resp_ids_str = json.dumps(inc.assigned_responder_ids)
            cursor.execute("""
                INSERT OR REPLACE INTO incidents (
                    id, title, type, severity, status, location_name,
                    lat, lng, reported_at, casualties, affected_population,
                    description, base_priority, aging_minutes, calculated_priority,
                    assigned_responder_ids
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inc.id, inc.title,
                inc.type.value if hasattr(inc.type, 'value') else str(inc.type),
                inc.severity.value if hasattr(inc.severity, 'value') else str(inc.severity),
                inc.status.value if hasattr(inc.status, 'value') else str(inc.status),
                inc.location_name, inc.coordinates.lat, inc.coordinates.lng,
                inc.reported_at, inc.casualties, inc.affected_population,
                inc.description, inc.base_priority, inc.aging_minutes,
                inc.calculated_priority, resp_ids_str
            ))
            conn.commit()

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_incident(row)

    def get_all_incidents(self) -> List[Incident]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incidents ORDER BY calculated_priority DESC, base_priority DESC")
            rows = cursor.fetchall()
            return [self._row_to_incident(r) for r in rows]

    def update_incident_status(self, incident_id: str, status: str) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE incidents SET status = ? WHERE id = ?", (status, incident_id))
            conn.commit()

    # --- Responder Operations ---

    def save_responder(self, resp: Responder) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            specs_str = json.dumps(resp.specialties)
            cursor.execute("""
                INSERT OR REPLACE INTO responders (
                    id, name, type, status, base_station, lat, lng,
                    capacity, crew_count, speed_kmh, readiness_time_minutes,
                    current_incident_id, specialties
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                resp.id, resp.name,
                resp.type.value if hasattr(resp.type, 'value') else str(resp.type),
                resp.status.value if hasattr(resp.status, 'value') else str(resp.status),
                resp.base_station, resp.current_coordinates.lat, resp.current_coordinates.lng,
                resp.capacity, resp.crew_count, resp.speed_kmh, resp.readiness_time_minutes,
                resp.current_incident_id, specs_str
            ))
            conn.commit()

    def get_all_responders(self) -> List[Responder]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM responders")
            rows = cursor.fetchall()
            return [self._row_to_responder(r) for r in rows]

    def update_responder_status(self, responder_id: str, status: str, current_incident_id: Optional[str] = None) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE responders SET status = ?, current_incident_id = ? WHERE id = ?",
                (status, current_incident_id, responder_id)
            )
            conn.commit()

    # --- Hospital Operations ---

    def save_hospital(self, hosp: Hospital) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO hospitals (
                    id, name, location_name, lat, lng, capacity_total,
                    capacity_current, medical_staff_present, status, contact_phone
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hosp.id, hosp.name, hosp.location_name, hosp.coordinates.lat, hosp.coordinates.lng,
                hosp.capacity_total, hosp.capacity_current,
                1 if hosp.medical_staff_present else 0, hosp.status, hosp.contact_phone
            ))
            conn.commit()

    def get_all_hospitals(self) -> List[Hospital]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM hospitals")
            rows = cursor.fetchall()
            return [self._row_to_hospital(r) for r in rows]

    def update_hospital_beds(self, hospital_id: str, capacity_current: int, status: str) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE hospitals SET capacity_current = ?, status = ? WHERE id = ?",
                (capacity_current, status, hospital_id)
            )
            conn.commit()

    # --- Dispatch and Audit Logs ---

    def record_dispatch(self, dispatch_id: str, incident_id: str, responder_id: str,
                        hospital_id: Optional[str], timestamp: str, status: str,
                        route_dist: float, eta_mins: int, notes: str = "") -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO dispatches (
                    id, incident_id, responder_id, hospital_id, timestamp,
                    status, route_distance_km, eta_minutes, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (dispatch_id, incident_id, responder_id, hospital_id, timestamp, status, route_dist, eta_mins, notes))
            conn.commit()

    def log_audit(self, action_type: str, actor: str, details: str) -> None:
        import datetime
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_log (timestamp, action_type, actor, details)
                VALUES (?, ?, ?, ?)
            """, (datetime.datetime.utcnow().isoformat(), action_type, actor, details))
            conn.commit()

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM audit_log ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    # --- Row Mappers ---

    def _row_to_incident(self, r: sqlite3.Row) -> Incident:
        resp_ids = json.loads(r["assigned_responder_ids"]) if r["assigned_responder_ids"] else []
        return Incident(
            id=r["id"],
            title=r["title"],
            type=DisasterType(r["type"]) if r["type"] in DisasterType.__members__ else r["type"],
            severity=SeverityLevel(r["severity"]) if r["severity"] in SeverityLevel.__members__ else r["severity"],
            status=IncidentStatus(r["status"]) if r["status"] in IncidentStatus.__members__ else r["status"],
            location_name=r["location_name"],
            coordinates=Coordinates(lat=r["lat"], lng=r["lng"]),
            reported_at=r["reported_at"],
            casualties=r["casualties"],
            affected_population=r["affected_population"],
            description=r["description"] or "",
            base_priority=r["base_priority"],
            aging_minutes=r["aging_minutes"],
            calculated_priority=r["calculated_priority"],
            assigned_responder_ids=resp_ids,
        )

    def _row_to_responder(self, r: sqlite3.Row) -> Responder:
        specs = json.loads(r["specialties"]) if r["specialties"] else []
        return Responder(
            id=r["id"],
            name=r["name"],
            type=ResponderType(r["type"]) if r["type"] in ResponderType.__members__ else r["type"],
            status=ResponderStatus(r["status"]) if r["status"] in ResponderStatus.__members__ else r["status"],
            base_station=r["base_station"],
            current_coordinates=Coordinates(lat=r["lat"], lng=r["lng"]),
            capacity=r["capacity"],
            crew_count=r["crew_count"],
            speed_kmh=r["speed_kmh"],
            readiness_time_minutes=r["readiness_time_minutes"],
            current_incident_id=r["current_incident_id"],
            specialties=specs,
        )

    def _row_to_hospital(self, r: sqlite3.Row) -> Hospital:
        return Hospital(
            id=r["id"],
            name=r["name"],
            location_name=r["location_name"],
            coordinates=Coordinates(lat=r["lat"], lng=r["lng"]),
            capacity_total=r["capacity_total"],
            capacity_current=r["capacity_current"],
            medical_staff_present=bool(r["medical_staff_present"]),
            status=r["status"],
            contact_phone=r["contact_phone"] or "+91 422 2301393",
        )
