"""Métricas derivadas con la misma semántica del HTML de referencia."""

from math import floor

from . import patient_id_key
from .eligibility import auxiliary_profile, care_capacity_for_auxiliary, care_units_for_patient
from .scoring import patient_score


def get_metrics(patients, auxiliaries, assignments):
    loads = {}
    for auxiliary in auxiliaries:
        profile = auxiliary_profile(auxiliary["weight"])
        loads[auxiliary["id"]] = {
            "count": 0, "capacity": profile["maxPatients"], "careUnits": 0,
            "careCapacity": care_capacity_for_auxiliary(profile), "severe": 0,
            "moderate": 0, "mild": 0, "broncoHigh": 0, "heaviest": 0, "status": "libre",
        }
    patients_by_id = {patient_id_key(patient["id"]): patient for patient in patients}
    for patient_id, auxiliary_id in assignments.items():
        load = loads.get(auxiliary_id)
        patient = patients_by_id.get(patient_id_key(patient_id))
        if load is None or patient is None:
            continue
        score = patient_score(patient)
        load["count"] += 1
        load["careUnits"] += care_units_for_patient(patient)
        load["heaviest"] = max(load["heaviest"], patient.get("weight") or 0)
        if score["risk"] == "SEVERO":
            load["severe"] += 1
        elif score["risk"] == "MODERADO":
            load["moderate"] += 1
        elif score["risk"] == "LEVE":
            load["mild"] += 1
        if sum(bool(flag) for flag in (patient.get("broncoFlags") or [])) >= 3:
            load["broncoHigh"] += 1
    for auxiliary in auxiliaries:
        load = loads[auxiliary["id"]]
        count_pct = load["count"] / load["capacity"] if load["capacity"] > 0 else 0
        care_pct = load["careUnits"] / load["careCapacity"] if load["careCapacity"] > 0 else 0
        profile = auxiliary_profile(auxiliary["weight"])
        load["countPct"] = count_pct
        load["carePct"] = care_pct
        if load["count"] > load["capacity"] or load["careUnits"] > load["careCapacity"] or load["heaviest"] > profile["cap10"]:
            load["status"] = "overload"
        elif load["count"] == load["capacity"] or count_pct >= 0.9 or care_pct >= 0.9:
            load["status"] = "full"
        elif load["count"] == 0:
            load["status"] = "libre"
        else:
            load["status"] = "ok"
    unassigned = sum(1 for patient in patients if patient_id_key(patient["id"]) not in assignments)
    overloaded = sum(1 for load in loads.values() if load["status"] == "overload")
    full = sum(1 for load in loads.values() if load["status"] == "full")
    total_assigned = len(patients) - unassigned
    coverage = (total_assigned / len(patients)) * 100 if patients else 0
    # Math.round chooses the larger integer at .5; Python round uses ties-to-even.
    # Compare the fraction directly to avoid rounding a value below .5 upwards.
    whole = floor(coverage)
    balance = whole + int(coverage - whole >= 0.5)
    return {"loads": loads, "unassigned": unassigned, "overloaded": overloaded, "full": full, "alerts": unassigned + overloaded, "totalAssigned": total_assigned, "balance": balance}


def auxiliary_recommendation(auxiliary, load):
    from .eligibility import auxiliary_profile
    profile = auxiliary_profile(auxiliary["weight"])
    if load["status"] == "overload":
        cause = "hay al menos un paciente por encima de la capacidad segura" if load["heaviest"] > profile["cap10"] else "la carga clínica o el cupo superan el límite recomendado"
        return {
            "tone": "danger",
            "title": "Sobrecarga: redistribuir ahora",
            "text": f"No asignar nuevos pacientes. Rebalancear el turno porque {cause}.",
        }
    if load["status"] == "full":
        return {
            "tone": "watch",
            "title": "Al límite operativo",
            "text": "Evitar nuevos pacientes, especialmente severos o con alto puntaje EED. Considerar apoyo o relevo.",
        }
    if load["count"] == 0:
        return {
            "tone": "good",
            "title": "Disponible",
            "text": "Puede recibir pacientes compatibles según peso, tipo biomecánico y demanda clínica.",
        }
    if load.get("countPct", 0) >= 0.7 or load.get("carePct", 0) >= 0.7 or load.get("severe", 0) > 0:
        return {
            "tone": "watch",
            "title": "Vigilancia de carga",
            "text": "Carga aceptable, pero conviene priorizar pacientes leves si se necesita una nueva asignación.",
        }
    return {
        "tone": "good",
        "title": "Carga adecuada",
        "text": "La distribución actual está dentro de la capacidad segura estimada.",
    }
