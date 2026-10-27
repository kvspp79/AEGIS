# 🚨 AEGIS Emergency Dispatch & Disaster Resource Management System (Python)

A complete, production-ready Python conversion of the AEGIS Emergency Management & Dispatch System.
Engineered with real Data Structures and Algorithms (DSA), persistent SQLite ACID database storage, dynamic starvation-free priority triage, graph-based emergency vehicle routing, nearest hospital bed allocation, and an interactive terminal CLI + REST API web dashboard.

---

## 📑 Table of Contents
1. [Quickstart & Installation](#1-quickstart--installation)
2. [Commands to Run the Application](#2-commands-to-run-the-application)
3. [Project Folder Structure](#3-project-folder-structure)
4. [DSA Algorithm Mapping Matrix](#4-dsa-algorithm-mapping-matrix)
5. [In-Depth Algorithm Workflows, Loops & Rationale](#5-in-depth-algorithm-workflows-loops--rationale)
6. [Database Schema & Persistence Across Restarts](#6-database-schema--persistence-across-restarts)
7. [Running Tests & Verification](#7-running-tests--verification)

---

## 1. Quickstart & Installation

### Requirements
- **Python 3.8+** (Python 3.10+ recommended)
- **Zero mandatory pip packages**: The entire core application, SQLite database, algorithms, CLI, and web server run out of the box using only the Python standard library (`sqlite3`, `http.server`, `heapq`, `math`, `json`, `dataclasses`, `time`, `typing`).

### Setup
```bash
# Unzip the downloaded file
unzip emergency_dispatch_system.zip
cd emergency_dispatch_python

# Optional: Install development enhancements (pytest, tabulate)
pip install -r requirements.txt
```

---

## 2. Commands to Run the Application

| Mode | Command | Description |
| :--- | :--- | :--- |
| **Interactive CLI** | `python main.py` or `python main.py --cli` | Opens the full-featured terminal control center with triage menus, vehicle dispatch, bed locator, and routing benchmarks. |
| **Web Server & UI** | `python main.py --server` | Starts the HTTP REST API and modern single-page dashboard at `http://localhost:8080/`. |
| **Custom Port** | `python main.py --server -p 9000` | Runs the web server on port 9000. |
| **Automated Demo** | `python main.py --demo` | Executes an automated 9-step simulation demonstrating every DSA feature and workflow. |
| **Run All Tests** | `python main.py --test` or `python -m unittest discover tests` | Executes the complete unittest suite covering all algorithms, triage, allocation, and persistence. |

---

## 3. Project Folder Structure

```text
emergency_dispatch_python/
├── main.py                  # Primary entry point (CLI, Server, Demo, Tests)
├── cli.py                   # Interactive terminal menu system
├── web_server.py            # Built-in HTTP REST API & interactive HTML5 dashboard
├── services.py              # Central coordination system connecting DSA & database
├── priority_queue.py        # Max-Heap with starvation-free dynamic aging
├── algorithms.py            # Graph routing, DSU, Knapsack, Trie, AVL, HashTable, Stack
├── allocation.py            # Smart dispatch suitability, Bipartite matching, Branch & Bound
├── hospital_service.py      # Nearest hospital search, bed reservation & release
├── database.py              # Persistent SQLite database operations & audit logs
├── models.py                # Dataclasses & enums (Incident, Responder, Hospital, etc.)
├── seed_data.py             # Default Coimbatore metropolitan disaster seed dataset
├── requirements.txt         # Optional pip dependencies
├── README.md                # Full architectural documentation
└── tests/
    ├── __init__.py
    ├── test_priority_queue.py   # Tests Max-Heap bubble up/down & aging
    ├── test_algorithms.py       # Tests Dijkstra, A*, DSU, Knapsack, Trie, AVL
    ├── test_allocation.py       # Tests smart scoring & branch and bound
    ├── test_hospital_service.py # Tests bed filtering and reservations
    └── test_database.py         # Tests SQLite persistence across restarts
```

---

## 4. DSA Algorithm Mapping Matrix

| DSA Algorithm / Data Structure | Exact Application Feature | Why Suitable for this Feature | File & Function | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Binary Max-Heap with Aging** | Incident Triage & Dispatch Ordering | Instant $O(1)$ lookup of highest-severity emergency; dynamic aging formula prevents low/moderate incidents from waiting indefinitely. | `priority_queue.py`<br>`EmergencyPriorityQueue` | Insert: $O(\log N)$<br>Extract: $O(\log N)$<br>Peek: $O(1)$ | $O(N)$ |
| **Dijkstra's Shortest Path** | Ambulance & Police Road Navigation | Finds the strictly fastest physical path across the weighted road network considering debris multipliers and flood hazards. | `algorithms.py`<br>`EmergencyGraph.dijkstra` | $O((V + E) \log V)$ | $O(V + E)$ |
| **A\* Search with Heuristic** | Fast Emergency Transit Estimation | Guides graph search toward target coordinates using Euclidean geographic distance, exploring fewer nodes than Dijkstra. | `algorithms.py`<br>`EmergencyGraph.a_star` | $O(E)$ (best)<br>$O((V + E) \log V)$ | $O(V)$ |
| **Bellman-Ford Algorithm** | Disaster Road Failure Analysis | Iteratively relaxes edges to detect cascading road blockages and route around severe risk factors. | `algorithms.py`<br>`EmergencyGraph.bellman_ford` | $O(V \times E)$ | $O(V)$ |
| **Disjoint Set Union (DSU)** | Flood Zone Isolation & Bridge Outage | Detects if bridges or arterial roads collapsing has severed neighborhood clusters from hospital nodes in near $O(1)$ time. | `algorithms.py`<br>`DisjointSetUnion` | $O(\alpha(V)) \approx O(1)$ per op | $O(V)$ |
| **0/1 Dynamic Programming Knapsack** | Relief Supply Cargo Optimization | Maximizes life-saving utility under aircraft/vehicle cargo weight limits without exceeding capacity. | `algorithms.py`<br>`solve_01_knapsack` | $O(N \times W)$ | $O(N \times W)$ |
| **Greedy Interval Scheduling** | Evacuation Runway / Helipad Slots | Mathematically guarantees the maximum number of emergency air missions by scheduling flights by earliest finish time. | `algorithms.py`<br>`compute_greedy_interval_scheduling` | $O(M \log M)$ | $O(M)$ |
| **Trie (Prefix Tree)** | Real-time Search Autocomplete | Instant keystroke search for 100+ disaster incident types, medicines, and rescue vehicle callsigns. | `algorithms.py`<br>`DisasterTrie.search_prefix` | $O(L + K)$ ($L$=prefix, $K$=matches) | $O(\Sigma \times L)$ |
| **AVL Tree (Self-Balancing BST)** | Responder Speed & Capacity Range Query | Self-balances heights using rotations, ensuring guaranteed $O(\log N)$ queries without degrading into a linked list. | `algorithms.py`<br>`AVLTree.find_in_range` | Search: $O(\log N)$<br>Range: $O(\log N + K)$ | $O(N)$ |
| **Dynamic Resizing Hash Table** | In-Memory Resource & Incident Cache | Polynomial rolling hash with chaining collision resolution and automatic doubling at load factor $> 0.75$. | `algorithms.py`<br>`DynamicResourceHashTable` | Insert/Get: $O(1)$ avg<br>Resize: $O(N)$ | $O(N)$ |
| **Command Pattern Stack** | Dispatch Undo / Redo Audit Trail | LIFO stack tracks all dispatch actions, allowing commanders to revert accidental dispatches instantly. | `algorithms.py`<br>`DispatchCommandStack` | Push/Pop: $O(1)$ | $O(S)$ |
| **Branch and Bound** | Multi-Incident Multi-Vehicle Fleet Assignment | Computes the globally optimal assignment of vehicles to incidents while pruning suboptimal branches via lower bounds. | `allocation.py`<br>`compute_branch_and_bound_assignment` | $O(N!)$ worst, heavily pruned in practice | $O(N)$ |

---

## 5. In-Depth Algorithm Workflows, Loops & Rationale

### 1. Max-Heap with Dynamic Aging (`priority_queue.py`)
- **Workflow**:
  1. Incident arrives with `base_priority` (1-100), reported `casualties`, and `severity`.
  2. Formula: `Priority = base_priority * 0.4 + severity_factor + casualties * 3 + aging_minutes * aging_rate`.
  3. Appended to heap array and bubbles up:
     ```python
     while index > 0:
         parent_idx = (index - 1) // 2
         if heap[index].priority <= heap[parent_idx].priority:
             break
         swap(heap[index], heap[parent_idx])
         index = parent_idx
     ```
  4. Time progression calls `reapply_aging(minutes)`, boosting waiting incidents and calling Floyd's bottom-up `_rebuild_heap()` in $O(N)$ time.

### 2. Dijkstra's Shortest Path Routing (`algorithms.py`)
- **Workflow**:
  1. Initialize distance table: start vertex $= 0$, all other vertices $= \infty$.
  2. Maintain a Min-Heap priority queue of `(current_distance, node_id)`.
  3. While priority queue is non-empty:
     - Pop minimum vertex `u`. If already visited, continue.
     - For every neighbor `v` connected to `u` with road edge weight `w`:
       - If `dist[u] + w < dist[v]`: update `dist[v] = dist[u] + w`, set `previous[v] = u`, push `(dist[v], v)` to min-heap.
  4. Trace back from target node via `previous` pointer to build the exact sequence of road segments.

### 3. Nearest Hospital Bed Allocation (`hospital_service.py`)
- **Workflow**:
  1. Filters hospital candidates where `available_beds > 0` (i.e. `capacity_total - capacity_current > 0`).
  2. For eligible hospitals, computes spherical driving distance using Haversine with a $1.28\times$ road winding multiplier.
  3. Calculates estimated time of arrival (ETA) at average urban emergency ambulance speed ($42\text{ km/h}$).
  4. Atomically reserves 1 bed, updating hospital status to `NEAR_CAPACITY` or `FULL` when appropriate.

---

## 6. Database Schema & Persistence Across Restarts

The system uses an ACID-compliant SQLite database (`emergency_dispatch.db`):
- `incidents`: Full incident details, coordinates, casualties, aging minutes, triage priorities.
- `responders`: Vehicle fleet callsigns, speed, crew count, status (`AVAILABLE`, `DISPATCHED`, `ON_SCENE`).
- `hospitals`: Total bed capacity, occupied beds, emergency telephone lines, trauma status.
- `dispatches`: Active and past dispatch missions, route distances, travel ETAs, assigned hospitals.
- `audit_log`: Permanent immutable audit trail recording all commander and system actions.

Data persists across application restarts and server reboots.

---

## 7. Running Tests & Verification

Run the entire automated unittest suite with:
```bash
python main.py --test
```
or
```bash
python3 -m unittest discover tests
```

### Verified Test Cases:
- `test_insert_and_peek`: Verifies $O(1)$ peek and priority calculation.
- `test_extract_max_order`: Verifies correct Max-Heap extraction order (CRITICAL $\to$ MODERATE $\to$ LOW).
- `test_aging_prevents_starvation`: Verifies waiting low-priority incidents gain priority over time.
- `test_haversine_distance`: Verifies accurate km calculation with road winding factor.
- `test_graph_routing_algorithms`: Compares Dijkstra, A*, and Bellman-Ford on identical network.
- `test_disjoint_set_union`: Verifies connected components and severed zone detection.
- `test_01_knapsack`: Verifies dynamic programming table and optimal item selection.
- `test_greedy_interval_scheduling`: Verifies conflict-free runway slot selection.
- `test_disaster_trie`: Verifies prefix search for emergency search autocomplete.
- `test_avl_tree_range`: Verifies self-balancing BST range queries.
- `test_dynamic_hash_table_resizing`: Verifies polynomial hash, chaining, and load factor doubling.
- `test_command_stack_undo_redo`: Verifies LIFO undo and redo of dispatch actions.
- `test_nearest_hospital_filters_full_facilities`: Verifies facilities at 100% capacity are bypassed.
- `test_incident_persistence_across_reconnect`: Verifies SQLite persists records when app reloads.
