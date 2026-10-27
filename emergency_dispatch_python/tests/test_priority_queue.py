import unittest
from models import Incident, Coordinates, SeverityLevel, DisasterType, IncidentStatus
from priority_queue import EmergencyPriorityQueue


class TestEmergencyPriorityQueue(unittest.TestCase):
    def setUp(self):
        self.pq = EmergencyPriorityQueue(aging_rate_per_minute=0.5)

    def test_insert_and_peek(self):
        inc1 = Incident(
            id="I-1",
            title="Moderate Flood",
            type=DisasterType.FLOOD,
            severity=SeverityLevel.MODERATE,
            status=IncidentStatus.ACTIVE,
            location_name="Zone A",
            coordinates=Coordinates(lat=11.0, lng=76.9),
            casualties=0,
            base_priority=50,
        )
        inc2 = Incident(
            id="I-2",
            title="Critical Collapse",
            type=DisasterType.BUILDING_COLLAPSE,
            severity=SeverityLevel.CRITICAL,
            status=IncidentStatus.ACTIVE,
            location_name="Zone B",
            coordinates=Coordinates(lat=11.0, lng=76.9),
            casualties=5,
            base_priority=90,
        )

        self.pq.insert(inc1)
        self.pq.insert(inc2)

        top = self.pq.peek()
        self.assertIsNotNone(top)
        self.assertEqual(top.id, "I-2")
        self.assertGreater(top.calculated_priority, 80)

    def test_extract_max_order(self):
        inc1 = Incident("I-1", "Low Priority", DisasterType.FIRE, SeverityLevel.LOW, IncidentStatus.ACTIVE, "Loc", Coordinates(0, 0), base_priority=20)
        inc2 = Incident("I-2", "Medium Priority", DisasterType.FIRE, SeverityLevel.MODERATE, IncidentStatus.ACTIVE, "Loc", Coordinates(0, 0), base_priority=50)
        inc3 = Incident("I-3", "Critical Priority", DisasterType.FIRE, SeverityLevel.CRITICAL, IncidentStatus.ACTIVE, "Loc", Coordinates(0, 0), casualties=3, base_priority=95)

        self.pq.insert(inc1)
        self.pq.insert(inc2)
        self.pq.insert(inc3)

        self.assertEqual(self.pq.extract_max().id, "I-3")
        self.assertEqual(self.pq.extract_max().id, "I-2")
        self.assertEqual(self.pq.extract_max().id, "I-1")
        self.assertIsNone(self.pq.extract_max())

    def test_aging_prevents_starvation(self):
        inc_low = Incident("I-LOW", "Low Emergency", DisasterType.FLOOD, SeverityLevel.LOW, IncidentStatus.ACTIVE, "Loc", Coordinates(0, 0), base_priority=30, aging_minutes=0)
        self.pq.insert(inc_low)

        initial_pri = self.pq.peek().calculated_priority
        self.pq.reapply_aging(additional_minutes=40)
        boosted_pri = self.pq.peek().calculated_priority

        # 40 mins * 0.5 = +20 priority points
        self.assertGreater(boosted_pri, initial_pri)


if __name__ == "__main__":
    unittest.main()
