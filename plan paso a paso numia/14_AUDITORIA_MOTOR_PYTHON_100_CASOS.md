# 14. Auditoría del motor Python — 100 turnos simulados

Fecha: 2026-09-08. Carpeta auditada: `C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA`.

## Dictamen y alcance

El dominio Python quedó corregido y comprobado contra el JavaScript real del HTML congelado. Pasan 20 pruebas, sin errores, fallos ni pruebas omitidas. Los 100 turnos aleatorizados y sus 100 estados independientes de métricas coinciden exactamente; no se admitieron tolerancias numéricas para ocultar divergencias.

La arquitectura objetivo continúa siendo frontend conservado + backend Python/FastAPI sin estado. Esta auditoría mejora el dominio y su código de QA; no implementa otra arquitectura ni cambia reglas clínicas. La API, el frontend separado y su conexión todavía no existen. **La aplicación migrada no está lista para producción.**

El usuario aprobó expresamente rechazar entradas inválidas y referencias inexistentes antes del motor, sin corregirlas automáticamente. Esa política se implementó en `evaluate_turn`; la traducción a HTTP 422 queda para la API.

## Errores reproducidos y corregidos

| Hallazgo | Evidencia anterior | Corrección de código |
|---|---|---|
| Redondeo diferente al HTML | Turno aleatorio índice 36: 80 pacientes, 1 auxiliar, mismas asignaciones; cobertura Python 12%, HTML 13%. También 1/8 → 12 frente a 13 y 5/8 → 62 frente a 63. | Conservar la operación de porcentaje y reproducir el desempate de `Math.round`, sin cambiar la fórmula. |
| ID integral decodificado como float | `101.0` creaba la clave `"101.0"`; JavaScript usa `"101"`. En `metrics` se perdía la carga de ese paciente. | Conversión de clave compartida para IDs numéricos integrales ordinarios; sin mutar la entrada ni renombrar cadenas arbitrarias. |
| Entrada pública sin validación | Peso -1 recibía clasificación LEVE; asignación a auxiliar inexistente podía declarar 100% de cobertura. | Política aprobada: `TurnValidationError` antes de calcular, con código y ubicación del campo; sin datos clínicos en mensajes. |
| Cálculos repetidos | El perfil del mismo auxiliar se reconstruía en cada pareja paciente–auxiliar. | Preparar perfiles/capacidades una vez por llamada. Se mantiene el orden y la misma expresión de elegibilidad/ranking. |
| Configuración de pruebas inefectiva | `[tool.unittest]` no configuraba el descubrimiento ejecutado. | Retirar esa sección; documentar el comando real y sus requisitos. |

Las funciones de puntuación en `scoring.py` conservan exactamente su SHA-256 anterior. Se preservan cap10, cap20 calculado sin uso decisorio, cupos, bandas, bonos, orden de pacientes, desempate por orden auxiliar y capacidad clínica blanda. El caso 18/17 continúa produciendo una sobrecarga y una alerta.

Base técnica del redondeo: [Python round](https://docs.python.org/3/library/functions.html#round) y [especificación ECMAScript Math.round](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.round). La corrección restaura el resultado del HTML, no define un criterio clínico nuevo.

## Experimento reproducible

- Semilla local: `20260908`; generador `random.Random`, con Python 3.14.6 en esta ejecución.
- 100 turnos: 8.245 pacientes y 1.395 auxiliares acumulados; no son 100 solicitudes concurrentes.
- Mezcla de turnos vacíos, sin auxiliares, auxiliares sin pacientes, límites de peso, rangos completos de escalas, indicadores binarios y órdenes barajados.
- Caso mayor: 1.000 pacientes y 100 auxiliares.
- Además, 100 llamadas de `metrics` con asignaciones obtenidas del HTML, no del motor Python.
- Comparación de asignaciones, cada componente del puntaje, riesgo, unidades, perfiles, elegibilidad de cada pareja y todos los campos de métricas.
- Casos dirigidos: redondeo .5, IDs integrales float, incompletos en las funciones de referencia, desempates, cupos y sobrecarga.
- Repetición determinista de cada turno y comprobación de que la entrada no se modifica.
- Validación: rangos, finitud, tipos, flags de longitud cinco, duplicados, acciones, formas mal construidas y referencias inexistentes. También aislamiento del diccionario de salida y ausencia de salida por stdout/stderr.

El primer pase, antes de cambiar el motor, produjo seis fallos de subcasos en once métodos de prueba; las cuatro pruebas antiguas seguían pasando. El pase final, con las pruebas de seguridad añadidas, terminó en 20 métodos aprobados.

El oráculo de QA verifica la huella antes de ejecutar únicamente el código local congelado. Los datos llegan separados del código, cada turno usa su propio contexto y existen tiempos de espera. Node es una dependencia de las pruebas, no un backend de producción. Si falta Node o cambia el HTML, la prueba falla.

```powershell
Set-Location -LiteralPath 'C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA'
py -3 -B qa/audit_engine.py
```

La evidencia [AUDIT-100_RESULT.json](evidence/AUDIT-100_RESULT.json) incluye hashes de código antes/después, hashes de pruebas, semilla, versiones y resultados. [AUDIT-100_TESTS.txt](evidence/AUDIT-100_TESTS.txt) conserva la salida completa. El runner devuelve código distinto de cero si falla la suite.

## Rendimiento observado

Se alternaron cinco ejecuciones del motor original y cinco del corregido sobre el mismo turno de 1.000 pacientes/100 auxiliares. La nueva medición incluye la validación de entrada.

| Medida local | Antes | Después |
|---|---:|---:|
| Mediana por evaluación del turno | 2.822,883 ms | 981,877 ms |

Reducción observada aproximada de 65%. La variabilidad del equipo fue elevada; los valores individuales están en el JSON. Esta medición del dominio no establece capacidad de servicio, concurrencia HTTP, latencia de red ni un compromiso de producción.

## Integridad de interfaz y PDF

`index.html` y `reference/index.html` siguen siendo idénticos byte a byte:

`64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6`.

Se abrió el HTML original en una sesión aislada de Chromium 152.0.7977.64 mediante `agent-browser`. Se observó:

- Pantalla vacía y turno de muestra: 8 pacientes, 5 auxiliares, 8 asignaciones esperadas, cobertura 100%, alertas 0.
- Sobrecarga sintética de 18/17: estado overload, cobertura 100% con alerta y porcentaje clínico 106%.
- Captura de escritorio y móvil a 390 × 844; ancho del documento 390, sin desbordamiento horizontal en ese escenario.
- No aparecieron errores JavaScript registrados durante estos flujos.
- El generador existente produjo un PDF de muestra de 2 páginas A4, 349.100 bytes. `pdfinfo` lo leyó y Poppler renderizó ambas páginas; se inspeccionaron visualmente los puntajes, asignaciones, recomendaciones y paginación. No se reescribió el generador.

Archivos de evidencia: `AUDIT-100_empty.png`, `AUDIT-100_sample.png`, `AUDIT-100_overload.png`, `AUDIT-100_mobile.png`, `AUDIT-100_sample.pdf` y `AUDIT-100_pdf-page-1.png`/`-2.png` dentro de `evidence/`. Son salidas locales de QA con los datos de muestra/sintéticos.

Una primera carga invocada desde evaluación JavaScript agotó un tiempo de espera. La carga posterior usando el botón visible funcionó y se verificaron estado/asignaciones. No se atribuye ese timeout al código del producto sin reproducción; queda documentado como incidente de automatización. El PDF se capturó del generador existente mediante `qa/capture_pdf.cjs`; no se certifica con ello el diálogo ni la descarga final del botón de exportación.

Esta inspección establece una referencia visual del HTML original, no equivalencia visual de un frontend migrado que aún no existe.

## Discrepancias que requieren decisión conjunta

### D-01 — Respuesta de API incompleta para conservar toda la interfaz

El capítulo 12es de paciente y `isEligible` para tarjetas, previsualizaciones, tooltips y conexiones posibles del canvas. `auxiliaryRecommendation` contiene decisiones de estado y textos que todavía no se portaron. La respuesta actual no cubre esas necesidades si toda la lógica debe vivir en Python.

Propuesta para revisión, aún no implementada: conservar el mismo endpoint y las capas aprobadas, y completar su respuesta con perfiles auxiliares, unidades por paciente, compatibilidades por paciente y recomendaciones existentes. Definir también un contrato de previsualización de formulario incompleto, distinto de guardar un turno válido. Esto cambia el contrato de datos, no los umbrales ni el algoritmo; requiere aprobación antes de conectar la interfaz.

Campos propuestos para `balance`/`metrics`, además de los actuales:

| Campo | Contenido exacto de referencia |
|---|---|
| `auxiliary_profiles` | Objeto por ID auxiliar con `cap10`, `cap20`, `type`, `typeValue`, `maxPatients`. |
| `patient_units` | Objeto por ID paciente con el valor de `careUnitsForPatient`. |
| `eligibility` | Objeto por ID paciente con la lista de IDs auxiliares compatibles, en el orden recibido. |
| `auxiliary_recommendations` | Objeto por ID auxiliar con `tone`, `title`, `text` de `auxiliaryRecommendation`, preservando sus decisiones y textos. |

Para formularios, propuesta de `action="preview"` en el mismo endpoint: recibir un borrador `patient` con peso/escalas/flags o un borrador `auxiliary` con peso, sin exigir un ID de registro. Devolver sólo la previsualización de puntuación/perfil; no crear asignaciones ni estado. Los campos ausentes siguen la representación de incompleto del HTML y los valores presentes inválidos se rechazan. Esta propuesta aún no modifica `evaluate_turn`, que continúa admitiendo sólo `balance` y `metrics` con turnos válidos.

### D-02 — Límites de entrada/servicio todavía no definidos

La validación aprobada rechaza negativos, no finitos y referencias rotas. Siguen pendientes el máximo técnico de tamaño de solicitud, número de registros y representación de IDs numéricos extremos. JavaScript y Python no tienen el mismo dominio de enteros: no se estableció unilateralmente un límite nuevo que rechace entradas antes admitidas por el HTML.

También debe definirse el rechazo por no representabilidad de resultados: un peso auxiliar finito extremo puede desbordar cap10/cap20 a infinito. No se impuso un nuevo límite de peso clínico para resolverlo. Propuesta: una validación técnica de finitud serializable y límites de transporte explícitos, manteniendo intactas las fórmulas. No exponer la API hasta resolver este borde.

Reproducción local confirmada: peso auxiliar `1.7e308` es finito, pero `cap10` y `cap20` dejan de ser finitos. Este caso extremo está fuera de los 100 turnos simulados y se registra como pendiente, no como prueba de seguridad superada.

### D-03 — Operación de balanceo con estado vacío y asignaciones previas

El `autoBalance` del HTML retorna sin tocar asignaciones si no hay pacientes o auxiliares. El caso de uso Python calcula un resultado nuevo y la validación aprobada rechaza referencias que ya no existen. La capa de interfaz debe limpiar referencias al borrar registros antes de solicitar evaluación y definir la transición vacía. No se cambió esa transición de UI en esta auditoría.

### D-04 — Cierre previo exagerado y condiciones de producción

Los manifiestos iniciales cerraron MIG-000/MIG-010 con dos fixtures y cuatro pruebas. MIG-000 no tenía entonces capturas/PDF. El gate de MIG-010 menciona pytest y dependencias que no se configuraron; la ejecución demostrada ahora es con unittest y biblioteca estándar. Los documentos históricos quedan anotados para no confundirlos con aprobación de release.

No hay aún FastAPI, validación de transporte, límites HTTP, manejo 422/errores sin datos clínicos, separación efectiva del frontend ni prueba extremo a extremo de la arquitectura objetivo. La configuración estática existente tampoco demuestra que backend, snapshots y evidencias queden excluidos de una futura publicación. No se publicó ni cambió ningún despliegue en esta auditoría.

La arquitectura actual del plan no incluye autenticación. Antes de hablar de producción debe elegirse el entorno de operación y el control de acceso; esa decisión no se puede sustituir por pruebas del motor. No se agregaron cuentas, autenticación, persistencia ni servicios.

## Cambios y rollback localizado

- Dominio: `__init__.py`, `balancing.py`, `eligibility.py`, `engine.py`, `metrics.py`; nuevo `validation.py`. `scoring.py` intacto.
- QA: `html_oracle.cjs`, `audit_engine.py`, `capture_pdf.cjs`, `test_differential.py`, `test_validation.py`.
- Documentación/metadatos: README del backend, pyproject, `.gitignore` del backend, índice/backlog y aclaraciones de evidencia.
- Copia exacta anterior del dominio y pyproject: `evidence/AUDIT-100_BEFORE/`.

Para revertir un cambio del dominio, comparar el hash actual con el registrado en `AUDIT-100_RESULT.json`, revisar que no existan ediciones posteriores y restaurar exclusivamente ese archivo desde la copia previa. Si se revierte la validación, restaurar conjuntamente `engine.py` y apartar únicamente el nuevo `validation.py`. No borrar carpetas completas, el HTML, snapshots ni pruebas de terceros. Las pruebas de regresión pueden conservarse para volver a demostrar el defecto previo.
 devuelve `assignments`, `metrics` y `patient_scores`. El HTML también necesita `auxiliaryProfile`, unidad