# 12. Arquitectura objetivo con paridad

## Decisión

Usar un frontend estático conservado y un backend Python con FastAPI. El backend es sin estado: cada solicitud recibe el turno completo y devuelve sólo resultados derivados. Esto evita base de datos y mantiene el alcance en la separación solicitada.

```text
Navegador
  frontend/index.html + assets/styles.css + assets/app.js
      |  JSON HTTP /api/v1/turn/evaluate
      v
backend/app/main.py (FastAPI: validación de transporte)
      v
backend/app/domain/ (Python puro, sin HTTP ni DOM)
  scoring.py -> eligibility.py -> balancing.py -> metrics.py
      v
Respuesta: scores + assignments + metrics
```

## Estructura propuesta

```text
NUMIA CALCULADORA/
  reference/index.html                 # copia inmutable del oráculo, fuera de la salida servida
  frontend/
    index.html                         # mismo DOM, textos y orden visibles
    assets/styles.css                  # CSS extraído sin cambios visuales
    assets/app.js                      # estado/UI/canvas/PDF/adaptador API; sin fórmulas
  backend/
    pyproject.toml
    app/main.py
    app/api/schemas.py                 # modelos Pydantic de borde
    app/domain/scoring.py
    app/domain/eligibility.py
    app/domain/balancing.py
    app/domain/metrics.py
    tests/test_golden.py
    tests/fixtures/golden_turn.json
  plan paso a paso numia/
```

## Responsabilidades

| Capa | Hace | No hace |
|---|---|---|
| Frontend | Formularios, `STATE`, render, canvas, modales, confirmaciones y PDF idéntico. | Clasificar, decidir elegibilidad, balancear o recalcular métricas. |
| API | Validar forma del request, llamar al caso de uso y serializar JSON. | Guardar sesiones, modificar reglas o devolver HTML. |
| Dominio Python | Aplicar exactamente las reglas y el orden actuales. | Importar FastAPI, tocar archivos, leer entorno o almacenar datos. |
| Tests | Verificar límite, turno golden y paridad del contrato. | Definir una nueva regla clínica. |

## Contrato HTTP mínimo

`POST /api/v1/turn/evaluate`

Entrada: `{ "patients": [...], "auxiliaries": [...], "assignments": {...}, "action": "balance" | "metrics" }`.

- `balance`: devuelve `assignments` del algoritmo actual y `metrics` calculadas sobre ellas.
- `metrics`: conserva las asignaciones recibidas y devuelve `metrics`; no rebalancea.
- Respuesta: `{ "assignments": {...}, "metrics": {...}, "patient_scores": {...}, "engine_version": "parity-1" }`.
- Errores de forma: HTTP 422, sin inventar valores ni normalizar silenciosamente entradas válidas.
- Sin cookies, JWT, CORS abierto, logs de pacientes ni almacenamiento.

El contrato final se congela junto con fixture JSON antes de conectar el frontend. IDs se transportan como llegan; las claves de asignación se normalizan de forma explícita y probada para conservar el comportamiento actual de JavaScript.

## Decisiones de despliegue

En desarrollo: FastAPI sirve `/api` y el frontend se sirve como archivos estáticos desde el mismo origen. En producción se ubican detrás de un único origen HTTPS. La persistencia, usuarios e infraestructura clínica son iniciativas distintas y requieren aprobación de seguridad/privacidad.
