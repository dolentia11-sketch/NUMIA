"""Reglas deterministas sin HTTP, DOM, almacenamiento ni efectos laterales."""


def patient_id_key(value: int | float | str) -> str:
    """Match JS object keys for ordinary integral numeric patient identifiers.

    JSON may decode 101 as int and 101.0 as float. Both are the same Number
    in the HTML. Preserve literal string keys; do not rewrite user identifiers.
    """
    if isinstance(value, float) and value.is_integer() and abs(value) < 1e21:
        return str(int(value))
    return str(value)
