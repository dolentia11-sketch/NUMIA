# Plan de evolución con paridad del MVP NUMIA

## Mandato

Este directorio contiene el plan autorizado para evolucionar el MVP existente. La decisión de producto del 8 de septiembre de 2026 habilita separar el frontend del motor Python, manteniendo la experiencia visible y las salidas del `index.html` como contrato de paridad. No autoriza modificar reglas clínicas, fórmulas, datos de muestra, orden del algoritmo ni resultados golden.

La fuente de aplicación autorizada es:

    C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\index.html

La migración sí autoriza un backend local en Python y una API HTTP privada para cálculo. No autoriza base de datos, persistencia, autenticación, multitenencia, SaaS, cambios de framework, cambios visuales intencionales, ni cambios de comportamiento.

**NUMIA_SaaS_Plan_Paso_a_Paso.md** sigue siendo histórico: no es el diseño objetivo porque mezcla multitenencia, configuración clínica y cambios funcionales no autorizados.

## Regla de oro

Para todo input válido ya aceptado por el MVP:

    mismo input + mismo orden + mismo estado = mismo cálculo + misma asignación + mismas métricas

Si un cambio modifica una puntuación, elegibilidad, asignación, cupo, unidad de cuidado, alerta operativa, ejemplo de muestra o contenido numérico del PDF, se debe detener. Ese cambio no pertenece a este plan.

## Baseline bloqueado

| Elemento | Valor |
|---|---|
| Archivo canónico | index.html |
| SHA-256 de la referencia vigente de Escritorio | 64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6 |
| Tipo de app | HTML estático, CSS y JavaScript embebidos |
| Estado | Memoria efímera del navegador |
| Motor lógico de referencia | scoreBarthel a getMetrics, líneas 2522–2748; incluye operaciones sobre STATE |
| Reporte de referencia | INFORME_LOGICA_MATEMATICA_NUMIA.md |

Las líneas indicadas en este plan corresponden al baseline anterior. Cuando un micro-parche desplaza líneas, los nombres de función y los hashes de bloque prevalecen sobre el número de línea.

## Orden de lectura obligatorio para agentes de código

1. [00_CONTRATO_DE_INMUTABILIDAD.md](00_CONTRATO_DE_INMUTABILIDAD.md)
2. [01_BASELINE_E_INVENTARIO.md](01_BASELINE_E_INVENTARIO.md)
3. [02_MATRIZ_REGRESION_GOLDEN.md](02_MATRIZ_REGRESION_GOLDEN.md)
4. Leer [11_AUDITORIA_DE_ESTADO_2026-09-08.md](11_AUDITORIA_DE_ESTADO_2026-09-08.md), [12_ARQUITECTURA_OBJETIVO_CON_PARIDAD.md](12_ARQUITECTURA_OBJETIVO_CON_PARIDAD.md) y [13_PLAN_DE_MIGRACION_PASO_A_PASO.md](13_PLAN_DE_MIGRACION_PASO_A_PASO.md).
5. Elegir un solo item de [09_BACKLOG_SECUENCIADO.md](09_BACKLOG_SECUENCIADO.md).
6. Seguir [07_PROTOCOLO_DE_MICROPATCH.md](07_PROTOCOLO_DE_MICROPATCH.md) para mantenimiento o los gates del capítulo 13 para migración.
7. Aplicar [08_CRITERIOS_DE_ACEPTACION_Y_RELEASE.md](08_CRITERIOS_DE_ACEPTACION_Y_RELEASE.md).

## Índice

| Archivo | Uso |
|---|---|
| 00_CONTRATO_DE_INMUTABILIDAD.md | Qué está congelado, qué está prohibido y qué sí puede mejorarse. |
| 01_BASELINE_E_INVENTARIO.md | Fuente canónica, inventario y preflight reproducible. |
| 02_MATRIZ_REGRESION_GOLDEN.md | Casos exactos que nunca pueden variar. |
| 03_P0_VALIDACION_DE_ENTRADA.md | Endurecimiento permitido de captura inválida. |
| 04_P1_ACCESIBILIDAD_Y_UX.md | Mejoras de teclado, foco, lectores y prevención de errores. |
| 05_P1_ESTABILIDAD_Y_RENDIMIENTO.md | Cambios seguros de resize, animación y descarga. |
| 06_P2_DOM_PDF_Y_OPERACION_SEGURA.md | Revisión DOM/PDF y acciones destructivas no clínicas. |
| 07_PROTOCOLO_DE_MICROPATCH.md | Procedimiento exacto por cambio. |
| 08_CRITERIOS_DE_ACEPTACION_Y_RELEASE.md | Gates de calidad y rollback. |
| 09_BACKLOG_SECUENCIADO.md | Orden, alcance y pruebas de cada mejora. |
| 10_HANDOFF_PARA_AGENTES_DE_CODIGO.md | Instrucción literal para Codex u otro agente. |
| 11_AUDITORIA_DE_ESTADO_2026-09-08.md | Estado real, riesgos y alcance observado. |
| 12_ARQUITECTURA_OBJETIVO_CON_PARIDAD.md | Diseño frontend/backend y contrato HTTP. |
| 13_PLAN_DE_MIGRACION_PASO_A_PASO.md | Secuencia ejecutable, pruebas, gates y rollback. |
| [14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md](14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md) | Errores corregidos, 100 turnos reproducibles, validación aprobada y decisiones pendientes. |
| templates/ | Formatos de evidencia de cambio, regresión y release. |

## Dos modos de trabajo

Estado verificado el 2026-09-08: referencia congelada; dominio Python auditado con 20 pruebas y 100 turnos aleatorizados. La API y el frontend separado todavía no están implementados. Los manifiestos iniciales de MIG-000/MIG-010 deben leerse junto con el capítulo 14; no prueban que la migración completa esté lista para producción.

| Modo | Cuándo usarlo | Regla |
|---|---|---|
| Mantenimiento conservador | Correcciones de UI/UX ya listadas en 03–06. | Sigue el contrato original y no toca la arquitectura. |
| Migración con paridad | Separar frontend y backend Python. | Sigue 11–13; el resultado funcional y visual debe ser equivalente al HTML de referencia. |

## Secuencia de migración autorizada

1. Congelar y probar el `index.html` de referencia actual.
2. Extraer un motor Python puro, probado contra la matriz golden.
3. Exponer únicamente cálculo y balanceo mediante FastAPI, sin persistencia.
4. Separar CSS/JS del frontend conservando DOM, textos y estilos.
5. Reemplazar las llamadas al motor JavaScript por el adaptador HTTP.
6. Comparar la aplicación resultante contra el HTML de referencia en datos válidos, PDF y flujos.

El detalle operacional, contratos, gates y rollback está en el capítulo 13.

| Orden | Entrega | Cambio en lógica/arquitectura |
|---:|---|---|
| 0 | Baseline y evidencia | No |
| 1 | Validación de entradas inválidas | No; solo bloquear antes del motor |
| 2 | Accesibilidad de controles y modales | No |
| 3 | Estabilidad visual y de descarga | No |
| 4 | Revisión DOM/PDF y prevención de borrado accidental | No |
| 5 | Release local con evidencia | No |

## Definición de “mejora permitida”

Una mejora permitida cumple **todas** estas condiciones:

- toca solo presentación, validación previa, accesibilidad, manejo de eventos, rendimiento visual, mensaje o estabilidad de descarga;
- no modifica los bloques congelados del capítulo 00;
- no añade una dependencia, red, almacenamiento ni servicio;
- no cambia el objeto STATE, sus claves ni el ciclo de render;
- deja pasar toda la matriz golden;
- tiene un único objetivo y un rollback claro.

## Definición de “detener y escalar”

Detener el trabajo y pedir decisión explícita si se necesita:

- cambiar un umbral, fórmula, peso, puntaje, tipo, capacidad, orden o desempate;
- usar cap20 en vez de cap10;
- resolver la regla de Braden modificando código;
- añadir integración, persistencia, autenticación o tenant;
- reestructurar el HTML en componentes, React, Vue, módulos o backend;
- cambiar datos de muestra o su asignación esperada;
- reescribir el generador PDF con una librería.

## Entrega mínima de cada micro-parche

1. Archivo modificado y líneas.
2. Motivo técnico concreto.
3. Confirmación de que no se tocaron bloques congelados.
4. Resultado de los casos golden.
5. Resultado visual/manual.
6. Riesgo residual y rollback.
