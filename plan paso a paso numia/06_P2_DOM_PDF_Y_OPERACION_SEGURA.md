---
owner: Frontend Lead
approver: Product Owner y QA Lead
priority: P0/P2
depends_on: [00_CONTRATO_DE_INMUTABILIDAD, 01_BASELINE_E_INVENTARIO, 02_MATRIZ_REGRESION_GOLDEN]
---

# 06. DOM, PDF y operación segura

## Objetivo

Eliminar mensajes engañosos y acciones destructivas inseguras de la interfaz, preservando el algoritmo y sus estados.

## A. P0 — Nunca llamar “óptima” a una sobrecarga

### Defecto reproducido

El algoritmo permite sobrepasar careCapacity porque esta capacidad es un ranking blando. Si cobertura es 100%, render en línea baseline 2722 muestra “distribución óptima”, aunque getMetrics reporta overload.

Caso de prueba:

- un auxiliar de 75 kg, Tipo 3 y capacidad de cuidado 17;
- cuatro pacientes de 80 kg, Barthel 0, Braden 6 y tres flags bronco;
- los cuatro son elegibles y se asignan;
- carga final: 18/17 unidades, estado overload, cobertura 100%.

### Cambio permitido

Cambiar únicamente copy de presentación:

- KPI de cobertura: “cobertura total con alerta” cuando coverage es 100 y overloaded es mayor que 0;
- Toast de balanceo: no usar “óptimamente” si existe overload;
- conservar exactamente assignments, coverage, alerts, overload y cálculo de rank.

### No tocar

- autoBalance salvo el literal de mensaje estrictamente necesario;
- careCapacity, projectedCarePct, rank, isEligible y getMetrics;
- criterio que clasifica overload.

### Aceptación

| ID | Resultado |
|---|---|
| OVLD-001 | Caso de sobrecarga mantiene 4 asignaciones y cobertura 100. |
| OVLD-002 | Caso de sobrecarga muestra alerta y no usa “óptima/óptimamente”. |
| OVLD-003 | Dataset de ejemplo sin overload puede conservar mensaje actual. |
| OVLD-004 | Hash lógico normalizado y golden de asignación no cambian. |

## B. P0 — No ocultar porcentaje clínico por truncamiento

### Defecto reproducido

En renderAuxiliaries, baseline 2844–2845 calcula:

- porcentaje de cupos;
- porcentaje clínico limitado a 100.

La barra representa solo cupos. En el caso 18/17 unidades y 4/10 cupos, la interfaz enseña sobrecarga pero puede mostrar “clínica 100%” y barra 40%, ocultando 105.9%.

### Cambio permitido

- Mostrar porcentaje clínico real redondeado, por ejemplo 106%, sin truncarlo a 100.
- Visualizar la mayor carga entre cupo y clínica, o dos indicadores claramente diferenciados.
- Mantener estado, umbrales y recomendación existentes.

### No tocar

- Fórmula de countPct/carePct;
- status overload/full;
- capacidad de cuidado;
- algoritmo de balanceo.

### Aceptación

| ID | Resultado |
|---|---|
| LOAD-001 | Caso 18/17 presenta al menos 106% clínico. |
| LOAD-002 | Estado continúa siendo overload. |
| LOAD-003 | Dataset de ejemplo conserva sus cantidades, estados y asignaciones. |
| LOAD-004 | Barra/leyenda no presenta una carga inferior como si fuera la carga principal. |

## C. P2 — Seguridad de contenido dinámico

### Estado actual

La mayoría de valores dinámicos se escapan con escapeHtml antes de llegar a innerHTML. Esto debe conservarse.

### Regla

- No eliminar escapeHtml.
- Todo nuevo texto recibido de paciente, auxiliar o input pasa por escapeHtml antes de innerHTML.
- No usar eval, insertAdjacentHTML con datos no escapados ni handlers creados desde input.
- Si se sustituye una zona por createElement/textContent, hacerlo en una sola superficie y pasar pruebas de listado/PDF.

### Pruebas

| ID | Input | Resultado |
|---|---|---|
| DOM-001 | Nombre con etiqueta img y handler de error | Se renderiza literal; no ejecuta script. |
| DOM-002 | Nombre con comillas y etiquetas | No rompe tarjeta ni atributo. |
| DOM-003 | Nombre escapado en PDF | Texto visible; no hay HTML ejecutable. |

## D. P2 — Acciones destructivas

### Cambios permitidos

- Pedir confirmación accesible antes de Limpiar turno.
- Pedir confirmación antes de eliminar paciente/auxiliar si el producto lo aprueba.
- Si usuario cancela, no mutar estado, no rebalancear y devolver foco.
- Si usuario confirma, conservar exactamente el efecto actual de clearData/removePatient/removeAux.

### No tocar

- Condiciones de rebalanceo;
- orden de eliminación;
- toasts de resultado posteriores a confirmación.

## E. P2 — Exportación responsable

Antes de exportar, se puede advertir que el PDF contiene datos del turno y que requiere revisión cuando hay alertas. La advertencia:

- no cambia createReportPages;
- no bloquea exportación salvo confirmación de usuario;
- no afirma una conclusión clínica nueva;
- no persiste datos.

## Outputs

- Caso de sobrecarga reproducible.
- Evidencia visual antes/después de copy y porcentaje.
- Pruebas XSS de nombre.
- Pruebas de confirmación destructiva.
- Golden completo y PDF válido.

## Gate de salida

No se acepta una mejora que modifique la asignación del caso de sobrecarga, transforme una alerta en bloqueo clínico, o cambie el contenido numérico del PDF.
