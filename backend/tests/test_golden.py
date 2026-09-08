import json
import unittest
from pathlib import Path

from app.domain.engine import evaluate_turn
from app.domain.eligibility import auxiliary_profile, care_units_for_patient
from app.domain.scoring import score_barthel, score_braden, score_bronco, score_weight


FIXTURE = json.loads((Path(__file__).parent / "fixtures" / "golden_turn.json").read_text(encoding="utf-8"))


class GoldenParityTests(unittest.TestCase):
    def test_score_boundaries(self):
        self.assertEqual([score_barthel(value) for value in [100, 99, 61, 60, 40, 39, 20, 19]], [1, 2, 2, 3, 3, 4, 4, 5])
        self.assertEqual([score_braden(value) for value in [11, 12, 15, 16]], [3, 2, 2, 1])
        self.assertEqual([score_bronco([True] * value + [False] * (5 - value)) for value in [0, 1, 2, 3, 5]], [1, 2, 2, 3, 3])
        self.assertEqual([score_weight(value) for value in [60, 60.1, 65, 65.1, 70, 70.1, 75, 75.1, 80, 80.1]], [1, 2, 2, 3, 3, 4, 4, 5, 5, 6])

    def test_auxiliary_boundaries_keep_cap20_non_decisive(self):
        self.assertEqual([(auxiliary_profile(value)["type"], auxiliary_profile(value)["maxPatients"]) for value in [55, 55.1, 65, 65.1, 75, 75.1, 85, 85.1]], [("Tipo 1", 6), ("Tipo 2", 8), ("Tipo 2", 8), ("Tipo 3", 10), ("Tipo 3", 10), ("Tipo 4", 11), ("Tipo 4", 11), ("Tipo 5", 12)])
        self.assertEqual(auxiliary_profile(75)["cap10"], 82.5)
        self.assertEqual(auxiliary_profile(75)["cap20"], 90)

    def test_sample_turn_exactly_matches_reference(self):
        result = evaluate_turn(**FIXTURE["sample_turn"])
        self.assertEqual(result["assignments"], FIXTURE["expected"]["assignments"])
        patients_by_id = {str(patient["id"]): patient for patient in FIXTURE["sample_turn"]["patients"]}
        self.assertEqual(
            {
                patient_id: [score["total"], score["risk"], care_units_for_patient(patients_by_id[patient_id])]
                for patient_id, score in result["patient_scores"].items()
            },
            FIXTURE["expected"]["scores"],
        )
        for key, value in FIXTURE["expected"]["summary"].items():
            self.assertEqual(result["metrics"][key], value)

    def test_overload_remains_possible(self):
        result = evaluate_turn(**FIXTURE["overload_turn"])
        expected = FIXTURE["overload_expected"]
        self.assertEqual(result["assignments"], expected["assignments"])
        load = result["metrics"]["loads"]["aux3"]
        self.assertEqual(load["careUnits"], expected["care_units"])
        self.assertEqual(load["careCapacity"], expected["care_capacity"])
        self.assertEqual(result["metrics"]["overloaded"], expected["overloaded"])
        self.assertEqual(result["metrics"]["alerts"], expected["alerts"])

if __name__ == "__main__":
    unittest.main()
