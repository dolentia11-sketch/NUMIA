# Motor Python NUMIA — MIG-010

Este directorio contiene el motor determinista de paridad, su frontera de validación y la API HTTP FastAPI consumida por `public/assets/app.js`. No hay persistencia ni estado compartido entre turnos.

## Ejecutar pruebas

Desde la raíz del proyecto:

```powershell
py -3 -B -m unittest discover -s backend/tests -t backend -v
```

Requiere Python >=3.11, las dependencias de `requirements.txt`, `httpx` y Node en PATH para comparar con el HTML real. Si Node falta o cambia la huella de referencia, la prueba falla; no se omite silenciosamente.

Desde la raíz del proyecto, generar el informe reproducible:

```powershell
py -3 -B qa/audit_engine.py
```

Resultados en `plan paso a paso numia/evidence/AUDIT-100_RESULT.json` y `AUDIT-100_TESTS.txt`.
La semilla `20260908` genera 100 turnos, 8.245 pacientes y 1.395 auxiliares. Se comparan también 100 estados de métricas independientes, límites, desempates e integridad del HTML. El caso más grande contiene 1.000 pacientes y 100 auxiliares. Son pruebas del dominio local; no simulan concurrencia HTTP.

## Límites de responsabilidad

- `app/domain/scoring.py`: Barthel, Braden, broncoaspiración, peso y riesgo.
- `app/domain/eligibility.py`: tipo biomecánico, cap10/cap20, elegibilidad y unidades.
- `app/domain/balancing.py`: algoritmo voraz y desempate del HTML.
- `app/domain/metrics.py`: estados, alertas, cobertura y carga.
- `app/domain/engine.py`: operación `balance`, `metrics` o `preview` para la capa HTTP actual.
- `app/domain/validation.py`: rechazo de datos inválidos antes de calcular, aprobado por el propietario durante la auditoría.

## Contrato del motor público

`evaluate_turn(patients, auxiliaries, assignments=None, action="balance")` valida y devuelve asignaciones, métricas y puntajes. Los IDs de pacientes son números enteros positivos; los IDs auxiliares son cadenas no vacías. `assignments` usa claves de texto como JSON/JavaScript. `101.0` y `101` identifican el mismo paciente; no se convierte una cadena arbitraria en número.

El peso debe ser positivo y finito; Barthel entero entre 0 y 100; Braden entero entre 6 y 23; `broncoFlags` exactamente cinco booleanos. Se rechazan IDs duplicados, el ID auxiliar reservado `__proto__` y referencias inexistentes. No se recortan escalas, no se reparan referencias ni se impone capacidad de cuidado como validación. Los nombres no participan en el cálculo y no son campos obligatorios de este dominio.

`TurnValidationError` deriva de `ValueError` y ofrece `.code`, `.path` y `.as_dict()`. No incluye valores clínicos, nombres ni IDs recibidos. FastAPI lo traduce a HTTP 422. Las funciones de puntuación conservan el comportamiento de referencia para campos incompletos; la operación pública no acepta registros guardados incompletos.

## Correcciones verificadas

- Cobertura con la semántica de `Math.round`: 12,5% se presenta como 13%, igual que el HTML.
- Claves de ID numéricas equivalentes, evitando perder la carga de la cama `101.0`.
- Perfiles y capacidades auxiliares calculados una sola vez por turno; misma elegibilidad, orden y ranking, sin caché compartida.
- Se retiró `[tool.unittest]`, que no configuraba realmente el descubrimiento de pruebas.

Consultar la auditoría en `../plan paso a paso numia/14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md` para la evidencia de paridad. Los límites de transporte, números extremos, respuesta necesaria para el canvas y semántica del estado vacío siguen pendientes de decisión. Esta entrega no es una aprobación de producción.

`cap20` se conserva calculado y no participa en elegibilidad, asignación ni alertas. La API conserva el contrato raíz `patients`, `auxiliaries`, `assignments` y `action`; rechaza envoltorios desconocidos para evitar evaluaciones silenciosamente vacías.
