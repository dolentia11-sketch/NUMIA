"""Exercise serialization and HTTP using the independent monolithic oracle."""
import unittest
from fastapi.testclient import TestClient
from app.main import app
from tests.test_differential import randomized_turns, html_results, patient


class HTTPParityTests(unittest.TestCase):
    def test_100_http_turns_match_monolith(self):
        turns = randomized_turns()
        expected = html_results(turns)
        with TestClient(app) as client:
            for turn, reference in zip(turns, expected, strict=True):
                response = client.post('/api/v1/turn/evaluate', json=turn)
                self.assertEqual(response.status_code, 200)
                actual = response.json()
                for key in ('assignments', 'metrics', 'patient_scores'):
                    self.assertEqual(actual[key], reference[key])
                self.assertEqual(list(actual['patient_units'].values()), reference['units'])
                self.assertEqual(list(actual['auxiliary_profiles'].values()), reference['profiles'])
                expected_eligibility = {
                    str(p['id']): [a['id'] for a, eligible in zip(turn['auxiliaries'], row) if eligible]
                    for p, row in zip(turn['patients'], reference['eligibility'])
                }
                self.assertEqual(actual['eligibility'], expected_eligibility)

    def test_preview_all_threshold_combinations_match_monolith(self):
        people = []
        for barthel in (0, 19, 20, 39, 40, 60, 61, 99, 100):
            for braden in (6, 11, 12, 15, 16, 23):
                for weight in (1, 60, 60.1, 65, 65.1, 70, 70.1, 75, 75.1, 80, 80.1):
                    for count in range(6):
                        people.append(patient(len(people)+1, weight, barthel, braden,
                                              [i < count for i in range(5)]))
        turn = {'patients': people, 'auxiliaries': [], 'action': 'metrics'}
        expected = html_results([turn])[0]
        with TestClient(app) as client:
            response = client.post('/api/v1/turn/preview', json={'patients': people})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['patient_scores'], expected['patient_scores'])
