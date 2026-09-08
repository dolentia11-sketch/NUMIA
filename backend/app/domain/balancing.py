"""Algoritmo voraz de referencia; conserva orden y desempate del navegador."""

from . import patient_id_key
from .eligibility import (
    _eligible_with_profile,
    auxiliary_profile,
    care_capacity_for_auxiliary,
    care_units_for_patient,
)
from .scoring import patient_score


def auto_balance(patients, auxiliaries):
    loads = {auxiliary["id"]: {"count": 0, "units": 0} for auxiliary in auxiliaries}
    # Local to this call: preserve auxiliary order, with no shared mutable cache.
    prepared_auxiliaries = []
    for auxiliary in auxiliaries:
        profile = auxiliary_profile(auxiliary["weight"])
        prepared_auxiliaries.append((auxiliary, profile, care_capacity_for_auxiliary(profile)))
    ordered = [
        (patient, index, patient_score(patient))
        for index, patient in enumerate(patients)
    ]
    ordered = [item for item in ordered if item[2]["total"] is not None and item[2]["riskValue"] > 0]
    ordered.sort(
        key=lambda item: (
            -item[2]["riskValue"],
            -sum(bool(flag) for flag in (item[0].get("broncoFlags") or [])),
            -item[0]["weight"],
            item[1],
        )
    )

    assignments = {}
    for patient, _, score in ordered:
        best_auxiliary = None
        best_rank = float("inf")
        patient_units = care_units_for_patient(patient)
        for auxiliary, profile, care_capacity in prepared_auxiliaries:
            if not _eligible_with_profile(patient, score, profile):
                continue
            load = loads[auxiliary["id"]]
            if load["count"] >= profile["maxPatients"]:
                continue
            projected_count_pct = (load["count"] + 1) / profile["maxPatients"]
            projected_care_pct = (load["units"] + patient_units) / care_capacity
            rank = max(projected_count_pct, projected_care_pct) + (projected_care_pct * 0.18) - (profile["typeValue"] * 0.002)
            if rank < best_rank:
                best_rank = rank
                best_auxiliary = auxiliary["id"]
        if best_auxiliary is not None:
            assignments[patient_id_key(patient["id"])] = best_auxiliary
            loads[best_auxiliary]["count"] += 1
            loads[best_auxiliary]["units"] += patient_units
    return assignments
