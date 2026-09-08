# MIG-000 — Baseline de paridad

> Aclaración AUDIT-100: el cierre inicial sólo probaba hashes y dos fixtures; faltaban las capturas y el PDF que exige el capítulo 13. La auditoría posterior añadió esa evidencia para el HTML original. Ver [auditoría vigente](../14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md). No aplicar el rollback histórico de abajo como borrado de carpetas: ahora contienen trabajo posterior que debe preservarse.

## Alcance

Se congeló el HTML declarado por el propietario como referencia de comportamiento. No se modificó `index.html`, ni fórmulas, ni interfaz, ni flujo del PDF.

## Referencia

| Elemento | Valor |
|---|---|
| Fuente | `C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\index.html` |
| Snapshot | `reference/index.html` |
| SHA-256 | `64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6` |
| Fixture | `backend/tests/fixtures/golden_turn.json` |
| Harness | `qa/reference_golden.cjs` |

## Cobertura de paridad

- Turno de muestra: ocho pacientes, cinco auxiliares, asignaciones exactas, puntajes y métricas globales.
- Límites de sobrecarga: cuatro pacientes severos de 80 kg y auxiliar de 75 kg; 18 unidades frente a capacidad 17, una sobrecarga y una alerta.
- El fixture usa alias sintéticos: los nombres no participan en el motor.

## Gate y rollback

El gate de MIG-000 se cumple cuando `node qa/reference_golden.cjs` termina en `PASS` y la huella coincide. Para revertir este lote, eliminar sólo `reference/`, `backend/tests/`, `qa/` y este manifiesto; el HTML original no debe tocarse.
