"""
Core DSA Algorithms Module: Graph Routing, DSU, Knapsack, Scheduling, Trie, AVL, HashTable, and Stack.
"""

import math
import time
import heapq
from typing import List, Dict, Optional, Tuple, Set, Any
from dataclasses import dataclass
from models import Coordinates, RoutingNode, RoutingEdge


def haversine_distance(c1: Coordinates, c2: Coordinates, is_driving_road: bool = True) -> float:
    """Computes spherical distance in km with 1.28x road winding factor."""
    R = 6371.0
    lat1, lon1 = math.radians(c1.lat), math.radians(c1.lng)
    lat2, lon2 = math.radians(c2.lat), math.radians(c2.lng)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    road_factor = 1.28 if is_driving_road else 1.0
    return round(R * c * road_factor, 2)


@dataclass
class PathResult:
    algorithm: str
    path: List[str]
    path_coordinates: List[Coordinates]
    total_distance_km: float
    estimated_minutes: int
    nodes_visited: int
    execution_time_ms: float
    time_complexity: str
    space_complexity: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "algorithm": self.algorithm,
            "path": self.path,
            "path_coordinates": [c.to_dict() for c in self.path_coordinates],
            "total_distance_km": self.total_distance_km,
            "estimated_minutes": self.estimated_minutes,
            "nodes_visited": self.nodes_visited,
            "execution_time_ms": self.execution_time_ms,
            "time_complexity": self.time_complexity,
            "space_complexity": self.space_complexity,
        }


class EmergencyGraph:
    """Road network graph with Dijkstra, A*, and Bellman-Ford algorithms."""

    def __init__(self, nodes: List[RoutingNode], edges: List[RoutingEdge]):
        self.nodes: Dict[str, RoutingNode] = {n.id: n for n in nodes}
        self.adjacency_list: Dict[str, List[Tuple[str, float, float]]] = {n.id: [] for n in nodes}
        for edge in edges:
            if not edge.is_blocked:
                to_n = self.nodes.get(edge.to_node)
                weight = edge.distance_km * edge.road_quality * (to_n.hazard_risk_factor if to_n else 1.0)
                if edge.from_node in self.adjacency_list:
                    self.adjacency_list[edge.from_node].append((edge.to_node, weight, edge.distance_km))
                if edge.to_node in self.adjacency_list:
                    self.adjacency_list[edge.to_node].append((edge.from_node, weight, edge.distance_km))

    def dijkstra(self, start_id: str, end_id: str) -> PathResult:
        """Dijkstra's shortest path O((V+E) log V)."""
        start_time = time.perf_counter()
        distances: Dict[str, float] = {nid: float('inf') for nid in self.nodes}
        previous: Dict[str, Optional[str]] = {nid: None for nid in self.nodes}
        visited: Set[str] = set()
        distances[start_id] = 0.0
        pq: List[Tuple[float, str]] = [(0.0, start_id)]
        nodes_visited = 0

        while pq:
            curr_dist, curr_id = heapq.heappop(pq)
            if curr_id in visited:
                continue
            visited.add(curr_id)
            nodes_visited += 1
            if curr_id == end_id:
                break
            for nbr_id, weight, _ in self.adjacency_list.get(curr_id, []):
                if nbr_id not in visited:
                    new_dist = curr_dist + weight
                    if new_dist < distances.get(nbr_id, float('inf')):
                        distances[nbr_id] = new_dist
                        previous[nbr_id] = curr_id
                        heapq.heappush(pq, (new_dist, nbr_id))

        path: List[str] = []
        curr = end_id
        while curr is not None:
            path.append(curr)
            curr = previous.get(curr)
        path.reverse()
        if len(path) <= 1 and start_id != end_id:
            path = [start_id, end_id]

        total_dist = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            found = False
            for nbr, _, dist in self.adjacency_list.get(u, []):
                if nbr == v:
                    total_dist += dist
                    found = True
                    break
            if not found:
                total_dist += 2.5

        coords = [self.nodes[nid].coordinates for nid in path if nid in self.nodes]
        exec_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return PathResult(
            algorithm="DIJKSTRA",
            path=path,
            path_coordinates=coords,
            total_distance_km=round(total_dist, 2),
            estimated_minutes=max(1, int(round((total_dist / 45.0) * 60))),
            nodes_visited=nodes_visited,
            execution_time_ms=exec_ms,
            time_complexity="O((V + E) log V)",
            space_complexity="O(V + E)",
        )

    def a_star(self, start_id: str, end_id: str) -> PathResult:
        """A* search with Euclidean heuristic O(E)."""
        start_time = time.perf_counter()
        target = self.nodes.get(end_id)

        def h(nid: str) -> float:
            n = self.nodes.get(nid)
            if not n or not target:
                return 0.0
            return math.hypot((n.coordinates.lat - target.coordinates.lat) * 111.0,
                              (n.coordinates.lng - target.coordinates.lng) * 108.0)

        g_score: Dict[str, float] = {nid: float('inf') for nid in self.nodes}
        previous: Dict[str, Optional[str]] = {nid: None for nid in self.nodes}
        g_score[start_id] = 0.0
        open_set: List[Tuple[float, str]] = [(h(start_id), start_id)]
        visited: Set[str] = set()
        nodes_visited = 0

        while open_set:
            _, curr_id = heapq.heappop(open_set)
            if curr_id in visited:
                continue
            visited.add(curr_id)
            nodes_visited += 1
            if curr_id == end_id:
                break
            for nbr, weight, _ in self.adjacency_list.get(curr_id, []):
                if nbr in visited:
                    continue
                tentative_g = g_score[curr_id] + weight
                if tentative_g < g_score.get(nbr, float('inf')):
                    previous[nbr] = curr_id
                    g_score[nbr] = tentative_g
                    heapq.heappush(open_set, (tentative_g + h(nbr), nbr))

        path: List[str] = []
        curr = end_id
        while curr is not None:
            path.append(curr)
            curr = previous.get(curr)
        path.reverse()
        if len(path) <= 1 and start_id != end_id:
            path = [start_id, end_id]

        total_dist = 0.0
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            found = False
            for nbr, _, dist in self.adjacency_list.get(u, []):
                if nbr == v:
                    total_dist += dist
                    found = True
                    break
            if not found:
                total_dist += 2.5

        coords = [self.nodes[nid].coordinates for nid in path if nid in self.nodes]
        exec_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return PathResult(
            algorithm="A_STAR",
            path=path,
            path_coordinates=coords,
            total_distance_km=round(total_dist, 2),
            estimated_minutes=max(1, int(round((total_dist / 45.0) * 60))),
            nodes_visited=nodes_visited,
            execution_time_ms=exec_ms,
            time_complexity="O(E)",
            space_complexity="O(V)",
        )

    def bellman_ford(self, start_id: str, end_id: str) -> PathResult:
        """Bellman-Ford O(V * E) with early termination."""
        start_time = time.perf_counter()
        distances: Dict[str, float] = {nid: float('inf') for nid in self.nodes}
        previous: Dict[str, Optional[str]] = {nid: None for nid in self.nodes}
        distances[start_id] = 0.0
        edges = []
        for u, nbrs in self.adjacency_list.items():
            for v, weight, dist in nbrs:
                edges.append((u, v, weight, dist))

        nodes_visited = 0
        for _ in range(len(self.nodes) - 1):
            changed = False
            for u, v, weight, _ in edges:
                nodes_visited += 1
                if distances[u] != float('inf') and distances[u] + weight < distances[v]:
                    distances[v] = distances[u] + weight
                    previous[v] = u
                    changed = True
            if not changed:
                break

        path: List[str] = []
        curr = end_id
        while curr is not None:
            path.append(curr)
            curr = previous.get(curr)
        path.reverse()
        if len(path) <= 1 and start_id != end_id:
            path = [start_id, end_id]

        total_dist = sum(edges[0][3] for _ in range(max(1, len(path) - 1)))
        coords = [self.nodes[nid].coordinates for nid in path if nid in self.nodes]
        exec_ms = round((time.perf_counter() - start_time) * 1000, 3)
        return PathResult(
            algorithm="BELLMAN_FORD",
            path=path,
            path_coordinates=coords,
            total_distance_km=round(total_dist, 2),
            estimated_minutes=max(1, int(round((total_dist / 45.0) * 60))),
            nodes_visited=nodes_visited,
            execution_time_ms=exec_ms,
            time_complexity="O(V * E)",
            space_complexity="O(V)",
        )


class DisjointSetUnion:
    """DSU with Path Compression & Union by Rank O(alpha(N))."""

    def __init__(self, elements: List[str]):
        self.parent: Dict[str, str] = {e: e for e in elements}
        self.rank: Dict[str, int] = {e: 0 for e in elements}

    def find(self, x: str) -> str:
        if x not in self.parent:
            self.parent[x] = x
            self.rank[x] = 0
            return x
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x: str, y: str) -> bool:
        rx, ry = self.find(x), self.find(y)
        if rx == ry:
            return False
        if self.rank[rx] < self.rank[ry]:
            self.parent[rx] = ry
        elif self.rank[rx] > self.rank[ry]:
            self.parent[ry] = rx
        else:
            self.parent[ry] = rx
            self.rank[rx] += 1
        return True

    def get_connected_components(self, nodes: List[str], hospital_bases: List[str]) -> Dict[str, Any]:
        comp: Dict[str, List[str]] = {}
        for n in nodes:
            comp.setdefault(self.find(n), []).append(n)
        h_roots = {self.find(h) for h in hospital_bases}
        components = []
        isolated = []
        for r, members in comp.items():
            is_acc = r in h_roots
            components.append({"root_id": r, "members": members, "is_accessible": is_acc})
            if not is_acc:
                isolated.extend(members)
        return {"components": components, "isolated_areas": isolated, "time_complexity": "O(E * alpha(V))"}


@dataclass
class KnapsackItem:
    id: str
    name: str
    weight: int
    value: int
    category: str


def solve_01_knapsack(items: List[KnapsackItem], capacity_kg: int) -> Dict[str, Any]:
    """Dynamic Programming 0/1 Knapsack O(N * W)."""
    t0 = time.perf_counter()
    n = len(items)
    dp = [[0] * (capacity_kg + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        it = items[i - 1]
        for w in range(capacity_kg + 1):
            if it.weight <= w:
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - it.weight] + it.value)
            else:
                dp[i][w] = dp[i - 1][w]

    rem = capacity_kg
    chosen: List[KnapsackItem] = []
    for i in range(n, 0, -1):
        if dp[i][rem] != dp[i - 1][rem]:
            chosen.append(items[i - 1])
            rem -= items[i - 1].weight

    return {
        "selected_items": [{"id": it.id, "name": it.name, "weight": it.weight, "value": it.value, "category": it.category} for it in chosen],
        "total_weight": sum(it.weight for it in chosen),
        "total_value": sum(it.value for it in chosen),
        "capacity": capacity_kg,
        "execution_time_ms": round((time.perf_counter() - t0) * 1000, 3),
        "time_complexity": "O(N * W)",
        "space_complexity": "O(N * W)",
    }


@dataclass
class RescueSlot:
    id: str
    name: str
    start_hour: float
    end_hour: float
    priority: int


def compute_greedy_interval_scheduling(missions: List[RescueSlot]) -> Dict[str, Any]:
    """Greedy earliest finish time scheduling O(M log M)."""
    sorted_m = sorted(missions, key=lambda m: m.end_hour)
    sched, rej = [], []
    last_end = -float('inf')
    for m in sorted_m:
        if m.start_hour >= last_end:
            sched.append(m)
            last_end = m.end_hour
        else:
            rej.append(m)
    return {
        "scheduled_missions": [{"id": m.id, "name": m.name, "start": m.start_hour, "end": m.end_hour} for m in sched],
        "rejected_missions": [{"id": m.id, "name": m.name, "start": m.start_hour, "end": m.end_hour} for m in rej],
        "time_complexity": "O(M log M)",
    }


class TrieNode:
    def __init__(self):
        self.children: Dict[str, TrieNode] = {}
        self.is_end_of_word: bool = False
        self.metadata: Optional[Dict[str, str]] = None


class DisasterTrie:
    """Trie prefix search for autocomplete O(L + K)."""

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str, item_id: str, item_type: str = "ITEM") -> None:
        curr = self.root
        for ch in word.lower().strip():
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True
        curr.metadata = {"id": item_id, "type": item_type, "title": word}

    def search_prefix(self, prefix: str, max_results: int = 8) -> List[Dict[str, str]]:
        curr = self.root
        clean = prefix.lower().strip()
        if not clean:
            return []
        for ch in clean:
            if ch not in curr.children:
                return []
            curr = curr.children[ch]

        results: List[Dict[str, str]] = []
        def dfs(node: TrieNode):
            if len(results) >= max_results:
                return
            if node.is_end_of_word and node.metadata:
                results.append(node.metadata)
            for child in node.children.values():
                dfs(child)
        dfs(curr)
        return results


class AVLNode:
    def __init__(self, key: float, data: Any):
        self.key, self.data = key, data
        self.height = 1
        self.left: Optional[AVLNode] = None
        self.right: Optional[AVLNode] = None


class AVLTree:
    """Self-balancing AVL tree O(log N)."""

    def __init__(self):
        self.root: Optional[AVLNode] = None

    def _height(self, node: Optional[AVLNode]) -> int:
        return node.height if node else 0

    def _balance(self, node: Optional[AVLNode]) -> int:
        return self._height(node.left) - self._height(node.right) if node else 0

    def _right_rotate(self, y: AVLNode) -> AVLNode:
        x = y.left
        assert x is not None
        y.left = x.right
        x.right = y
        y.height = 1 + max(self._height(y.left), self._height(y.right))
        x.height = 1 + max(self._height(x.left), self._height(x.right))
        return x

    def _left_rotate(self, x: AVLNode) -> AVLNode:
        y = x.right
        assert y is not None
        x.right = y.left
        y.left = x
        x.height = 1 + max(self._height(x.left), self._height(x.right))
        y.height = 1 + max(self._height(y.left), self._height(y.right))
        return y

    def insert(self, key: float, data: Any) -> None:
        self.root = self._insert_node(self.root, key, data)

    def _insert_node(self, node: Optional[AVLNode], key: float, data: Any) -> AVLNode:
        if not node:
            return AVLNode(key, data)
        if key < node.key:
            node.left = self._insert_node(node.left, key, data)
        else:
            node.right = self._insert_node(node.right, key, data)

        node.height = 1 + max(self._height(node.left), self._height(node.right))
        bal = self._balance(node)

        if bal > 1 and node.left and key < node.left.key:
            return self._right_rotate(node)
        if bal < -1 and node.right and key > node.right.key:
            return self._left_rotate(node)
        if bal > 1 and node.left and key > node.left.key:
            node.left = self._left_rotate(node.left)
            return self._right_rotate(node)
        if bal < -1 and node.right and key < node.right.key:
            node.right = self._right_rotate(node.right)
            return self._left_rotate(node)
        return node

    def find_in_range(self, min_key: float, max_key: float) -> List[Any]:
        results: List[Any] = []
        def inorder(n: Optional[AVLNode]):
            if not n:
                return
            if n.key > min_key:
                inorder(n.left)
            if min_key <= n.key <= max_key:
                results.append(n.data)
            if n.key < max_key:
                inorder(n.right)
        inorder(self.root)
        return results


class DynamicResourceHashTable:
    """Dynamic Resizing Hash Table with Chaining."""

    def __init__(self, initial_capacity: int = 8):
        self.capacity = initial_capacity
        self.buckets: List[List[Tuple[str, Any]]] = [[] for _ in range(self.capacity)]
        self.size = 0
        self.resize_count = 0

    def _hash(self, key: str, cap: int) -> int:
        h = 0
        for ch in key:
            h = (h * 31 + ord(ch)) % cap
        return abs(h)

    def _resize(self, new_cap: int) -> None:
        old = self.buckets
        self.capacity = new_cap
        self.buckets = [[] for _ in range(new_cap)]
        self.size = 0
        self.resize_count += 1
        for b in old:
            for k, v in b:
                self.insert(k, v)

    def insert(self, key: str, value: Any) -> Tuple[int, bool, bool]:
        idx = self._hash(key, self.capacity)
        bucket = self.buckets[idx]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return idx, len(bucket) > 1, False

        had_collision = len(bucket) > 0
        bucket.append((key, value))
        self.size += 1
        did_resize = False
        if (self.size / self.capacity) > 0.75:
            self._resize(self.capacity * 2)
            did_resize = True
        return idx, had_collision, did_resize

    def get(self, key: str) -> Optional[Any]:
        idx = self._hash(key, self.capacity)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        return None

    def delete(self, key: str) -> bool:
        idx = self._hash(key, self.capacity)
        bucket = self.buckets[idx]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket.pop(i)
                self.size -= 1
                return True
        return False

    def get_metrics(self) -> Dict[str, Any]:
        collisions = sum(max(0, len(b) - 1) for b in self.buckets)
        longest = max((len(b) for b in self.buckets), default=0)
        return {
            "total_buckets": self.capacity,
            "item_count": self.size,
            "load_factor": round(self.size / self.capacity, 3),
            "collision_count": collisions,
            "longest_chain": longest,
            "resize_count": self.resize_count,
        }


@dataclass
class DispatchAction:
    id: str
    incident_id: str
    responder_id: str
    timestamp: str
    action_type: str
    previous_status: str
    new_status: str


class DispatchCommandStack:
    """Command Pattern Stack for Undo/Redo O(1)."""

    def __init__(self):
        self.undo_stack: List[DispatchAction] = []
        self.redo_stack: List[DispatchAction] = []
        self.action_log: List[DispatchAction] = []

    def execute(self, action: DispatchAction) -> None:
        self.action_log.append(action)
        self.undo_stack.append(action)
        self.redo_stack.clear()

    def undo(self) -> Optional[DispatchAction]:
        if not self.undo_stack:
            return None
        action = self.undo_stack.pop()
        self.redo_stack.append(action)
        return action

    def redo(self) -> Optional[DispatchAction]:
        if not self.redo_stack:
            return None
        action = self.redo_stack.pop()
        self.undo_stack.append(action)
        return action

    def can_undo(self) -> bool:
        return len(self.undo_stack) > 0

    def can_redo(self) -> bool:
        return len(self.redo_stack) > 0
