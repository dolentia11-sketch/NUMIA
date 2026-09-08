# Informe auditor de conexión NUMIA

Fecha: 8 de septiembre de 2026
Alcance: auditoría de solo lectura de la copia `C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA`. No se modificó código, lógica clínica ni arquitectura.

## Estado posterior a la depuración

Este es un registro histórico de la auditoría inicial. La comprobación posterior encontró además funciones ausentes y errores asíncronos que esa auditoría no había cerrado. El resultado completo y la evidencia actual están en `DEPURACION_PARIDAD_2026-09-08.md`; ese documento sustituye cualquier afirmación de cierre prematura de este informe.

Actualizado el 8 de septiembre de 2026 tras autorización de corrección. Los hallazgos P0/P1 de este informe fueron corregidos sin cambiar fórmulas, reglas clínicas, algoritmo de balanceo, datos de referencia ni arquitectura serverless:

- `fetchEvaluation()` ahora envía los campos de `TurnRequest` en la raíz; el backend rechaza explícitamente el envoltorio legado `state`.
- El preview de auxiliar usa el ID textual `preview` y lee la misma clave de respuesta.
- Se añadieron regresiones HTTP y una regresión de bundle para ambas fronteras.
- La suite desde raíz funciona con 41 pruebas correctas. La verificación externa de Vercel sigue pendiente de una URL pública y no se infiere de la prueba local.

## Dictamen

El motor Python y los contratos HTTP internos funcionan bajo su contrato declarado, pero la UI actualmente no lo consume con el mismo contrato. La causa principal reproducible del síntoma «no se pudo conectar con el motor» es que `fetchEvaluation()` envía el turno bajo `state`, mientras que FastAPI espera `patients`, `auxiliaries` y `assignments` en el cuerpo raíz. Pydantic ignora el campo extra, por lo que responde `200` para un turno vacío. La UI confunde esa respuesta semánticamente vacía con un cálculo válido.

No se autoriza afirmar que Vercel en producción esté operativo solo con este repositorio local: no se encontró una URL de producción ni evidencia de respuesta remota verificable en los archivos auditados.

## Hallazgos priorizados

| Prioridad | Hallazgo | Evidencia | Efecto observable |
|---|---|---|---|
| P0 | Contrato roto al evaluar/balancear | `public/assets/app.js:12-25` arma `payload` correcto, pero lo envía como `{ state: payload, action }`; `backend/app/api/schemas.py:33-37` declara los campos de turno en raíz. | Con pacientes registrados, la API recibe listas predeterminadas vacías y devuelve métricas/score vacíos. No hay cálculo clínico visible ni balanceo real. |
| P0 | No existe prueba de integración que detecte el contrato real de navegador | `backend/tests/test_api.py` solo manda el formato raíz; no hay prueba que construya el body de `fetchEvaluation()`. | La suite verde no protege el flujo que falla en la UI. |
| P1 | Preview de auxiliar incompatible con el esquema y con su propia lectura | `public/assets/app.js:495-496` envía `id: 999999` y busca `auxiliary_profiles["preview"]`; `backend/app/api/schemas.py:58-65` tipa `AuxiliaryPreviewIn.id` como `str | None`. | FastAPI responde 422 al ID numérico. Con ID textual válido, la UI actual buscaría una clave distinta. El cálculo de auxiliar queda en `—` o no se actualiza. |
| P1 | El manejo de error oculta el diagnóstico real | `public/assets/app.js:27`, `41`, `57-60`, `482`, `506`. Toda respuesta no 2xx se convierte en `API Error`; los previews solo hacen `console.error`. | Un 422 de validación y un fallo de red se muestran o comportan igual para quien usa la aplicación. Dificulta depuración clínica y operativa. |
| P1 | Documentación contradictoria y con codificación dañada | `README.md:8`, `README.md:10-19`, `backend/README.md:1-7`, `plan paso a paso numia/11_AUDITORIA_DE_ESTADO_2026-09-08.md:3-16`. | El README declara la integración 100% operativa pero contiene mojibake y describe `/frontend/`, carpeta inexistente; los documentos del motor aún dicen que HTTP/integración son futuros o pendientes. |
| P2 | Fuentes canónicas duplicadas | `index.html` y `reference/index.html` coinciden entre sí; `public/index.html` es una extracción distinta y carga `public/assets/app.js`. | El frontend servido no es el HTML canónico. Toda evolución debe declarar cuál archivo es la fuente de verdad y cubrir su paridad de manera explícita. |
| P2 | Pruebas invocables desde raíz no funcionan con el comando genérico | Desde la raíz, `py -3 -B -m unittest discover -s backend/tests -v` falla al no resolver `app`; el comando documentado requiere ejecutar desde `backend/`. | Riesgo de falsos fallos en CI o de que otra persona ejecute una orden distinta a la documentada. |

## Reproducción técnica del P0

Con un paciente válido y un auxiliar válido:

1. El body emitido por la UI es `{ "state": { "patients": [...], "auxiliaries": [...], "assignments": {} }, "action": "metrics" }`.
2. FastAPI responde `200`, pero con `patient_scores`, `auxiliary_profiles`, `loads` y asignaciones vacíos.
3. Al mover las listas y asignaciones al nivel raíz, la misma API devuelve score del paciente, perfil del auxiliar, elegibilidad y métricas esperadas.

Esta diferencia fue reproducida con `FastAPI TestClient`; no es una hipótesis basada solo en lectura estática.

## Validación realizada

- Repositorio local: limpio tras la auditoría (`git status --short` sin cambios).
- Sintaxis: `node --check public/assets/app.js` y `node --check public/assets/app_raw.js` terminaron sin error.
- Motor y API: el arnés reproducible registrado en `plan paso a paso numia/evidence/AUDIT-100_TESTS.txt` completó 39 pruebas con resultado `OK`. Esto valida dominio/API con el contrato correcto, no la integración de la UI.
- Oráculo histórico: `node qa/reference_golden.cjs` informó `MIG-000 reference golden: PASS`.
- UI local: se recorrió onboarding y registro con datos sintéticos. El formulario paciente llega a la ruta de evaluación posterior, donde el body observado contiene el envoltorio `state` defectuoso. No se usaron datos clínicos reales.

## Discrepancias descartadas

- El motor no necesita modificar sus fórmulas para explicar el incidente.
- El ID `999999` del preview de paciente es aceptado por su esquema numérico; el problema equivalente persiste solo en preview de auxiliar, cuyo ID está tipado como texto.
- `shouldAutoRebalance` y `renderAfterDataChange` están presentes en `public/assets/app.js:138-148`; no son la causa actual del contrato roto.

## Puerta de depuración propuesta

Antes de cualquier corrección, convertir cada hallazgo P0/P1 en regresión:

1. Una prueba de contrato que compare exactamente el JSON producido por `fetchEvaluation()` con `TurnRequest` y que falle si el estado se encapsula bajo una clave no declarada.
2. Una prueba de preview auxiliar con el ID y la clave de resultado que la UI realmente utiliza.
3. Un flujo E2E con un paciente sintético: registrar, obtener score no vacío, guardar, y verificar que el contador/listado cambia; otro para auxiliar.
4. Mantener sin cambios `scoring.py`, `eligibility.py`, `balancing.py`, `metrics.py`, fixtures, fórmulas, capacidad y algoritmo. El parche posterior debe limitarse a frontera cliente–API, pruebas y documentación coherente.

## Riesgo residual

La evidencia local no verifica que el despliegue Vercel publicado corresponda al commit `fe19a60`, ni que las reescrituras funcionen externamente. Esa afirmación requiere la URL de producción y pruebas HTTP/flujo de navegador contra ella.
