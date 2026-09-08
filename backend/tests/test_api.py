"""HTTP-level tests for the NUMIA API.

Uses FastAPI TestClient (httpx) — no real server needed.
"""

import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def valid_patient(pid=101):
    return {"id": pid, "name": "Test", "weight": 60, "barthel": 100,
            "braden": 23, "broncoFlags": [False, False, False, False, False]}


def valid_auxiliary(aid="aux1"):
    return {"id": aid, "name": "Equipo 1", "weight": 75}


class HealthTests(unittest.TestCase):
    def test_health_check(self):
        r = client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["status"], "ok")
        self.assertEqual(body["engine_version"], "parity-1")


class EvaluateEndpointTests(unittest.TestCase):

    def test_balance_returns_200_with_expected_keys(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [valid_patient()],
            "auxiliaries": [valid_auxiliary()],
            "action": "balance"
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("assignments", body)
        self.assertIn("metrics", body)
        self.assertIn("patient_scores", body)
        self.assertIn("auxiliary_profiles", body)
        self.assertIn("patient_units", body)
        self.assertIn("eligibility", body)
        self.assertIn("auxiliary_recommendations", body)
        self.assertEqual(body["engine_version"], "parity-1")

    def test_metrics_preserves_given_assignments(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [valid_patient()],
            "auxiliaries": [valid_auxiliary()],
            "assignments": {"101": "aux1"},
            "action": "metrics"
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["assignments"], {"101": "aux1"})
        self.assertEqual(body["metrics"]["balance"], 100)

    def test_empty_turn_balance(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [],
            "auxiliaries": [],
            "action": "balance"
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["assignments"], {})

    def test_422_on_negative_weight(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [{**valid_patient(), "weight": -10}],
            "auxiliaries": [valid_auxiliary()],
            "action": "balance"
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_unknown_action(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [],
            "auxiliaries": [],
            "action": "destroy"
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_dangling_assignment(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [valid_patient()],
            "auxiliaries": [valid_auxiliary()],
            "assignments": {"999": "aux1"},
            "action": "metrics"
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_invalid_patient_id(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [{**valid_patient(), "id": -5}],
            "auxiliaries": [valid_auxiliary()],
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_duplicate_patient_ids(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [valid_patient(101), valid_patient(101)],
            "auxiliaries": [valid_auxiliary()],
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_barthel_out_of_range(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [{**valid_patient(), "barthel": 150}],
            "auxiliaries": [valid_auxiliary()],
        })
        self.assertEqual(r.status_code, 422)

    def test_422_on_wrong_bronco_flags_length(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [{**valid_patient(), "broncoFlags": [True, False]}],
            "auxiliaries": [valid_auxiliary()],
        })
        self.assertEqual(r.status_code, 422)

    def test_float_patient_id_101_0_works(self):
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [{**valid_patient(), "id": 101.0}],
            "auxiliaries": [valid_auxiliary()],
            "action": "balance"
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("101", body["patient_scores"])

    def test_no_patient_data_in_422_response(self):
        patient = {**valid_patient(), "name": "SECRETO_PHI", "weight": -1}
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": [patient],
            "auxiliaries": [valid_auxiliary()],
        })
        self.assertEqual(r.status_code, 422)
        self.assertNotIn("SECRETO_PHI", r.text)

    def test_overload_case_18_over_17(self):
        """18 patients assigned to auxiliary with maxPatients=6 triggers overload."""
        patients = [valid_patient(i + 1) for i in range(18)]
        aux = valid_auxiliary()
        # Balance: at most 6 will be assigned. Force metrics with 18 assigned.
        assignments = {str(i + 1): "aux1" for i in range(18)}
        r = client.post("/api/v1/turn/evaluate", json={
            "patients": patients,
            "auxiliaries": [aux],
            "assignments": assignments,
            "action": "metrics"
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["metrics"]["overloaded"], 1)
        self.assertEqual(body["metrics"]["balance"], 100)
        self.assertEqual(body["auxiliary_recommendations"]["aux1"]["tone"], "danger")


class PreviewEndpointTests(unittest.TestCase):

    def test_preview_with_partial_patient(self):
        r = client.post("/api/v1/turn/preview", json={
            "patients": [{"weight": 70, "barthel": 50}],
            "auxiliaries": []
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("patient_scores", body)
        self.assertNotIn("assignments", body)

    def test_preview_with_partial_auxiliary(self):
        r = client.post("/api/v1/turn/preview", json={
            "patients": [],
            "auxiliaries": [{"weight": 65}]
        })
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertIn("auxiliary_profiles", body)

    def test_preview_rejects_invalid_present_value(self):
        r = client.post("/api/v1/turn/preview", json={
            "patients": [{"weight": -5}],
            "auxiliaries": []
        })
        self.assertEqual(r.status_code, 422)


if __name__ == "__main__":
    unittest.main()
