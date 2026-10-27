import unittest
from models import Incident, Responder, Coordinates, SeverityLevel, DisasterType, ResponderType, ResponderStatus, IncidentStatus
from allocation import compute_smart_dispatch, compute_bipartite_matching, compute_branch_and_bound_assignment


class TestAllocation(unittest.TestCase):
    def setUp(self):
        self.incident = Incident(
            id="INC-TEST",
            title="Industrial Ammonia Gas Leak",
            type=DisasterType.CHEMICAL_LEAK,
            severity=SeverityLevel.CRITICAL,
            status=IncidentStatus.ACTIVE,
            location_name="Plant 4",
            coordinates=Coordinates(11.0, 76.9),
            casualties=6,
            base_priority=90,
        )
        self.responders = [
            Responder(
                id="RES-AMB",
                name="Ambulance 1",
                type=ResponderType.AMBULANCE,
                status=ResponderStatus.AVAILABLE,
                base_station="Station A",
                current_coordinates=Coordinates(11.02, 76.91),
                speed_kmh=50,
            ),
            Responder(
                id="RES-HAZ",
                name="Hazmat Unit 1",
                type=ResponderType.HAZMAT,
                status=ResponderStatus.AVAILABLE,
                base_station="Station B",
                current_coordinates=Coordinates(11.01, 76.905),
                speed_kmh=45,
            ),
        ]

    def test_smart_dispatch_prioritizes_specialty(self):
        recs = compute_smart_dispatch(self.incident, self.responders)
        self.assertGreater(len(recs), 0)
        # For chemical leak, HAZMAT receives substantial specialty bonus
        self.assertEqual(recs[0]["responder_type"], "HAZMAT")

    def test_bipartite_matching(self):
        res = compute_bipartite_matching(self.responders, [self.incident])
        self.assertEqual(len(res["matches"]), 1)
        self.assertEqual(res["matches"][0]["incident"].id, "INC-TEST")

    def test_branch_and_bound(self):
        res = compute_branch_and_bound_assignment([self.incident], self.responders)
        self.assertGreater(len(res["best_assignments"]), 0)
        self.assertGreater(res["states_explored"], 0)


if __name__ == "__main__":
    unittest.main()
