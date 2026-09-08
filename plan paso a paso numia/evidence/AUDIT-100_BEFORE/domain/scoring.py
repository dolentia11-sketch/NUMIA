"""Clasificación clínica portada literalmente del HTML de referencia."""


def score_barthel(value):
    if value is None or value == "":
        return None
    if value == 100:
        return 1
    if value >= 61:
        return 2
    if value >= 40:
        return 3
    if value >= 20:
        return 4
    return 5


def score_braden(value):
    if value is None or value == "":
        return None
    if value < 12:
        return 3
    if value <= 15:
        return 2
    return 1


def score_bronco(flags):
    count = sum(bool(flag) for flag in (flags or []))
    if count == 0:
        return 1
    if count <= 2:
        return 2
    return 3


def score_weight(value):
    if value is None or value == "":
        return None
    if value <= 60:
        return 1
    if value <= 65:
        return 2
    if value <= 70:
        return 3
    if value <= 75:
        return 4
    if value <= 80:
        return 5
    return 6


def patient_score(patient):
    barthel = score_barthel(patient.get("barthel"))
    braden = score_braden(patient.get("braden"))
    bronco = score_bronco(patient.get("broncoFlags"))
    weight = score_weight(patient.get("weight"))
    parts = {"barthel": barthel, "braden": braden, "bronco": bronco, "weight": weight}
    if barthel is None or braden is None or weight is None:
        return {"total": None, "risk": "INCOMPLETO", "riskValue": 0, "parts": parts}

    total = barthel + braden + bronco + weight
    if total >= 12:
        return {"total": total, "risk": "SEVERO", "riskValue": 3, "parts": parts}
    if total >= 9:
        return {"total": total, "risk": "MODERADO", "riskValue": 2, "parts": parts}
    if total >= 4:
        return {"total": total, "risk": "LEVE", "riskValue": 1, "parts": parts}
    return {"total": total, "risk": "FUERA DE RANGO", "riskValue": 0, "parts": parts}
