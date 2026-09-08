"""Caso de uso de dominio para la futura API, sin acoplamiento HTTP."""

from .balancing import auto_balance
from .metrics import get_metrics
from .scoring import patient_score


def evaluate_turn(patients, auxiliaries, assignments=None, action="balance"):
    if action not in {"balance", "metrics"}:
        raise ValueError("action debe ser 'balance' o 'metrics'")
    result_assignments = auto_balance(patients, auxiliaries) if action == "balance" else dict(assignments or {})
    return {
        "assignments": result_assignments,
        "metrics": get_metrics(patients, auxiliaries, result_assignments),
        "patient_scores": {str(patient["id"]): patient_score(patient) for patient in patients},
        "engine_version": "parity-1",
    }
