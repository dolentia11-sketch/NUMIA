"""Perfil biomecánico y elegibilidad; no activa cap20."""

from .scoring import patient_score, score_weight


def auxiliary_profile(weight):
    cap10 = weight * 1.1
    cap20 = weight * 1.2
    if weight <= 55:
        return {"cap10": cap10, "cap20": cap20, "type": "Tipo 1", "typeValue": 1, "maxPatients": 6}
    if weight <= 65:
        return {"cap10": cap10, "cap20": cap20, "type": "Tipo 2", "typeValue": 2, "maxPatients": 8}
    if weight <= 75:
        return {"cap10": cap10, "cap20": cap20, "type": "Tipo 3", "typeValue": 3, "maxPatients": 10}
    if weight <= 85:
        return {"cap10": cap10, "cap20": cap20, "type": "Tipo 4", "typeValue": 4, "maxPatients": 11}
    return {"cap10": cap10, "cap20": cap20, "type": "Tipo 5", "typeValue": 5, "maxPatients": 12}


def is_eligible(patient, auxiliary):
    score = patient_score(patient)
    if score["total"] is None or score["riskValue"] == 0:
        return False
    profile = auxiliary_profile(auxiliary["weight"])
    return patient["weight"] <= profile["cap10"] and profile["typeValue"] >= score["riskValue"]


def care_units_for_patient(patient):
    score = patient_score(patient)
    if score["total"] is None or score["riskValue"] == 0:
        return 0
    bronco_count = sum(bool(flag) for flag in (patient.get("broncoFlags") or []))
    weight_part = score_weight(patient.get("weight"))
    bronco_bonus = 1 if bronco_count >= 3 else 0
    weight_bonus = 0.5 if weight_part >= 5 else 0
    return score["riskValue"] + bronco_bonus + weight_bonus


def care_capacity_for_auxiliary(profile):
    return profile["maxPatients"] * 1.7
