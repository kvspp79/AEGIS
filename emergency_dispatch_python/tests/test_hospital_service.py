import unittest
from models import Hospital, Coordinates
from hospital_service import calculate_nearest_hospital_with_beds, reserve_hospital_bed, release_hospital_bed


class TestHospitalService(unittest.TestCase):
    def setUp(self):
        self.coords = Coordinates(11.0180, 76.9740)
        self.hospitals = [
            Hospital("H1", "Full Hospital", "Near Location", Coordinates(11.0190, 76.9750), capacity_total=50, capacity_current=50, status="FULL"),
            Hospital("H2", "Far Open Hospital", "Far Location", Coordinates(11.0600, 77.0200), capacity_total=100, capacity_current=50, status="OPEN"),
            Hospital("H3", "Close Open Hospital", "Close Location", Coordinates(11.0250, 76.9800), capacity_total=80, capacity_current=70, status="OPEN"),
        ]

    def test_nearest_hospital_filters_full_facilities(self):
        nearest, ranking = calculate_nearest_hospital_with_beds(self.coords, self.hospitals)
        self.assertIsNotNone(nearest)
        # H1 is closest geographically but has 0 available beds, so H3 must be selected
        self.assertEqual(nearest["hospital_id"], "H3")
        self.assertEqual(nearest["available_beds"], 10)

    def test_bed_reservation_and_release(self):
        hosp = self.hospitals[2]  # capacity_total=80, capacity_current=70 -> 10 available
        self.assertEqual(hosp.available_beds, 10)

        # Reserve
        success = reserve_hospital_bed(hosp)
        self.assertTrue(success)
        self.assertEqual(hosp.capacity_current, 71)
        self.assertEqual(hosp.available_beds, 9)

        # Release
        rel = release_hospital_bed(hosp)
        self.assertTrue(rel)
        self.assertEqual(hosp.capacity_current, 70)
        self.assertEqual(hosp.available_beds, 10)


if __name__ == "__main__":
    unittest.main()
