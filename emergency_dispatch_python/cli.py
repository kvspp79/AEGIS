"""
Interactive Command-Line Interface (CLI) for Emergency Dispatch Management.
Provides terminal-based triage control, routing benchmarks, and dispatch workflows.
"""

import sys
from typing import Optional
from models import DisasterType, SeverityLevel, Coordinates
from services import EmergencyDispatchSystem
from algorithms import KnapsackItem, solve_01_knapsack


def print_banner():
    print("=" * 70)
    print("  🚨 AEGIS EMERGENCY DISPATCH & RESOURCE COORDINATION SYSTEM 🚨")
    print("          (Coimbatore Metropolitan Disaster Network)")
    print("=" * 70)


def display_menu():
    print("\nOperational Control Menu:")
    print(" [1] 📋 View Priority Triage Queue (Max-Heap)")
    print(" [2] ➕ Register New Emergency Incident")
    print(" [3] 🚑 Dispatch Highest Priority Emergency (Dijkstra + Bed Reservation)")
    print(" [4] ✅ Mark Mission Complete (Hospital Handover & Reset Vehicle)")
    print(" [5] ⏪ Undo / ⏩ Redo Last Dispatch Action (Command Pattern)")
    print(" [6] 🏥 Hospital Status & Nearest Facility Locator")
    print(" [7] ⚡ DSA Routing Benchmark (Dijkstra vs A* vs Bellman-Ford)")
    print(" [8] 🎒 Relief Supply 0/1 Knapsack Cargo Optimizer")
    print(" [9] 📊 System Status & Resource Hash Table Metrics")
    print(" [0] 🚪 Exit")


def run_cli():
    system = EmergencyDispatchSystem()
    print_banner()

    while True:
        display_menu()
        choice = input("\nEnter selection (0-9): ").strip()

        if choice == "1":
            print("\n--- Emergency Priority Triage Queue (Max-Heap) ---")
            heap_items = system.pq.get_heap_array()
            if not heap_items:
                print("No pending emergency incidents in queue.")
            else:
                for idx, inc in enumerate(heap_items, 1):
                    print(f" {idx}. [{inc.id}] Priority: {inc.calculated_priority}/100 | {inc.severity.value} {inc.type.value}")
                    print(f"    Location: {inc.location_name} | Casualties: {inc.casualties} | Waiting: {inc.aging_minutes}m")
                    print(f"    Status: {inc.status.value}")

        elif choice == "2":
            print("\n--- Register New Emergency Incident ---")
            title = input("Incident Title: ").strip() or "Urban Flooding & Road Inundation"
            print("Types: FLOOD, BUILDING_COLLAPSE, CHEMICAL_LEAK, WILDFIRE, MEDICAL, TRANSIT_ACCIDENT")
            t_str = input("Disaster Type [FLOOD]: ").strip().upper() or "FLOOD"
            disaster_type = getattr(DisasterType, t_str, DisasterType.FLOOD)

            print("Severities: CRITICAL, SEVERE, MODERATE, LOW")
            s_str = input("Severity Level [HIGH]: ").strip().upper() or "HIGH"
            severity = getattr(SeverityLevel, s_str, SeverityLevel.HIGH)

            location = input("Location Name [RS Puram East]: ").strip() or "RS Puram East, Coimbatore"
            try:
                casualties = int(input("Reported Casualties [3]: ").strip() or "3")
            except ValueError:
                casualties = 0

            inc = system.register_incident(
                title=title,
                disaster_type=disaster_type,
                severity=severity,
                location_name=location,
                coordinates=Coordinates(lat=11.0120, lng=76.9580),
                casualties=casualties,
                description="Reported via Emergency Dispatch CLI",
                base_priority=80,
            )
            print(f"\n✅ Registered Incident {inc.id} with Priority Score {inc.calculated_priority}/100.")

        elif choice == "3":
            print("\n--- Dispatch Nearest Emergency Responder ---")
            top_inc = system.pq.peek()
            if not top_inc:
                print("Queue is empty. No active emergencies to dispatch.")
                continue

            print(f"Selected Top Priority: {top_inc.title} ({top_inc.severity.value}) Priority: {top_inc.calculated_priority}")
            algo_choice = input("Select Routing Algorithm (1: Dijkstra, 2: A*, 3: Bellman-Ford) [1]: ").strip()
            algo = "A_STAR" if algo_choice == "2" else "BELLMAN_FORD" if algo_choice == "3" else "DIJKSTRA"

            try:
                result = system.dispatch_unit(incident_id=top_inc.id, routing_algo=algo)
                system.pq.extract_max()
                print("\n🚨 DISPATCH SUCCESSFUL!")
                print(f"  • Responder: {result['responder']['name']} ({result['responder']['callsign']})")
                print(f"  • Route: {' -> '.join(result['route']['path'])} ({result['route']['total_distance_km']} km, ~{result['route']['estimated_minutes']} mins)")
                if result.get("hospital"):
                    h = result["hospital"]
                    print(f"  • Destination Hospital: {h['hospital_name']} (Beds Remaining: {h['available_beds'] - 1})")
            except Exception as e:
                print(f"❌ Dispatch failed: {e}")

        elif choice == "4":
            print("\n--- Mark Mission Complete ---")
            active_incidents = [i for i in system.db.get_all_incidents() if i.status == "RESPONDING"]
            if not active_incidents:
                print("No missions currently in progress.")
                continue

            for idx, inc in enumerate(active_incidents, 1):
                resp_str = ", ".join(inc.assigned_responder_ids)
                print(f" {idx}. Incident: {inc.title} ({inc.id}) | Responders: {resp_str}")

            try:
                sel = int(input("Select mission number to complete: ").strip()) - 1
                target = active_incidents[sel]
                resp_id = target.assigned_responder_ids[0] if target.assigned_responder_ids else "RES-CBE-01"
                res = system.complete_mission(target.id, resp_id)
                print(f"✅ Mission Accomplished for {target.id}. Vehicle {resp_id} reset to AVAILABLE status.")
            except (ValueError, IndexError):
                print("Invalid selection.")

        elif choice == "5":
            print("\n--- Undo / Redo Dispatch Transaction ---")
            print(" 1. Undo last dispatch")
            print(" 2. Redo last undone dispatch")
            sub = input("Selection (1-2): ").strip()
            if sub == "1":
                res = system.undo_last_dispatch()
                if res:
                    print(f"⏪ Reverted dispatch action {res['action_id']} for incident {res['incident_id']}.")
                else:
                    print("No dispatch actions available to undo.")
            elif sub == "2":
                res = system.redo_dispatch()
                if res:
                    print(f"⏩ Restored dispatch action {res['action_id']} for incident {res['incident_id']}.")
                else:
                    print("No dispatch actions available to redo.")

        elif choice == "6":
            print("\n--- Hospital Bed Availability & Facility Directory ---")
            hospitals = system.db.get_all_hospitals()
            for h in hospitals:
                pct = round((h.capacity_current / h.capacity_total) * 100, 1)
                print(f" • {h.name}")
                print(f"    Available Beds: {h.available_beds}/{h.capacity_total} ({pct}% occupied) | Status: {h.status}")
                print(f"    Location: {h.location_name} | Emergency Phone: {h.contact_phone}")

        elif choice == "7":
            print("\n--- DSA Routing Algorithm Benchmark ---")
            from_node = "NODE-CBE-01"
            to_node = "NODE-CBE-06"
            print(f"Calculating route from {from_node} to {to_node} across road network:\n")

            d_res = system.graph.dijkstra(from_node, to_node)
            print(f" [DIJKSTRA]     Time: {d_res.execution_time_ms}ms | Visited: {d_res.nodes_visited} nodes | Dist: {d_res.total_distance_km}km | Time Complexity: {d_res.time_complexity}")

            a_res = system.graph.a_star(from_node, to_node)
            print(f" [A* SEARCH]    Time: {a_res.execution_time_ms}ms | Visited: {a_res.nodes_visited} nodes | Dist: {a_res.total_distance_km}km | Time Complexity: {a_res.time_complexity}")

            b_res = system.graph.bellman_ford(from_node, to_node)
            print(f" [BELLMAN-FORD] Time: {b_res.execution_time_ms}ms | Visited: {b_res.nodes_visited} nodes | Dist: {b_res.total_distance_km}km | Time Complexity: {b_res.time_complexity}")

        elif choice == "8":
            print("\n--- 0/1 Knapsack Cargo Payload Optimizer ---")
            sample_items = [
                KnapsackItem("MED-01", "Trauma Blood Packs (Type O-)", 15, 95, "MEDICAL"),
                KnapsackItem("MED-02", "Portable Ventilators & Oxygen", 25, 90, "MEDICAL"),
                KnapsackItem("REL-01", "High-Energy Rations & Purified Water", 30, 70, "FOOD"),
                KnapsackItem("SAR-01", "Hydraulic Rescue Cutters", 40, 85, "SAR"),
                KnapsackItem("PWR-01", "Compact Inverter Emergency Generator", 35, 75, "POWER"),
                KnapsackItem("COM-01", "Satellite Comms Pack", 10, 80, "COMMS"),
            ]
            cap = 70
            knap_res = solve_01_knapsack(sample_items, cap)
            print(f"Payload Capacity: {cap} kg")
            print(f"Optimal Value Extracted: {knap_res['total_value']} points (Weight: {knap_res['total_weight']} kg)")
            print("Selected Manifest:")
            for it in knap_res["selected_items"]:
                print(f"  • {it['name']} ({it['weight']}kg, Value: {it['value']})")

        elif choice == "9":
            print("\n--- Operational Summary & Hash Table Metrics ---")
            summary = system.get_system_summary()
            for k, v in summary.items():
                print(f"  {k}: {v}")

        elif choice == "0":
            print("\nExiting AEGIS Dispatch System. Stay safe!")
            sys.exit(0)
        else:
            print("Invalid command. Please select 0-9.")


if __name__ == "__main__":
    run_cli()
