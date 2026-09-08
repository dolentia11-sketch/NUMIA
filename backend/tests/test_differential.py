"""Executable differential audit: the unchanged HTML is the independent oracle.

Run from backend: py -3 -B -m unittest discover -s tests -v
Node must be available; missing Node fails rather than silently skipping parity.
"""

import copy
import hashlib
import json
import random
import shutil
import subprocess
import time
import unittest
from pathlib import Path

from app.domain.engine import evaluate_turn
from app.domain.balancing import auto_balance
from app.domain.metrics import get_metrics
from app.domain.scoring import patient_score
from app.domain.eligibility import auxiliary_profile, care_units_for_patient, is_eligible

ROOT = Path(__file__).resolve().parents[2]
SEED = 20260908


def patient(identifier, weight=60, barthel=100, braden=23, flags=None):
    return {"id": identifier, "name": f"Simulado {identifier}", "weight": weight,
            "barthel": barthel, "braden": braden,
            "broncoFlags": [False] * 5 if flags is None else flags}


def randomized_turns():
    rng = random.Random(SEED)
    turns = []
    for case in range(100):
        count = rng.randint(0, 150)
        team_size = rng.randint(0, 25)
        if case == 0:
            count, team_size = 0, 0
        elif case == 1:
            count, team_size = 80, 0
        elif case == 2:
            count, team_size = 0, 20
        elif case == 99:
            count, team_size = 1000, 100
        team = [{"id": f"aux{i + 1}", "name": f"Equipo {i + 1}",
                 "weight": rng.choice([55, 55.1, 65, 65.1, 75, 75.1, 85, 85.1,
                                       round(rng.uniform(40, 120), 2)])}
                for i in range(team_size)]
        people = [patient(i + 101,
                          rng.choice([60, 60.1, 65, 65.1, 70, 70.1, 75, 75.1, 80,
                                      80.1, round(rng.uniform(1, 200), 2)]),
                          rng.randint(0, 100), rng.randint(6, 23),
                          [bool(rng.getrandbits(1)) for _ in range(5)])
                  for i in range(count)]
        rng.shuffle(people)
        rng.shuffle(team)
        turns.append({"patients": people, "auxiliaries": team, "action": "balance"})
    return turns


def html_results(turns):
    node = shutil.which("node")
    if node is None:
        raise RuntimeError("Node es obligatorio para ejecutar el oráculo HTML.")
    completed = subprocess.run(
        [node, str(ROOT / "qa" / "html_oracle.cjs")],
        input=json.dumps(turns, ensure_ascii=True, allow_nan=False),
        text=True, encoding="utf-8", capture_output=True, check=True, timeout=60,
    )
    return json.loads(completed.stdout)


def python_result(turn):
    result = evaluate_turn(**turn)
    result.pop("patient_units", None)
    result.pop("auxiliary_profiles", None)
    result.pop("eligibility", None)
    result.pop("auxiliary_recommendations", None)
    result["units"] = [care_units_for_patient(p) for p in turn["patients"]]
    result["profiles"] = [auxiliary_profile(a["weight"]) for a in turn["auxiliaries"]]
    result["eligibility"] = [[is_eligible(p, a) for a in turn["auxiliaries"]]
                            for p in turn["patients"]]
    return result


class DifferentialTests(unittest.TestCase):
    def assert_turns_match(self, turns):
        expected = html_results(turns)
        for index, (turn, reference) in enumerate(zip(turns, expected, strict=True)):
            with self.subTest(case=index):
                before = copy.deepcopy(turn)
                result = python_result(turn)
                # Exact numeric comparison: no tolerances masking changed decisions.
                self.assertEqual(result, reference)
                self.assertEqual(turn, before, "El dominio mutó la entrada")
                self.assertEqual(result, python_result(turn), "Resultado no determinista")

    def test_100_randomized_turns(self):
        turns = randomized_turns()
        start = time.perf_counter()
        self.assert_turns_match(turns)
        print(f"100 random turns: seed={SEED}; patients={sum(len(t['patients']) for t in turns)}; "
              f"auxiliaries={sum(len(t['auxiliaries']) for t in turns)}; "
              f"elapsed={time.perf_counter() - start:.3f}s")

    def test_100_metrics_snapshots(self):
        turns = randomized_turns()
        # Use assignments from HTML, not Python, to test independent metrics input.
        references = html_results(turns)
        snapshots = [{**turn, "action": "metrics", "assignments": expected["assignments"]}
                     for turn, expected in zip(turns, references, strict=True)]
        self.assert_turns_match(snapshots)

    def test_coverage_rounding_half_ties(self):
        turns = []
        for assigned in [1, 3, 5, 7]:
            people = [patient(i + 1) for i in range(8)]
            turns.append({"patients": people, "auxiliaries": [{"id": "aux1", "weight": 94}],
                          "action": "metrics",
                          "assignments": {str(i + 1): "aux1" for i in range(assigned)}})
        self.assert_turns_match(turns)

    def test_integer_valued_float_patient_ids(self):
        self.assert_turns_match([
            {"patients": [patient(101.0)], "auxiliaries": [{"id": "aux1", "weight": 75}]},
            {"patients": [patient(101.0)], "auxiliaries": [{"id": "aux1", "weight": 75}],
             "action": "metrics", "assignments": {"101": "aux1"}},
        ])

    def test_incomplete_patients_are_not_assigned(self):
        people = [patient(1), patient(2), patient(3), patient(4)]
        people[0]["barthel"] = None
        people[1]["braden"] = ""
        people[2].pop("weight")
        people[3].pop("broncoFlags")
        team = [{"id": "aux1", "weight": 75}]
        reference = html_results([{"patients": people, "auxiliaries": team}])[0]
        # Characterize low-level legacy functions. The public facade rejects
        # incomplete saved records under the separately approved input policy.
        assignments = auto_balance(people, team)
        self.assertEqual(assignments, reference["assignments"])
        self.assertEqual(get_metrics(people, team, assignments), reference["metrics"])
        self.assertEqual({str(p["id"]): patient_score(p) for p in people}, reference["patient_scores"])

    def test_tie_order_and_hard_patient_capacity(self):
        team = [{"id": "first", "weight": 55}, {"id": "second", "weight": 55}]
        people = [patient(i + 1) for i in range(15)]
        self.assert_turns_match([
            {"patients": people, "auxiliaries": team},
            {"patients": list(reversed(people)), "auxiliaries": list(reversed(team))},
        ])

    def test_reference_and_original_are_unchanged(self):
        expected = "64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6"
        for relative in ["index.html", "reference/index.html"]:
            self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest().upper(), expected)


if __name__ == "__main__":
    unittest.main()
