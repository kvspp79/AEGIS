"""
Core Data Models and Type Definitions for Emergency Dispatch System.
Replicates all domain entities: Incidents, Responders, Hospitals, Supplies, and Routing Nodes.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    SEVERE = "SEVERE"
    MODERATE = "MODERATE"
    WATCH = "WATCH"
    ADVISORY = "ADVISORY"
    HIGH = "HIGH"
    EXTREME = "EXTREME"
    LOW = "LOW"


class DisasterType(str, Enum):
    EARTHQUAKE = "EARTHQUAKE"
    FLOOD = "FLOOD"
    WILDFIRE = "WILDFIRE"
    CYCLONE = "CYCLONE"
    CHEMICAL_LEAK = "CHEMICAL_LEAK"
    BUILDING_COLLAPSE = "BUILDING_COLLAPSE"
    LANDSLIDE = "LANDSLIDE"
    TSUNAMI = "TSUNAMI"
    FIRE = "FIRE"
    MEDICAL = "MEDICAL"
    TRANSIT_ACCIDENT = "TRANSIT_ACCIDENT"
    INDUSTRIAL_HAZARD = "INDUSTRIAL_HAZARD"
    BLACKOUT = "BLACKOUT"


class ResponderType(str, Enum):
    AMBULANCE = "AMBULANCE"
    FIRE_ENGINE = "FIRE_ENGINE"
    NDRF_SAR = "NDRF_SAR"
    HAZMAT = "HAZMAT"
    RESCUE_BOAT = "RESCUE_BOAT"
    AIR_AMBULANCE = "AIR_AMBULANCE"
    DRONE_RECON = "DRONE_RECON"
    POLICE_ESCORT = "POLICE_ESCORT"


class ResponderStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    ON_SCENE = "ON_SCENE"
    RETURNING = "RETURNING"
    MAINTENANCE = "MAINTENANCE"
    BUSY = "BUSY"


class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    ASSESSED = "ASSESSED"
    ASSIGNED = "ASSIGNED"
    RESPONDING = "RESPONDING"
    RESOLVED = "RESOLVED"
    ACTIVE = "ACTIVE"
    CONTAINED = "CONTAINED"
    VERIFIED = "VERIFIED"


class UserRole(str, Enum):
    COMMANDER = "COMMANDER"
    RESPONDER = "RESPONDER"
    CITIZEN = "CITIZEN"
    STUDENT = "STUDENT"


@dataclass
class Coordinates:
    lat: float
    lng: float

    def to_dict(self) -> Dict[str, float]:
        return {"lat": self.lat, "lng": self.lng}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Coordinates":
        return cls(lat=float(data["lat"]), lng=float(data["lng"]))


@dataclass
class Incident:
    id: str
    title: str
    type: DisasterType
    severity: SeverityLevel
    status: IncidentStatus
    location_name: str
    coordinates: Coordinates
    reported_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    casualties: int = 0
    affected_population: int = 0
    description: str = ""
    assigned_responder_ids: List[str] = field(default_factory=list)
    base_priority: int = 50  # 1 - 100 scale
    aging_minutes: int = 0
    hazard_radius_meters: int = 500
    calculated_priority: Optional[int] = None
    flood_water_level_meters: Optional[float] = None
    seismic_magnitude: Optional[float] = None
    depth_km: Optional[float] = None
    wind_speed_kmh: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "type": self.type.value if isinstance(self.type, Enum) else self.type,
            "severity": self.severity.value if isinstance(self.severity, Enum) else self.severity,
            "status": self.status.value if isinstance(self.status, Enum) else self.status,
            "location_name": self.location_name,
            "coordinates": self.coordinates.to_dict(),
            "reported_at": self.reported_at,
            "casualties": self.casualties,
            "affected_population": self.affected_population,
            "description": self.description,
            "assigned_responder_ids": self.assigned_responder_ids,
            "base_priority": self.base_priority,
            "aging_minutes": self.aging_minutes,
            "hazard_radius_meters": self.hazard_radius_meters,
            "calculated_priority": self.calculated_priority,
            "flood_water_level_meters": self.flood_water_level_meters,
            "seismic_magnitude": self.seismic_magnitude,
            "depth_km": self.depth_km,
            "wind_speed_kmh": self.wind_speed_kmh,
        }


@dataclass
class Responder:
    id: str
    name: str
    type: ResponderType
    status: ResponderStatus
    base_station: str
    current_coordinates: Coordinates
    capacity: int = 2
    crew_count: int = 3
    speed_kmh: int = 50
    readiness_time_minutes: int = 3
    current_incident_id: Optional[str] = None
    specialties: List[str] = field(default_factory=list)
    callsign: Optional[str] = None
    plate_number: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value if isinstance(self.type, Enum) else self.type,
            "status": self.status.value if isinstance(self.status, Enum) else self.status,
            "base_station": self.base_station,
            "current_coordinates": self.current_coordinates.to_dict(),
            "capacity": self.capacity,
            "crew_count": self.crew_count,
            "speed_kmh": self.speed_kmh,
            "readiness_time_minutes": self.readiness_time_minutes,
            "current_incident_id": self.current_incident_id,
            "specialties": self.specialties,
            "callsign": self.callsign,
            "plate_number": self.plate_number,
        }


@dataclass
class Hospital:
    id: str
    name: str
    location_name: str
    coordinates: Coordinates
    capacity_total: int
    capacity_current: int  # Occupied beds
    food_water_stock_days: int = 14
    medical_staff_present: bool = True
    generator_power: bool = True
    status: str = "OPEN"  # OPEN, NEAR_CAPACITY, FULL
    contact_phone: str = "+91 422 2301393"
    type: str = "HOSPITAL"

    @property
    def available_beds(self) -> int:
        return max(0, self.capacity_total - self.capacity_current)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "location_name": self.location_name,
            "coordinates": self.coordinates.to_dict(),
            "capacity_total": self.capacity_total,
            "capacity_current": self.capacity_current,
            "available_beds": self.available_beds,
            "food_water_stock_days": self.food_water_stock_days,
            "medical_staff_present": self.medical_staff_present,
            "generator_power": self.generator_power,
            "status": self.status,
            "contact_phone": self.contact_phone,
            "type": self.type,
        }


@dataclass
class ResourceSupply:
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    weight_kg_per_unit: float
    utility_value: int  # For Knapsack optimization
    location_id: str
    location_name: str
    status: str = "ADEQUATE"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "weight_kg_per_unit": self.weight_kg_per_unit,
            "utility_value": self.utility_value,
            "location_id": self.location_id,
            "location_name": self.location_name,
            "status": self.status,
        }


@dataclass
class RoutingNode:
    id: str
    name: str
    coordinates: Coordinates
    elevation_meters: float = 410.0
    hazard_risk_factor: float = 1.0  # 1.0 (clear) to 5.0 (hazardous/flooded)


@dataclass
class RoutingEdge:
    from_node: str
    to_node: str
    distance_km: float
    is_blocked: bool = False
    road_quality: float = 1.0
