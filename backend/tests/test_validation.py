import contextlib
import copy
import io
import unittest

from app.domain.engine import evaluate_turn
from app.domain.validation import TurnValidationError


def valid_turn():
    return {"patients": [{"id": 101, "name": "Simulado confidencial", "weight": 60,
                          "barthel": 100, "braden": 23, "broncoFlags": [False] * 5}],
            "auxiliaries": [{"id": "aux1", "weight": 75}], "action": "balance"}


class ValidationTests(unittest.TestCase):
    def assert_rejected(self, turn, code):
        before = copy.deepcopy(turn)
        with self.assertRaises(TurnValidationError) as error:
            evaluate_turn(**turn)
        self.assertEqual(error.exception.code, code)
        self.assertEqual(turn, before)
        self.assertNotIn("confidencial", str(error.exception))
        self.assertEqual(set(error.exception.as_dict()), {"code", "path"})

    def test_rejects_nonpositive_and_nonfinite_weights(self):
        for group in ("patients", "auxiliaries"):
            for weight in [0, -1, float("inf"), float("-inf"), float("nan"), "60", True, None, [], {}]:
                with self.subTest(group=group, value=repr(weight)):
                    turn = valid_turn()
                    turn[group][0]["weight"] = weight
                    self.assert_rejected(turn, "expected_positive_finite")

    def test_rejects_invalid_scale_ranges(self):
        for field, values in [("barthel", [-1, 101, 35.5, True, "35", None]),
                              ("braden", [5, 24, 12.5, False, "12", None])]:
            for value in values:
                with self.subTest(field=field, value=value):
                    turn = valid_turn()
                    turn["patients"][0][field] = value
                    self.assert_rejected(turn, "out_of_range_integer")

    def test_rejects_invalid_flags(self):
        for flags in [None, [], [False] * 4, [False] * 6, ["false"] * 5, [1] * 5, "00000"]:
            with self.subTest(flags=flags):
                turn = valid_turn()
                turn["patients"][0]["broncoFlags"] = flags
                self.assert_rejected(turn, "expected_five_booleans")

    def test_rejects_duplicate_and_invalid_ids(self):
        for group in ("patients", "auxiliaries"):
            turn = valid_turn()
            turn[group].append(copy.deepcopy(turn[group][0]))
            self.assert_rejected(turn, "duplicate_id")
        for identifier in [0, -1, 1.5, True, "101", None]:
            turn = valid_turn()
            turn["patients"][0]["id"] = identifier
            self.assert_rejected(turn, "expected_positive_integer")
        turn = valid_turn()
        turn["patients"].append({**turn["patients"][0], "id": 101.0})
        self.assert_rejected(turn, "duplicate_id")
        turn = valid_turn()
        turn["auxiliaries"][0]["id"] = "__proto__"
        self.assert_rejected(turn, "reserved_id")

    def test_rejects_dangling_assignments_in_both_actions(self):
        for action in ("metrics", "balance"):
            for assignments, code in [({"999": "aux1"}, "unknown_patient"),
                                       ({"101": "missing"}, "unknown_auxiliary"),
                                       ({"101": ""}, "unknown_auxiliary"),
                                       ({"101": None}, "unknown_auxiliary"),
                                       ({101: "aux1"}, "expected_string_key")]:
                with self.subTest(action=action, code=code):
                    self.assert_rejected({**valid_turn(), "action": action, "assignments": assignments}, code)

    def test_rejects_malformed_shapes_and_actions(self):
        for field, value, code in [("patients", None, "expected_list"), ("auxiliaries", {}, "expected_list"),
                                   ("assignments", [], "expected_object"), ("action", [], "invalid_action"),
                                   ("action", "other", "invalid_action")]:
            self.assert_rejected({**valid_turn(), field: value}, code)
        for group in ("patients", "auxiliaries"):
            self.assert_rejected({**valid_turn(), group: [None]}, "expected_object")

    def test_does_not_turn_clinical_capacity_into_a_validation_rule(self):
        turn = valid_turn()
        turn["patients"][0].update(weight=150, barthel=0, braden=6, broncoFlags=[True] * 5)
        result = evaluate_turn(**turn, assignments={"101": "aux1"})
        self.assertEqual(result["assignments"], {})
        turn["action"] = "metrics"
        result = evaluate_turn(**turn, assignments={"101": "aux1"})
        self.assertEqual(result["metrics"]["overloaded"], 1)

    def test_valid_metrics_does_not_rebalance_and_results_do_not_alias_inputs(self):
        turn = valid_turn()
        turn.update(action="metrics", assignments={"101": "aux1"})
        before = copy.deepcopy(turn)
        result = evaluate_turn(**turn)
        result["assignments"].clear()
        self.assertEqual(turn, before)
        self.assertEqual(evaluate_turn(**{**turn, "assignments": {}})["assignments"], {})

    def test_emits_no_patient_data_to_stdout_or_stderr(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            evaluate_turn(**valid_turn())
            turn = valid_turn()
            turn["patients"][0]["weight"] = -1
            with self.assertRaises(TurnValidationError):
                evaluate_turn(**turn)
        self.assertEqual(stdout.getvalue(), "")
        self.assertEqual(stderr.getvalue(), "")

    def test_preview_action_allows_missing_fields_but_validates_present_ones(self):
        turn = {
            "patients": [{"barthel": 50}], # missing id, weight, braden, broncoFlags
            "auxiliaries": [{}], # missing id, weight
            "action": "preview"
        }
        result = evaluate_turn(**turn)
        self.assertEqual(result["engine_version"], "parity-1")
        self.assertIn("patient_scores", result)
        self.assertIn("auxiliary_profiles", result)
        self.assertNotIn("assignments", result)
        
        # Present fields still get validated
        turn["patients"][0]["barthel"] = -10
        self.assert_rejected(turn, "out_of_range_integer")
        
        # Adding invalid id
        turn["patients"][0]["barthel"] = 50
        turn["patients"][0]["id"] = -5
        self.assert_rejected(turn, "expected_positive_integer")

    def test_transport_limit_on_weight(self):
        turn = valid_turn()
        turn["patients"][0]["weight"] = 1e301
        self.assert_rejected(turn, "transport_limit_exceeded")
        
        turn = valid_turn()
        turn["auxiliaries"][0]["weight"] = 1e301
        self.assert_rejected(turn, "transport_limit_exceeded")


if __name__ == "__main__":
    unittest.main()
