"""Métricas derivadas con la misma semántica del HTML de referencia."""

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
    patients_by_id = {str(patient["id"]): patient for patient in patients}
    for patient_id, auxiliary_id in assignments.items():
        load = loads.get(auxiliary_id)
        patient = patients_by_id.get(str(patient_id))
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
    unassigned = sum(1 for patient in patients if str(patient["id"]) not in assignments)
    overloaded = sum(1 for load in loads.values() if load["status"] == "overload")
    full = sum(1 for load in loads.values() if load["status"] == "full")
    total_assigned = len(patients) - unassigned
    balance = round((total_assigned / len(patients)) * 100) if patients else 0
    return {"loads": loads, "unassigned": unassigned, "overloaded": overloaded, "full": full, "alerts": unassigned + overloaded, "totalAssigned": total_assigned, "balance": balance}
