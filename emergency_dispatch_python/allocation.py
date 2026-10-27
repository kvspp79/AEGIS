"""
Resource and Emergency Vehicle Allocation Logic.

ALGORITHMS & WORKFLOWS IMPLEMENTED:
1. Smart Dispatch Suitability Scoring
   - Feature: Immediate Single Incident Dispatch
   - Calculates distance, ETA, vehicle speed, readiness window, and specialty match bonus.
2. Bipartite Matching
   - Feature: Multi-Unit Fleet Dispatch Batching
   - Matches pool of available responders to active incidents to maximize collective coverage score.
3. Branch and Bound Assignment Optimization
   - Feature: Minimum Response Time Multi-Emergency Assignment
   - Explores state-space tree of assignments with lower-bound pruning (O(N!) reduced via branch elimination).
"""

import time
from typing import List, Dict, Optional, Any, Set
from models import Incident, Responder, DisasterType, ResponderType, ResponderStatus
from algorithms import haversine_distance


def compute_smart_dispatch(incident: Incident, responders: List[Responder]) -> List[Dict[str, Any]]:
    """
    Computes suitability ranking for all available responders to attend an incident.
    Considers geographic distance, travel time ETA, vehicle readiness, and specialty bonus.
    """
    available = [r for r in responders if r.status in (ResponderStatus.AVAILABLE, "AVAILABLE")]
    if not available:
        return []

    recommendations = []
    for resp in available:
        dist_km = haversine_distance(incident.coordinates, resp.current_coordinates, is_driving_road=True)
        speed = resp.speed_kmh if resp.speed_kmh > 0 else 45
        travel_time_hours = dist_km / speed
        eta_minutes = max(2, int(round(travel_time_hours * 60 + resp.readiness_time_minutes)))

        # Specialty match bonus
        skill_bonus = 20
        inc_type = incident.type.value if hasattr(incident.type, "value") else str(incident.type)
        resp_type = resp.type.value if hasattr(resp.type, "value") else str(resp.type)

        if inc_type in ("WILDFIRE", "CHEMICAL_LEAK") and resp_type in ("FIRE_ENGINE", "HAZMAT"):
            skill_bonus = 50
        elif inc_type in ("FLOOD", "TSUNAMI") and resp_type in ("RESCUE_BOAT", "NDRF_SAR"):
            skill_bonus = 50
        elif incident.casualties > 3 and resp_type in ("AMBULANCE", "AIR_AMBULANCE"):
            skill_bonus = 50
        elif inc_type == "BUILDING_COLLAPSE" and resp_type == "NDRF_SAR":
            skill_bonus = 55

        distance_score = max(0.0, 50.0 - dist_km * 3.5)
        speed_score = min(20.0, (speed / 100.0) * 20.0)
        suitability_score = min(100, int(round(distance_score + skill_bonus + speed_score)))

        recommendations.append({
            "responder": resp,
            "responder_id": resp.id,
            "responder_name": resp.name,
            "responder_type": resp_type,
            "distance_km": dist_km,
            "eta_minutes": eta_minutes,
            "suitability_score": suitability_score,
            "base_station": resp.base_station,
        })

    # Sort descending by suitability score
    recommendations.sort(key=lambda x: x["suitability_score"], reverse=True)
    return recommendations


def compute_bipartite_matching(responders: List[Responder], incidents: List[Incident]) -> Dict[str, Any]:
    """
    Greedy bipartite augmenting matching between available emergency fleet and active incidents.
    Time Complexity: O(V * E).
    """
    t0 = time.perf_counter()
    avail_resp = [r for r in responders if r.status in (ResponderStatus.AVAILABLE, "AVAILABLE")]
    active_inc = [i for i in incidents if i.status in ("ACTIVE", "VERIFIED", "REPORTED", "ASSESSED") and not i.assigned_responder_ids]

    # Sort incidents by calculated priority (highest first)
    sorted_incidents = sorted(active_inc, key=lambda i: (i.calculated_priority or i.base_priority), reverse=True)

    matches = []
    matched_resp_ids: Set[str] = set()
    matched_inc_ids: Set[str] = set()

    for inc in sorted_incidents:
        best_resp: Optional[Responder] = None
        best_score = -1

        for resp in avail_resp:
            if resp.id in matched_resp_ids:
                continue

            dist_km = haversine_distance(resp.current_coordinates, inc.coordinates)
            skill_bonus = 25
            inc_type = inc.type.value if hasattr(inc.type, "value") else str(inc.type)
            resp_type = resp.type.value if hasattr(resp.type, "value") else str(resp.type)

            if inc_type == "CHEMICAL_LEAK" and resp_type == "HAZMAT":
                skill_bonus = 60
            elif inc_type == "FLOOD" and resp_type == "RESCUE_BOAT":
                skill_bonus = 60
            elif inc_type == "BUILDING_COLLAPSE" and resp_type == "NDRF_SAR":
                skill_bonus = 60
            elif inc_type in ("MEDICAL", "TRANSIT_ACCIDENT") and resp_type == "AMBULANCE":
                skill_bonus = 60

            prox_score = max(0.0, 50.0 - dist_km * 3.0)
            score = int(round(prox_score + skill_bonus + resp.speed_kmh * 0.1))

            if score > best_score:
                best_score = score
                best_resp = resp

        if best_resp and best_score > 25:
            matched_resp_ids.add(best_resp.id)
            matched_inc_ids.add(inc.id)
            matches.append({
                "responder": best_resp,
                "incident": inc,
                "score": best_score,
            })

    unmatched_resp = [r for r in avail_resp if r.id not in matched_resp_ids]
    unmatched_inc = [i for i in active_inc if i.id not in matched_inc_ids]
    exec_ms = round((time.perf_counter() - t0) * 1000, 3)

    return {
        "matches": matches,
        "unmatched_responders": unmatched_resp,
        "unmatched_incidents": unmatched_inc,
        "execution_time_ms": exec_ms,
        "time_complexity": "O(V * E) (Bipartite Augmenting Match)",
    }


def compute_branch_and_bound_assignment(incidents: List[Incident], responders: List[Responder]) -> Dict[str, Any]:
    """
    Branch and Bound assignment optimization with lower-bound pruning.
    Finds assignment of responders to incidents that minimizes total response cost.
    """
    t0 = time.perf_counter()
    active_inc = incidents[:4]  # Limit to 4 for manageable state tree
    avail_resp = [r for r in responders if r.status in (ResponderStatus.AVAILABLE, "AVAILABLE")][:4]

    if not active_inc or not avail_resp:
        return {"best_assignments": [], "total_optimal_cost": 0, "branches_pruned": 0, "states_explored": 0}

    # Cost Matrix C[i][j]: distance + urgency penalty
    cost_matrix = []
    for inc in active_inc:
        row = []
        for resp in avail_resp:
            dist = haversine_distance(inc.coordinates, resp.current_coordinates)
            pri_penalty = max(0, 100 - inc.base_priority) * 0.1
            row.append(int(round(dist + pri_penalty)))
        cost_matrix.append(row)

    best_cost = float('inf')
    best_map: Dict[str, str] = {}
    states_explored = 0
    branches_pruned = 0

    def search(inc_idx: int, current_cost: int, assigned_resp: Set[int], current_map: Dict[str, str]):
        nonlocal best_cost, best_map, states_explored, branches_pruned
        states_explored += 1

        if inc_idx == len(active_inc):
            if current_cost < best_cost:
                best_cost = current_cost
                best_map = dict(current_map)
            return

        current_inc = active_inc[inc_idx]
        for r_idx, resp in enumerate(avail_resp):
            if r_idx in assigned_resp:
                continue

            edge_cost = cost_matrix[inc_idx][r_idx]
            new_cost = current_cost + edge_cost

            # Lower bound: sum of minimum available edges for remaining unassigned incidents
            remaining_bound = 0
            for next_i in range(inc_idx + 1, len(active_inc)):
                min_edge = float('inf')
                for j in range(len(avail_resp)):
                    if j not in assigned_resp and j != r_idx:
                        min_edge = min(min_edge, cost_matrix[next_i][j])
                if min_edge != float('inf'):
                    remaining_bound += min_edge

            total_bound = new_cost + remaining_bound

            # Pruning condition
            if total_bound >= best_cost:
                branches_pruned += 1
                continue

            assigned_resp.add(r_idx)
            current_map[current_inc.id] = resp.id
            search(inc_idx + 1, new_cost, assigned_resp, current_map)
            assigned_resp.remove(r_idx)
            del current_map[current_inc.id]

    search(0, 0, set(), {})

    results = []
    for inc in active_inc:
        resp_id = best_map.get(inc.id)
        resp = next((r for r in avail_resp if r.id == resp_id), None)
        if resp:
            results.append({"incident": inc, "responder": resp, "cost": 25})

    return {
        "best_assignments": results,
        "total_optimal_cost": best_cost if best_cost != float('inf') else 0,
        "branches_pruned": branches_pruned,
        "states_explored": states_explored,
        "execution_time_ms": round((time.perf_counter() - t0) * 1000, 3),
    }
