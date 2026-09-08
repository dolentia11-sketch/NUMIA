"""Input boundary approved by the owner; never repairs or recalculates data.

Only evaluate_turn uses this boundary. Pure scoring functions retain their
reference semantics, including INCOMPLETO, for characterization and previews.
"""

from math import isfinite

from . import patient_id_key


class TurnValidationError(ValueError):
    """Structured error with field location, never patient values or names."""

    def __init__(self, code: str, path: str):
        self.code = code
        self.path = path
        super().__init__(f"{code}: {path}")

    def as_dict(self) -> dict[str, str]:
        return {"code": self.code, "path": self.path}


def _require(condition: bool, code: str, path: str) -> None:
    if not condition:
        raise TurnValidationError(code, path)


def _finite_number(value: object) -> bool:
    if type(value) not in (int, float):
        return False
    try:
        return isfinite(value)
    except OverflowError:
        return False


def validate_turn(patients, auxiliaries, assignments, action) -> None:
    """Check shape, finite numbers, existing form ranges and referential integrity.

    Cupos, eligibility and care capacity are deliberately not validation rules:
    they remain exclusively defined by the unchanged clinical calculations.
    """
    _require(type(action) is str and action in ("balance", "metrics", "preview"), "invalid_action", "action")
    _require(type(patients) is list, "expected_list", "patients")
    _require(type(auxiliaries) is list, "expected_list", "auxiliaries")
    if action != "preview":
        _require(assignments is None or type(assignments) is dict, "expected_object", "assignments")
    patient_ids = set()
    for index, record in enumerate(patients):
        location = f"patients[{index}]"
        _require(type(record) is dict, "expected_object", location)
        identifier = record.get("id")
        if identifier is not None or action != "preview":
            _require(_finite_number(identifier) and identifier > 0 and identifier % 1 == 0,
                     "expected_positive_integer", f"{location}.id")
            key = patient_id_key(identifier)
            _require(key not in patient_ids, "duplicate_id", f"{location}.id")
            patient_ids.add(key)
        weight = record.get("weight")
        if weight is not None or action != "preview":
            _require(_finite_number(weight) and weight > 0, "expected_positive_finite", f"{location}.weight")
            _require(weight <= 1e300, "transport_limit_exceeded", f"{location}.weight")
        for field, minimum, maximum in (("barthel", 0, 100), ("braden", 6, 23)):
            value = record.get(field)
            if value is not None or action != "preview":
                _require(_finite_number(value) and value % 1 == 0 and minimum <= value <= maximum,
                         "out_of_range_integer", f"{location}.{field}")
        flags = record.get("broncoFlags")
        if flags is not None or action != "preview":
            _require(type(flags) is list and len(flags) == 5 and all(type(flag) is bool for flag in flags),
                     "expected_five_booleans", f"{location}.broncoFlags")
    auxiliary_ids = set()
    for index, record in enumerate(auxiliaries):
        location = f"auxiliaries[{index}]"
        _require(type(record) is dict, "expected_object", location)
        identifier = record.get("id")
        if identifier is not None or action != "preview":
            _require(type(identifier) is str and bool(identifier.strip()), "expected_nonempty_string", f"{location}.id")
            _require(identifier != "__proto__", "reserved_id", f"{location}.id")
            _require(identifier not in auxiliary_ids, "duplicate_id", f"{location}.id")
            auxiliary_ids.add(identifier)
        weight = record.get("weight")
        if weight is not None or action != "preview":
            _require(_finite_number(weight) and weight > 0, "expected_positive_finite", f"{location}.weight")
            _require(weight <= 1e300, "transport_limit_exceeded", f"{location}.weight")
    if action != "preview":
        for index, (patient_id, auxiliary_id) in enumerate((assignments or {}).items()):
            location = f"assignments[{index}]"
            _require(type(patient_id) is str, "expected_string_key", location)
            _require(patient_id in patient_ids, "unknown_patient", location)
            _require(type(auxiliary_id) is str and auxiliary_id in auxiliary_ids,
                     "unknown_auxiliary", location)
