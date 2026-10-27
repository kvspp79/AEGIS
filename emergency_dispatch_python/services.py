"""
Core Emergency Dispatch Orchestration System.
Connects DSA data structures, algorithms, SQLite persistence, and operational workflows.
"""

from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
import uuid

from models import (
    Incident, Responder, Hospital, ResourceSupply, Coordinates,
    SeverityLevel, DisasterType, ResponderType, ResponderStatus, IncidentStatus
)
from priority_queue import EmergencyPriorityQueue
from algorithms import (
    EmergencyGraph, DisasterTrie, DispatchCommandStack,
    DynamicResourceHashTable, AVLTree, DispatchAction,
    haversine_distance, solve_01_knapsack, KnapsackItem
)
from allocation import compute_smart_dispatch, compute_bipartite_matching, compute_branch_and_bound_assignment
from hospital_service import calculate_nearest_hospital_with_beds, reserve_hospital_bed, release_hospital_bed
from database import DatabaseManager
from seed_data import (
    SEED_INCIDENTS, SEED_RESPONDERS, SEED_HOSPITALS,
    SEED_ROUTING_NODES, SEED_ROUTING_EDGES
)


class EmergencyDispatchSystem:
    """Central disaster coordination system coordinating DSA structures and database persistence."""

    def __init__(self, db_path: str = "emergency_dispatch.db", auto_seed: bool = True):
        self.db = DatabaseManager(db_path=db_path)
        self.pq = EmergencyPriorityQueue(aging_rate_per_minute=0.5)
        self.graph = EmergencyGraph(SEED_ROUTING_NODES, SEED_ROUTING_EDGES)
        self.trie = DisasterTrie()
        self.command_stack = DispatchCommandStack()
        self.cache = DynamicResourceHashTable(initial_capacity=16)
        self.avl_tree = AVLTree()

        if auto_seed:
            self._bootstrap_data()

    def _bootstrap_data(self) -> None:
        """Loads seed data if database is fresh."""
        existing_incidents = self.db.get_all_incidents()
        if not existing_incidents:
            for inc in SEED_INCIDENTS:
                self.db.save_incident(inc)
            for resp in SEED_RESPONDERS:
                self.db.save_responder(resp)
            for hosp in SEED_HOSPITALS:
                self.db.save_hospital(hosp)

        # Populate in-memory DSA structures
        for inc in self.db.get_all_incidents():
            if inc.status in (IncidentStatus.ACTIVE, IncidentStatus.REPORTED, "ACTIVE", "REPORTED"):
                self.pq.insert(inc)
            self.trie.insert(inc.title, inc.id, "INCIDENT")
            self.cache.insert(inc.id, inc)

        for resp in self.db.get_all_responders():
            self.trie.insert(resp.name, resp.id, "RESPONDER")
            self.avl_tree.insert(float(resp.speed_kmh), resp)
            self.cache.insert(resp.id, resp)

    # --- Workflow 1: Incident Registration & Priority Queue Insertion ---

    def register_incident(
        self,
        title: str,
        disaster_type: DisasterType,
        severity: SeverityLevel,
        location_name: str,
        coordinates: Coordinates,
        casualties: int = 0,
        affected_population: int = 0,
        description: str = "",
        base_priority: int = 70,
    ) -> Incident:
        """Registers a new disaster incident, calculates priority, and enqueues into Max-Heap."""
        inc_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
        incident = Incident(
            id=inc_id,
            title=title,
            type=disaster_type,
            severity=severity,
            status=IncidentStatus.ACTIVE,
            location_name=location_name,
            coordinates=coordinates,
            reported_at=datetime.utcnow().isoformat(),
            casualties=casualties,
            affected_population=affected_population,
            description=description,
            base_priority=base_priority,
            aging_minutes=0,
        )

        # 1. Insert into Max-Heap (calculates dynamic priority with aging formula)
        pri = self.pq.insert(incident)
        incident.calculated_priority = pri

        # 2. Persist to SQLite
        self.db.save_incident(incident)

        # 3. Insert into Trie & Cache
        self.trie.insert(incident.title, incident.id, "INCIDENT")
        self.cache.insert(incident.id, incident)

        # 4. Log Audit
        self.db.log_audit("INCIDENT_REGISTERED", "DISPATCH_SYSTEM", f"New {severity.value} {disaster_type.value} incident registered at {location_name} (Priority {pri}).")
        return incident

    # --- Workflow 2: Triaging & Extract Next Emergency ---

    def get_highest_priority_incident(self) -> Optional[Incident]:
        """Peeks top incident in Max-Heap O(1)."""
        return self.pq.peek()

    def extract_highest_priority_incident(self) -> Optional[Incident]:
        """Extracts and removes top incident from Max-Heap O(log N)."""
        return self.pq.extract_max()

    def simulate_time_aging(self, minutes: int = 5) -> None:
        """Applies starvation-prevention aging to all queued incidents."""
        self.pq.reapply_aging(minutes)
        for inc in self.pq.get_heap_array():
            self.db.save_incident(inc)

    # --- Workflow 3: Emergency Dispatch & Hospital Routing ---

    def dispatch_unit(
        self,
        incident_id: str,
        preferred_responder_id: Optional[str] = None,
        routing_algo: str = "DIJKSTRA"
    ) -> Dict[str, Any]:
        """
        Orchestrates full dispatch workflow:
        1. Selects best responder using suitability scoring.
        2. Computes shortest path via Graph algorithm (Dijkstra / A* / Bellman-Ford).
        3. Identifies nearest hospital with open beds and reserves bed.
        4. Updates statuses in SQLite and pushes to Command Pattern Undo stack.
        """
        incident = self.db.get_incident(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found.")

        responders = self.db.get_all_responders()
        available_responders = [r for r in responders if r.status in (ResponderStatus.AVAILABLE, "AVAILABLE")]

        if not available_responders:
            raise RuntimeError("No available emergency responders in fleet!")

        selected_responder: Optional[Responder] = None
        if preferred_responder_id:
            selected_responder = next((r for r in responders if r.id == preferred_responder_id), None)

        if not selected_responder:
            recommendations = compute_smart_dispatch(incident, responders)
            if recommendations:
                selected_responder = recommendations[0]["responder"]
            else:
                selected_responder = available_responders[0]

        # Route Calculation (from responder node to incident node)
        start_node = "NODE-CBE-01"
        end_node = "NODE-CBE-02"
        if routing_algo == "A_STAR":
            route_result = self.graph.a_star(start_node, end_node)
        elif routing_algo == "BELLMAN_FORD":
            route_result = self.graph.bellman_ford(start_node, end_node)
        else:
            route_result = self.graph.dijkstra(start_node, end_node)

        # Hospital Selection with open bed verification
        hospitals = self.db.get_all_hospitals()
        nearest_hospital_dict, _ = calculate_nearest_hospital_with_beds(incident.coordinates, hospitals)

        assigned_hospital_id = None
        if nearest_hospital_dict:
            target_hosp = nearest_hospital_dict["hospital"]
            assigned_hospital_id = target_hosp.id
            reserve_hospital_bed(target_hosp)
            self.db.update_hospital_beds(target_hosp.id, target_hosp.capacity_current, target_hosp.status)

        # Update Incident & Responder States
        prev_inc_status = incident.status.value if hasattr(incident.status, 'value') else str(incident.status)
        prev_resp_status = selected_responder.status.value if hasattr(selected_responder.status, 'value') else str(selected_responder.status)

        incident.status = IncidentStatus.RESPONDING
        incident.assigned_responder_ids = [selected_responder.id]
        self.db.save_incident(incident)

        selected_responder.status = ResponderStatus.DISPATCHED
        selected_responder.current_incident_id = incident.id
        self.db.save_responder(selected_responder)

        # Create Command Action for Undo/Redo
        dispatch_id = f"DISPATCH-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.utcnow().isoformat()
        action = DispatchAction(
            id=dispatch_id,
            incident_id=incident.id,
            responder_id=selected_responder.id,
            timestamp=timestamp,
            action_type="DISPATCH",
            previous_status=prev_resp_status,
            new_status="DISPATCHED",
        )
        self.command_stack.execute(action)

        # Persist dispatch record
        self.db.record_dispatch(
            dispatch_id=dispatch_id,
            incident_id=incident.id,
            responder_id=selected_responder.id,
            hospital_id=assigned_hospital_id,
            timestamp=timestamp,
            status="DISPATCHED",
            route_dist=route_result.total_distance_km,
            eta_mins=route_result.estimated_minutes,
            notes=f"Routed via {routing_algo}. Assigned hospital: {assigned_hospital_id}"
        )

        self.db.log_audit("UNIT_DISPATCHED", "COMMANDER", f"{selected_responder.name} dispatched to {incident.title}.")

        return {
            "dispatch_id": dispatch_id,
            "incident": incident.to_dict(),
            "responder": selected_responder.to_dict(),
            "hospital": nearest_hospital_dict,
            "route": route_result.to_dict(),
            "status": "DISPATCHED",
        }

    # --- Workflow 4: Mission Accomplished & Hospital Handover ---

    def complete_mission(self, incident_id: str, responder_id: str, hospital_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Marks mission accomplished:
        1. Sets incident status to RESOLVED.
        2. Resets vehicle status to AVAILABLE and clears current_incident_id.
        3. Updates hospital bed count if patients were discharged.
        """
        incident = self.db.get_incident(incident_id)
        if incident:
            incident.status = IncidentStatus.RESOLVED
            self.db.save_incident(incident)

        responders = self.db.get_all_responders()
        resp = next((r for r in responders if r.id == responder_id), None)
        if resp:
            resp.status = ResponderStatus.AVAILABLE
            resp.current_incident_id = None
            self.db.save_responder(resp)

        if hospital_id:
            hospitals = self.db.get_all_hospitals()
            hosp = next((h for h in hospitals if h.id == hospital_id), None)
            if hosp:
                release_hospital_bed(hosp)
                self.db.update_hospital_beds(hosp.id, hosp.capacity_current, hosp.status)

        self.db.log_audit("MISSION_COMPLETE", "RESPONDER", f"Mission complete for incident {incident_id}. Vehicle {responder_id} returned to AVAILABLE status.")

        return {
            "incident_id": incident_id,
            "responder_id": responder_id,
            "status": "MISSION_ACCOMPLISHED",
            "vehicle_status": "AVAILABLE",
        }

    # --- Workflow 5: Command Pattern Undo & Redo ---

    def undo_last_dispatch(self) -> Optional[Dict[str, Any]]:
        """Reverts the last dispatch transaction using LIFO stack."""
        action = self.command_stack.undo()
        if not action:
            return None

        # Rollback responder and incident
        incident = self.db.get_incident(action.incident_id)
        if incident:
            incident.status = IncidentStatus.ACTIVE
            incident.assigned_responder_ids = []
            self.db.save_incident(incident)
            self.pq.insert(incident)

        responders = self.db.get_all_responders()
        resp = next((r for r in responders if r.id == action.responder_id), None)
        if resp:
            resp.status = ResponderStatus.AVAILABLE
            resp.current_incident_id = None
            self.db.save_responder(resp)

        self.db.log_audit("DISPATCH_UNDO", "COMMANDER", f"Undid dispatch {action.id} for incident {action.incident_id}.")
        return {"action": "UNDO", "action_id": action.id, "incident_id": action.incident_id}

    def redo_dispatch(self) -> Optional[Dict[str, Any]]:
        """Re-applies previously undone dispatch."""
        action = self.command_stack.redo()
        if not action:
            return None

        incident = self.db.get_incident(action.incident_id)
        if incident:
            incident.status = IncidentStatus.RESPONDING
            incident.assigned_responder_ids = [action.responder_id]
            self.db.save_incident(incident)

        responders = self.db.get_all_responders()
        resp = next((r for r in responders if r.id == action.responder_id), None)
        if resp:
            resp.status = ResponderStatus.DISPATCHED
            resp.current_incident_id = action.incident_id
            self.db.save_responder(resp)

        self.db.log_audit("DISPATCH_REDO", "COMMANDER", f"Redid dispatch {action.id} for incident {action.incident_id}.")
        return {"action": "REDO", "action_id": action.id, "incident_id": action.incident_id}

    # --- System Metrics & Summaries ---

    def get_system_summary(self) -> Dict[str, Any]:
        """Provides full real-time operational statistics."""
        incidents = self.db.get_all_incidents()
        responders = self.db.get_all_responders()
        hospitals = self.db.get_all_hospitals()

        total_beds = sum(h.capacity_total for h in hospitals)
        occupied_beds = sum(h.capacity_current for h in hospitals)
        available_beds = sum(h.available_beds for h in hospitals)

        active_inc = sum(1 for i in incidents if i.status in ("ACTIVE", "REPORTED", "RESPONDING", IncidentStatus.ACTIVE))
        resolved_inc = sum(1 for i in incidents if i.status in ("RESOLVED", IncidentStatus.RESOLVED))
        avail_resp = sum(1 for r in responders if r.status in ("AVAILABLE", ResponderStatus.AVAILABLE))

        return {
            "total_incidents": len(incidents),
            "active_incidents": active_inc,
            "resolved_incidents": resolved_inc,
            "total_responders": len(responders),
            "available_responders": avail_resp,
            "priority_queue_size": self.pq.size(),
            "total_hospital_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": available_beds,
            "hospital_occupancy_pct": round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0,
            "hash_table_metrics": self.cache.get_metrics(),
            "can_undo": self.command_stack.can_undo(),
            "can_redo": self.command_stack.can_redo(),
        }
