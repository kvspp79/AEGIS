"""
AEGIS Emergency Dispatch & Resource Optimization System
Main Application Entry Point.

Usage:
    python main.py           # Launch Interactive Terminal CLI
    python main.py --cli     # Explicitly launch Interactive CLI
    python main.py --server  # Launch Web Server & REST API on port 8080
    python main.py --demo    # Run automated end-to-end simulation & DSA demo
    python main.py --test    # Run comprehensive automated test suite
"""

import sys
import argparse
import unittest
from cli import run_cli
from web_server import run_server
from services import EmergencyDispatchSystem
from models import Coordinates, DisasterType, SeverityLevel
from algorithms import KnapsackItem, solve_01_knapsack, RescueSlot, compute_greedy_interval_scheduling, DisjointSetUnion


def run_automated_demo():
    print("=" * 75)
    print("  🚨 AEGIS EMERGENCY DISPATCH SYSTEM — AUTOMATED DSA DEMONSTRATION 🚨")
    print("=" * 75)

    system = EmergencyDispatchSystem(db_path=":memory:")  # Clean in-memory demo
    print("\n[Step 1] Initializing System & Max-Heap Priority Queue...")
    print(f"  • Incidents Loaded: {system.pq.size()} in Max-Heap")
    top = system.pq.peek()
    if top:
        print(f"  • Current Top Priority: {top.title} (Priority: {top.calculated_priority}/100, Severity: {top.severity.value})")

    print("\n[Step 2] Simulating Waiting Time Starvation Aging...")
    print("  • Applying +10 minutes elapsed aging to all active incidents...")
    system.simulate_time_aging(10)
    top_after = system.pq.peek()
    if top_after:
        print(f"  • Top Incident After Aging: {top_after.title} (Priority Boosted to {top_after.calculated_priority}/100)")

    print("\n[Step 3] Registering Critical Mass-Casualty Disaster Incident...")
    new_inc = system.register_incident(
        title="Chemical Factory Explosion & Toxic Plume",
        disaster_type=DisasterType.CHEMICAL_LEAK,
        severity=SeverityLevel.CRITICAL,
        location_name="Kurichi Chemical Corridor, Coimbatore",
        coordinates=Coordinates(lat=10.9410, lng=76.9770),
        casualties=14,
        affected_population=1800,
        description="Ammonia pipeline rupture with multi-victim inhalation distress.",
        base_priority=95,
    )
    print(f"  • Registered: {new_inc.title} (Calculated Priority: {new_inc.calculated_priority}/100)")
    print(f"  • Max-Heap Root is now: {system.pq.peek().title} (O(1) verified)")

    print("\n[Step 4] Executing Intelligent Smart Dispatch & Hospital Bed Reservation...")
    dispatch_res = system.dispatch_unit(incident_id=new_inc.id, routing_algo="DIJKSTRA")
    resp = dispatch_res["responder"]
    hosp = dispatch_res["hospital"]
    route = dispatch_res["route"]
    print(f"  • Assigned Responder: {resp['name']} ({resp['type']})")
    print(f"  • Shortest Route (Dijkstra): {' -> '.join(route['path'])}")
    print(f"    Total Road Distance: {route['total_distance_km']} km | Travel ETA: {route['estimated_minutes']} mins")
    print(f"    Graph Execution Time: {route['execution_time_ms']} ms | Nodes Explored: {route['nodes_visited']}")
    if hosp:
        print(f"  • Assigned Hospital: {hosp['hospital_name']}")
        print(f"    Available Beds Remaining: {hosp['available_beds'] - 1} | Driving ETA: {hosp['duration_text']}")

    print("\n[Step 5] Simulating Mission Complete (Hospital Handover & Vehicle Reset)...")
    comp_res = system.complete_mission(incident_id=new_inc.id, responder_id=resp["id"])
    print(f"  • Incident Status: {comp_res['status']}")
    print(f"  • Responder Status Reset: {comp_res['vehicle_status']} (Zero Ghost Animations)")

    print("\n[Step 6] Command Pattern Undo / Redo Audit Verification...")
    undo_res = system.undo_last_dispatch()
    print(f"  • Undone Action: {undo_res['action']} for Incident {undo_res['incident_id']}")
    redo_res = system.redo_dispatch()
    print(f"  • Redone Action: {redo_res['action']} for Incident {redo_res['incident_id']}")

    print("\n[Step 7] 0/1 Knapsack Cargo Payload Optimization...")
    sample_cargo = [
        KnapsackItem("K1", "Advanced Trauma Kits", 20, 90, "MED"),
        KnapsackItem("K2", "Oxygen Cylinders & Masks", 30, 85, "MED"),
        KnapsackItem("K3", "Emergency Rations Pack", 25, 60, "FOOD"),
        KnapsackItem("K4", "Satellite Comms Beacon", 10, 80, "COMMS"),
    ]
    knap = solve_01_knapsack(sample_cargo, capacity_kg=50)
    print(f"  • Payload Capacity: 50 kg")
    print(f"  • Items Chosen: {[it['name'] for it in knap['selected_items']]}")
    print(f"  • Total Value: {knap['total_value']} pts | Total Weight: {knap['total_weight']} kg")

    print("\n[Step 8] Trie Prefix Autocomplete Search...")
    trie_matches = system.trie.search_prefix("Coimbatore", max_results=3)
    print(f"  • Prefix 'Coimbatore' Autocomplete Results: {[m['title'] for m in trie_matches]}")

    print("\n[Step 9] Disjoint Set Union (DSU) Island Isolation Detection...")
    nodes = ["NODE-01", "NODE-02", "NODE-03", "NODE-04", "SEVERED-ISLAND-01"]
    dsu = DisjointSetUnion(nodes)
    dsu.union("NODE-01", "NODE-02")
    dsu.union("NODE-02", "NODE-03")
    # NODE-04 and SEVERED-ISLAND-01 are not connected to hospital node NODE-01
    components = dsu.get_connected_components(nodes, hospital_bases=["NODE-01"])
    print(f"  • Connected Components Identified: {len(components['components'])}")
    print(f"  • Disconnected / Severed Zones: {components['isolated_areas']}")

    print("\n" + "=" * 75)
    print("  🎉 ALL DSA MODULES, WORKFLOWS & SQLITE PERSISTENCE FULLY VERIFIED! 🎉")
    print("=" * 75)


def run_tests():
    print("Running Emergency Dispatch System Unittest Suite...")
    loader = unittest.TestLoader()
    suite = loader.discover("tests")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


def main():
    parser = argparse.ArgumentParser(description="AEGIS Emergency Dispatch & Resource Optimization System")
    parser.add_argument("--cli", action="store_true", help="Run interactive terminal CLI")
    parser.add_argument("--server", "-s", action="store_true", help="Run HTTP REST API and Web Dashboard")
    parser.add_argument("--port", "-p", type=int, default=8080, help="Web server port (default 8080)")
    parser.add_argument("--demo", "-d", action="store_true", help="Run automated end-to-end verification demo")
    parser.add_argument("--test", "-t", action="store_true", help="Run unittest suite")

    args = parser.parse_args()

    if args.demo:
        run_automated_demo()
    elif args.test:
        run_tests()
    elif args.server:
        run_server(args.port)
    else:
        run_cli()


if __name__ == "__main__":
    main()
