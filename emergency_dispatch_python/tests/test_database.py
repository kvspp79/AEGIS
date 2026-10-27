import unittest
import os
import tempfile
from models import Incident, Responder, Hospital, Coordinates, SeverityLevel, DisasterType, ResponderType, ResponderStatus, IncidentStatus
from database import DatabaseManager


class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.temp_path = self.temp_file.name
        self.temp_file.close()
        self.db = DatabaseManager(db_path=self.temp_path)

    def tearDown(self):
        if os.path.exists(self.temp_path):
            os.remove(self.temp_path)

    def test_incident_persistence_across_reconnect(self):
        inc = Incident(
            id="INC-PERSIST-1",
            title="Structural Fire",
            type=DisasterType.WILDFIRE,
            severity=SeverityLevel.SEVERE,
            status=IncidentStatus.ACTIVE,
            location_name="Sector 7",
            coordinates=Coordinates(11.05, 76.99),
            casualties=1,
            base_priority=80,
            aging_minutes=5,
            calculated_priority=85,
        )
        self.db.save_incident(inc)

        # Simulate fresh app startup with new connection to same SQLite file
        db2 = DatabaseManager(db_path=self.temp_path)
        retrieved = db2.get_incident("INC-PERSIST-1")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.title, "Structural Fire")
        self.assertEqual(retrieved.calculated_priority, 85)

    def test_responder_status_update(self):
        resp = Responder(
            id="RES-DB-1",
            name="Rapid Unit 1",
            type=ResponderType.AMBULANCE,
            status=ResponderStatus.AVAILABLE,
            base_station="HQ",
            current_coordinates=Coordinates(11.0, 76.9),
        )
        self.db.save_responder(resp)

        self.db.update_responder_status("RES-DB-1", "DISPATCHED", "INC-123")
        resps = self.db.get_all_responders()
        r = next(x for x in resps if x.id == "RES-DB-1")
        self.assertEqual(r.status, "DISPATCHED")
        self.assertEqual(r.current_incident_id, "INC-123")


if __name__ == "__main__":
    unittest.main()
