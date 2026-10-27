"""
Hospital and Trauma Center Management Service.
Handles nearest medical facility calculation with open bed verification,
bed reservations, and trauma emergency routing.
"""

from typing import List, Dict, Optional, Tuple, Any
from models import Hospital, Coordinates
from algorithms import haversine_distance


def calculate_nearest_hospital_with_beds(
    incident_coords: Coordinates,
    hospitals: List[Hospital]
) -> Tuple[Optional[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Finds nearest hospital with available bed capacity.
    Filters out facilities with 0 open beds, calculates realistic driving distance
    with 1.28x road winding factor and travel duration at 42 km/h ambulance speed.
    """
    # 1. Filter: must have open beds
    eligible = [h for h in hospitals if h.available_beds > 0]
    candidate_list = eligible if eligible else hospitals

    if not candidate_list:
        return None, []

    results: List[Dict[str, Any]] = []
    for hosp in candidate_list:
        dist_km = haversine_distance(incident_coords, hosp.coordinates, is_driving_road=True)
        dur_mins = max(2, int(round((dist_km / 42.0) * 60)))
        results.append({
            "hospital": hosp,
            "hospital_id": hosp.id,
            "hospital_name": hosp.name,
            "location_name": hosp.location_name,
            "distance_km": dist_km,
            "duration_minutes": dur_mins,
            "duration_text": f"{dur_mins} mins",
            "available_beds": hosp.available_beds,
            "total_beds": hosp.capacity_total,
            "medical_staff_present": hosp.medical_staff_present,
            "status": hosp.status,
            "phone": hosp.contact_phone,
        })

    # Sort ascending by travel distance
    results.sort(key=lambda x: x["distance_km"])
    nearest = results[0] if results else None
    return nearest, results


def reserve_hospital_bed(hospital: Hospital) -> bool:
    """
    Safely reserves 1 bed in the specified hospital.
    Updates hospital operational status if capacity thresholds are crossed.
    """
    if hospital.available_beds <= 0:
        return False

    hospital.capacity_current += 1
    pct = (hospital.capacity_current / hospital.capacity_total) * 100.0
    if pct >= 100.0:
        hospital.status = "FULL"
    elif pct >= 85.0:
        hospital.status = "NEAR_CAPACITY"
    else:
        hospital.status = "OPEN"
    return True


def release_hospital_bed(hospital: Hospital) -> bool:
    """
    Releases 1 bed when patient care is finalized or transferred.
    """
    if hospital.capacity_current <= 0:
        return False

    hospital.capacity_current -= 1
    pct = (hospital.capacity_current / hospital.capacity_total) * 100.0
    if pct >= 100.0:
        hospital.status = "FULL"
    elif pct >= 85.0:
        hospital.status = "NEAR_CAPACITY"
    else:
        hospital.status = "OPEN"
    return True
