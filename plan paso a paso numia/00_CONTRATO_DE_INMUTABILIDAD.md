---
owner: Product Owner NUMIA
approver: Responsable clínico y propietario del MVP
status: obligatorio antes de editar
---

# 00. Contrato de inmutabilidad clínica y paridad

## Objetivo

Evitar que una mejora de código “pequeña” altere comportamiento clínico, cálculo, balanceo o arquitectura. Este documento es el límite contractual para cualquier agente de código.

## Decisión de arquitectura

El HTML monolítico es la **referencia de comportamiento y apariencia**, no el destino técnico. Se autoriza migrar a la arquitectura de `12_ARQUITECTURA_OBJETIVO_CON_PARIDAD.md` exclusivamente bajo los gates de `13_PLAN_DE_MIGRACION_PASO_A_PASO.md`.

La arquitectura de referencia es:

    Un solo index.html
      ├─ HTML y CSS embebidos
      ├─ JavaScript embebido
      ├─ STATE efímero en memoria
      ├─ Canvas decorativo y campo de coincidencia
      └─ Generador PDF local

Durante la migración, queda prohibido cambiarla por:

- Node, Supabase, Firebase, WebSocket o cualquier backend distinto de Python/FastAPI;
- localStorage, IndexedDB, cookies funcionales, base de datos o archivos persistentes;
- React, Vue, Angular, Tailwind, bundler, TypeScript, módulos ES o dependencias CDN;
- cambios visuales, renombramiento masivo o una reescritura de componentes;
- nuevos cálculos, IA, FHIR, roles, hospital_id o cualquier función SaaS.

## Bloques de lógica congelados

| ID | Ancla de inicio y fin | Líneas baseline | Comportamiento que no cambia |
|---|---|---:|---|
| L-01 | scoreBarthel | 2476–2483 | Bandas de Barthel y puntaje. |
| L-02 | scoreBraden | 2485–2490 | Bandas de Braden; 12–15 devuelve 2. |
| L-03 | scoreBronco | 2492–2497 | Conteo 0, 1–2, 3–5. |
| L-04 | scoreWeight | 2499–2507 | Bandas de peso del paciente. |
| L-05 | patientScore | 2509–2524 | Suma, etiquetas y umbrales de riesgo. |
| L-06 | auxiliaryProfile | 2526–2534 | Tipo, cupo, cap10 y cap20 calculados. |
| L-07 | isEligible | 2536–2541 | Elegibilidad usa cap10 y tipo suficiente. |
| L-08 | careUnitsForPatient | 2543–2551 | Unidades de cuidado y bonos. |
| L-09 | careCapacityForAuxiliary | 2553–2555 | Capacidad igual a cupo por 1.7. |
| L-10 | shouldAutoRebalance y renderAfterDataChange | 2557–2567 | Regla de rebalanceo automático. |
| L-11 | nextAuxiliaryId | 2569–2575 | Generación de ID auxiliar. |
| L-12 | autoBalance | 2577–2648 | Orden de pacientes, elegibilidad, rank y asignación. |
| L-13 | getMetrics | 2650–2702 | Cobertura, estados, alertas y porcentajes. |
| L-14 | auxiliaryRecommendation | 2787–2825 | Mensajes derivados del estado de carga. |
| L-15 | SAMPLE_PATIENTS y SAMPLE_AUX | 2444–2461 | Dataset demostrativo y salida golden. |
| L-16 | createReportPages y makePdfFromCanvases | 3127–3368 | Estructura y contenido numérico del PDF. |

En la migración, estas funciones se implementan en Python con sus mismas entradas y salidas; no se copian como una nueva fuente de verdad JavaScript. Las funciones de PDF permanecen en el frontend porque dibujan la misma presentación; reciben el estado y métricas devueltos por el backend.

## Bloques que pueden tocarse bajo condiciones

| Zona | Líneas baseline | Condición |
|---|---:|---|
| Atributos HTML de input | 2245–2356 | Solo accesibilidad o restricciones que bloqueen datos inválidos antes del motor. |
| renderBroncoControls | 2904–2916 | Mantener los mismos cinco ítems, orden y llamada a toggleBronco. |
| open/close modal e init | 2918–2947 y 3808–3849 | Solo foco, teclado y estabilidad de eventos. |
| savePatient y saveAux | 3013–3056 | Solo validación previa; no normalizar ni recalcular reglas. |
| clearData/removal | 3059–3086 | Solo confirmación y foco, sin cambiar efectos cuando usuario confirma. |
| toast | 3387–3407 | Solo accesibilidad y ciclo visual; conservar mensaje recibido. |
| resize/animaciones | 3459–3799 y 3837–3846 | Solo consumo visual, nunca datos, puntajes ni conexiones. |
| exportReportPdf | 3368–3385 | Solo robustez de descarga; contenido del PDF no cambia. |

## Prohibiciones clínicas específicas

- No modificar la discrepancia documental Braden cambiando scoreBraden. La regla actual queda congelada.
- No activar cap20 ni eliminarlo.
- No volver dura la capacidad de cuidado; hoy solo afecta el ranking.
- No cambiar algoritmo voraz, orden de pacientes, rank o desempate.
- No validar, redondear ni transformar valores dentro de las funciones L-01 a L-13.
- No alterar métricas de cobertura. Se permite retirar o condicionar únicamente el copy que describa como “óptima” una asignación con sobrecarga, según el capítulo 06; no se cambia ningún estado, fórmula ni decisión.

## Hash de bloque para comprobación

Antes y después de cada micro-parche, calcular el hash del núcleo usando este comando. El valor debe ser idéntico.

~~~powershell
$sourcePath = 'C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\index.html'
$raw = Get-Content -LiteralPath $sourcePath -Raw
$match = [regex]::Match($raw, '(?s)function scoreBarthel\(.*?(?=\s*function render\(\))')
if (-not $match.Success) { throw 'No se encontró el bloque lógico congelado.' }
# Solo se permite cambiar el literal visible de toast de balanceo; se normaliza ese texto.
$normalized = $match.Value -replace 'toast\("Balanceo completo",.*?\);', 'BALANCE_TOAST_COPY'
$bytes = [Text.Encoding]::UTF8.GetBytes($normalized)
$sha = [Security.Cryptography.SHA256]::Create()
($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join ''
~~~

El reporte debe guardar hash antes, hash después y resultado “idéntico”.

La excepción de normalización no autoriza modificar condiciones, argumentos, cálculo o flujo de autoBalance. Solo permite sustituir el texto literal de la notificación para no describir una sobrecarga como “óptima”.

## Regla de compatibilidad

Los cambios de validación solo pueden rechazar un dato fuera de los límites visibles de interfaz o físicamente imposible. Para todo dato válido, el resultado debe ser byte a byte equivalente en la matriz golden.

## Control de versiones seguro

El directorio de aplicación no tiene un repositorio Git aislado: el root detectado está fuera del proyecto, en el perfil del usuario. Por tanto:

- no ejecutar git status, git diff, git add, git commit, git reset ni git checkout desde esta ruta;
- no inicializar o mover un repositorio sin autorización explícita;
- usar hash, copia de referencia y el manifiesto de micro-parche como evidencia;
- no tocar Scala_Labs-main, porque pertenece a otro producto.

## Higiene de los documentos

El directorio está bajo una configuración que puede desplegar archivos estáticos. Los documentos de plan, evidencias y nombres de fixture deben usar datos sintéticos. Nunca incluir PHI, secretos, credenciales, claves, URLs privadas ni capturas con información real.

## Gate de salida

Un micro-parche se rechaza automáticamente si:

- cambia el hash de núcleo congelado;
- cambia la asignación de muestra;
- cambia algún caso golden;
- añade una llamada de red, almacenamiento o dependencia;
- modifica más de un objetivo técnico.

Para un lote de migración, el gate equivalente es: contrato HTTP versionado, pruebas unitarias Python, matriz golden, comparación de estado final y prueba visual/PDF aprobadas. Ver capítulo 13.
