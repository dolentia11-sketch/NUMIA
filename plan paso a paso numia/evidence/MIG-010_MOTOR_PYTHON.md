# MIG-010 — Motor Python puro

> Aclaración AUDIT-100: las cuatro pruebas iniciales no detectaban el redondeo de cobertura ni la clave `101.0`. Ambos errores se corrigieron después de reproducirlos contra el HTML. La evidencia vigente tiene 20 pruebas y 100 turnos; ver [auditoría](../14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md). Este manifiesto histórico no equivale a un cierre de migración/producción. No borrar carpetas completas para revertir: contienen trabajo posterior.

## Entrega

Se implementó el motor Python en `backend/app/domain/` sin modificar `index.html` ni `reference/index.html`.

| Módulo | Responsabilidad |
|---|---|
| `scoring.py` | Barthel, Braden, broncoaspiración, peso y riesgo. |
| `eligibility.py` | Perfil auxiliar, cap10/cap20, elegibilidad, unidades y capacidad. |
| `balancing.py` | Orden voraz, ranking y desempate. |
| `metrics.py` | Carga, estados, cobertura y alertas. |
| `engine.py` | Caso de uso sin HTTP para `balance` y `metrics`. |

## Evidencia

Comando ejecutado desde `backend/`:

```powershell
py -3 -m unittest discover -s tests -v
```

Resultado: 4 pruebas aprobadas: límites de puntaje, perfil auxiliar/cap20, turno golden exacto y sobrecarga 18/17.

También pasó `node qa/reference_golden.cjs`. La huella de `index.html` y `reference/index.html` continúa en `64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6`.

## Riesgo residual y rollback

La paridad está demostrada para los límites y fixtures definidos, no para todas las entradas posibles. La siguiente fase debe añadir pruebas HTTP sin modificar el dominio. Para rollback, eliminar solamente `backend/app/`, `backend/tests/` y `backend/README.md`; no tocar el snapshot ni el HTML original.
