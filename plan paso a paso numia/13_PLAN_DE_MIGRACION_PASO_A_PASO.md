# 13. Plan de migración paso a paso

## Regla transversal

Un paso sólo empieza si el anterior tiene evidencia aprobada. Un lote toca una responsabilidad, conserva la referencia y tiene rollback local. No usar Git en este directorio; registrar hashes, copias y resultados.

## MIG-000 — Congelar referencia y fixtures

1. Copiar el `index.html` de Escritorio a `reference/index.html` y marcarlo sólo lectura.
2. Registrar SHA-256, versión de navegador y capturas de: vacío, muestra balanceada, sobrecarga y PDF.
3. Convertir `02_MATRIZ_REGRESION_GOLDEN.md` a `backend/tests/fixtures/golden_turn.json`, sin cambiar valores.
4. Añadir fixture de sobrecarga 18/17 y casos de límites.

Gate: hash de referencia registrado; 8 asignaciones golden y PDF legible. Rollback: borrar sólo la salida nueva; nunca la referencia.

## MIG-010 — Motor Python puro

1. Crear `backend/pyproject.toml` con FastAPI, Uvicorn, Pydantic y pytest fijados por rango compatible.
2. Implementar en este orden: `scoring.py`, `eligibility.py`, `balancing.py`, `metrics.py`.
3. Portar literalmente condiciones, umbrales, ordenamiento y desempate; conservar `cap20` calculado pero sin uso decisorio.
4. Escribir `test_golden.py`: límites, perfiles, elegibilidad, tres riesgos, turno de muestra, sobrecarga y métricas.

Gate: `pytest` verde y JSON igual al fixture esperado. Rollback: retirar `backend/` sin tocar `index.html`.

## MIG-020 — API sin estado

1. Crear schemas de request/response y `POST /api/v1/turn/evaluate`.
2. Validar que `balance` y `metrics` tienen semántica separada.
3. Añadir pruebas HTTP: 200, 422, IDs mixtos, turno vacío y casos incompletos.
4. Configurar logs sin nombres, pesos ni datos clínicos; no habilitar CORS salvo el origen local explícito.

Gate: pruebas API verdes, respuesta golden byte-estable tras ordenamiento JSON acordado. Rollback: conservar el motor y no conectar UI.

## MIG-030 — Extraer frontend sin cambio visible

1. Crear `frontend/index.html` copiando el DOM de referencia.
2. Mover CSS a `assets/styles.css` y JavaScript a `assets/app.js`; primero mantener funciones de motor temporalmente para comparación local, no para release.
3. Verificar selectores, IDs, orden de tabulación, breakpoints, canvas, modales y exportación PDF.
4. Comparar capturas en ancho móvil y escritorio contra `reference/index.html`.

Gate: no hay cambios intencionales de DOM/texto/CSS; flujo manual y PDF iguales. Rollback: servir el HTML de referencia.

## MIG-040 — Conectar y retirar cálculo duplicado

1. Añadir un cliente `evaluateTurn(action)` que envía una copia serializable de `STATE`.
2. En `autoBalance`, solicitar `action=balance`, reemplazar sólo asignaciones/métricas derivadas y renderizar al resolver.
3. En render/PDF, consumir métricas cacheadas de la respuesta o solicitar `metrics`; no recalcular fórmulas en JavaScript.
4. Eliminar del frontend `score*`, `patientScore`, `auxiliaryProfile`, `isEligible`, `careUnitsForPatient`, `careCapacityForAuxiliary`, `autoBalance` y `getMetrics` sólo después de que la paridad E2E sea verde. Mantener adaptadores de presentación mínimos, sin reglas.
5. Ante error de red, mostrar fallo operativo claro y no inventar una asignación local. No implementar fallback divergente.

Gate: golden E2E, sobrecarga, rebalanceo tras alta/baja, consola limpia, PDF y comparación visual aprobadas. Rollback: conmutar el frontend al HTML de referencia y detener la API.

## MIG-050 — Empaquetado y release local

1. Documentar un único comando de desarrollo y un único comando de arranque.
2. Ejecutar pruebas Python, pruebas HTTP, golden E2E y revisión manual en Chrome/Edge.
3. Generar manifiesto: hashes, dependencias bloqueadas, resultados, riesgos y procedimiento de rollback.
4. Hacer revisión clínica de paridad antes de cualquier uso fuera de demostración.

Gate final: todos los gates anteriores, sin persistencia, sin secretos, sin PHI en fixtures/logs y sin afirmaciones de certificación clínica.

## Checklist de aceptación

- [ ] Cada banda y cada límite golden es idéntico.
- [ ] Las asignaciones 101–108 coinciden exactamente.
- [ ] El caso 18/17 conserva alerta de sobrecarga.
- [ ] La UI conserva textos, layout, canvas y PDF del HTML de referencia.
- [ ] El frontend no contiene reglas matemáticas ni decisiones de balanceo.
- [ ] El backend no persiste datos ni emite PHI en logs.
- [ ] Hay rollback probado al HTML de referencia.
