"""Caso de uso de dominio para la futura API, sin acoplamiento HTTP."""

from . import patient_id_key
from .balancing import auto_balance
from .eligibility import auxiliary_profile, care_units_for_patient, is_eligible
from .metrics import auxiliary_recommendation, get_metrics
from .scoring import patient_score
from .validation import validate_turn


def evaluate_turn(patients, auxiliaries, assignments=None, action="balance"):
    validate_turn(patients, auxiliaries, assignments, action)
    
    patient_scores = {patient_id_key(patient["id"]) if patient.get("id") is not None else "draft": patient_score(patient) for patient in patients}
    auxiliary_profiles = {auxiliary["id"] if auxiliary.get("id") is not None else "draft": auxiliary_profile(auxiliary["weight"]) for auxiliary in auxiliaries if auxiliary.get("weight") is not None}
    
    if action == "preview":
        return {
            "patient_scores": patient_scores,
            "auxiliary_profiles": auxiliary_profiles,
            "engine_version": "parity-1",
        }
        
    result_assignments = auto_balance(patients, auxiliaries) if action == "balance" else dict(assignments or {})
    metrics = get_metrics(patients, auxiliaries, result_assignments)
    
    patient_units = {patient_id_key(patient["id"]): care_units_for_patient(patient) for patient in patients}
    eligibility = {patient_id_key(patient["id"]): [auxiliary["id"] for auxiliary in auxiliaries if is_eligible(patient, auxiliary)] for patient in patients}
    auxiliary_recommendations = {auxiliary["id"]: auxiliary_recommendation(auxiliary, metrics["loads"][auxiliary["id"]]) for auxiliary in auxiliaries}
    
    return {
        "assignments": result_assignments,
        "metrics": metrics,
        "patient_scores": patient_scores,
        "auxiliary_profiles": auxiliary_profiles,
        "patient_units": patient_units,
        "eligibility": eligibility,
        "auxiliary_recommendations": auxiliary_recommendations,
        "engine_version": "parity-1",
    }
