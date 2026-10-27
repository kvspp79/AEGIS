import unittest
from models import Coordinates, RoutingNode, RoutingEdge
from algorithms import (
    haversine_distance, EmergencyGraph, DisjointSetUnion,
    solve_01_knapsack, KnapsackItem,
    compute_greedy_interval_scheduling, RescueSlot,
    DisasterTrie, AVLTree, DynamicResourceHashTable,
    DispatchCommandStack, DispatchAction
)


class TestAlgorithms(unittest.TestCase):
    def test_haversine_distance(self):
        c1 = Coordinates(11.0016, 76.9668)  # CMCH
        c2 = Coordinates(11.0180, 76.9740)  # Avinashi
        dist = haversine_distance(c1, c2, is_driving_road=True)
        self.assertGreater(dist, 1.0)
        self.assertLess(dist, 6.0)

    def test_graph_routing_algorithms(self):
        nodes = [
            RoutingNode("A", "Node A", Coordinates(11.0, 76.9)),
            RoutingNode("B", "Node B", Coordinates(11.01, 76.91)),
            RoutingNode("C", "Node C", Coordinates(11.02, 76.92)),
        ]
        edges = [
            RoutingEdge("A", "B", distance_km=2.0),
            RoutingEdge("B", "C", distance_km=3.0),
            RoutingEdge("A", "C", distance_km=10.0),
        ]
        graph = EmergencyGraph(nodes, edges)

        d_res = graph.dijkstra("A", "C")
        self.assertEqual(d_res.path, ["A", "B", "C"])
        self.assertAlmostEqual(d_res.total_distance_km, 5.0, places=1)

        a_res = graph.a_star("A", "C")
        self.assertEqual(a_res.path, ["A", "B", "C"])

        b_res = graph.bellman_ford("A", "C")
        self.assertEqual(b_res.path, ["A", "B", "C"])

    def test_disjoint_set_union(self):
        nodes = ["N1", "N2", "N3", "ISOLATED"]
        dsu = DisjointSetUnion(nodes)
        self.assertTrue(dsu.union("N1", "N2"))
        self.assertFalse(dsu.union("N1", "N2"))  # Already in same set
        self.assertTrue(dsu.union("N2", "N3"))

        comp = dsu.get_connected_components(nodes, hospital_bases=["N1"])
        self.assertIn("ISOLATED", comp["isolated_areas"])
        self.assertNotIn("N3", comp["isolated_areas"])

    def test_01_knapsack(self):
        items = [
            KnapsackItem("1", "Item A", weight=10, value=60, category="MED"),
            KnapsackItem("2", "Item B", weight=20, value=100, category="MED"),
            KnapsackItem("3", "Item C", weight=30, value=120, category="RELIEF"),
        ]
        res = solve_01_knapsack(items, capacity_kg=50)
        self.assertEqual(res["total_value"], 220)  # Items 2 and 3 = 220 value, 50 weight
        self.assertLessEqual(res["total_weight"], 50)

    def test_greedy_interval_scheduling(self):
        missions = [
            RescueSlot("M1", "Airlift 1", start_hour=9.0, end_hour=10.5, priority=1),
            RescueSlot("M2", "Airlift 2", start_hour=10.0, end_hour=11.0, priority=2),  # overlaps M1
            RescueSlot("M3", "Airlift 3", start_hour=11.0, end_hour=12.0, priority=3),
        ]
        res = compute_greedy_interval_scheduling(missions)
        self.assertEqual(len(res["scheduled_missions"]), 2)
        self.assertEqual(len(res["rejected_missions"]), 1)
        self.assertEqual(res["rejected_missions"][0]["id"], "M2")

    def test_disaster_trie(self):
        trie = DisasterTrie()
        trie.insert("Ambulance Alpha", "RES-1", "RESPONDER")
        trie.insert("Ambulance Beta", "RES-2", "RESPONDER")
        trie.insert("Fire Engine", "RES-3", "RESPONDER")

        matches = trie.search_prefix("amb")
        self.assertEqual(len(matches), 2)
        titles = [m["title"] for m in matches]
        self.assertIn("Ambulance Alpha", titles)
        self.assertIn("Ambulance Beta", titles)

    def test_avl_tree_range(self):
        avl = AVLTree()
        avl.insert(40, "Slow Responder")
        avl.insert(55, "Medium Responder")
        avl.insert(80, "High Speed Responder")
        avl.insert(95, "Air Ambulance")

        in_range = avl.find_in_range(50, 85)
        self.assertIn("Medium Responder", in_range)
        self.assertIn("High Speed Responder", in_range)
        self.assertNotIn("Slow Responder", in_range)
        self.assertNotIn("Air Ambulance", in_range)

    def test_dynamic_hash_table_resizing(self):
        ht = DynamicResourceHashTable(initial_capacity=4)
        for i in range(10):
            ht.insert(f"key-{i}", f"val-{i}")

        metrics = ht.get_metrics()
        self.assertGreater(metrics["total_buckets"], 4)  # Capacity doubled
        self.assertEqual(ht.get("key-5"), "val-5")
        self.assertTrue(ht.delete("key-5"))
        self.assertIsNone(ht.get("key-5"))

    def test_command_stack_undo_redo(self):
        stack = DispatchCommandStack()
        act = DispatchAction("D-1", "INC-1", "RES-1", "2026-10-27T10:00:00", "DISPATCH", "AVAILABLE", "DISPATCHED")

        stack.execute(act)
        self.assertTrue(stack.can_undo())
        self.assertFalse(stack.can_redo())

        undone = stack.undo()
        self.assertEqual(undone.id, "D-1")
        self.assertFalse(stack.can_undo())
        self.assertTrue(stack.can_redo())

        redone = stack.redo()
        self.assertEqual(redone.id, "D-1")


if __name__ == "__main__":
    unittest.main()
