---
owner: Product Owner
approver: QA Lead
status: backlog maestro
---

# 09. Backlog secuenciado de mejora del MVP

## Estado comprobado tras AUDIT-100

- MIG-000: snapshot idéntico y evidencia de escritorio, móvil y dos páginas del PDF de muestra disponibles; no implica paridad de un frontend migrado.
- MIG-010: dominio auditado, dos errores del portado corregidos, 100 turnos y 20 pruebas aprobados. La ejecución actual es `unittest`; el gate literal de `pytest` del plan aún no está configurado.
- MIG-020 a MIG-050: pendientes. Primero resolver las discrepancias de contrato del [capítulo 14](14_AUDITORIA_MOTOR_PYTHON_100_CASOS.md).
- Rechazo de entradas inválidas y referencias inexistentes: aprobado por el propietario e implementado en la frontera del dominio; pendiente mapear a HTTP 422.

Esta auditoría no modifica la arquitectura objetivo ni las reglas clínicas.

## Regla de ejecución

Ejecutar exactamente un item por micro-parche. No adelantar un item dependiente. Si un item requiere cambiar motor o arquitectura, se marca BLOQUEADO y no se implementa.

La siguiente iniciativa de migración tiene autorización expresa y usa el protocolo de `13_PLAN_DE_MIGRACION_PASO_A_PASO.md`, no el de micro-parches.

| Orden | ID | Prioridad | Entrega | Gate de salida |
|---:|---|---|---|---|
| M0 | MIG-000 | P0 | Baseline de Escritorio y fixtures de paridad. | SHA registrado, golden verde y referencia inmutable. |
| M1 | MIG-010 | P0 | Motor Python puro. | `pytest` y golden idénticos. |
| M2 | MIG-020 | P0 | API FastAPI sin estado ni persistencia. | Contrato y errores validados. |
| M3 | MIG-030 | P0 | Frontend separado sin cambio visual. | DOM/CSS/flujo comparables. |
| M4 | MIG-040 | P0 | Adaptador HTTP y eliminación de cálculo duplicado. | Paridad E2E, PDF y consola limpia. |
| M5 | MIG-050 | P0 | Release local empaquetado. | Todos los gates y rollback comprobado. |

| Orden | ID | Prioridad | Zona baseline | Cambio permitido | Prueba de salida |
|---:|---|---|---|---|---|
| 0 | BASE-001 | P0 | Ninguna | Hash, inventario, golden y evidencia previa. | Baseline completo. |
| 1 | QA-001 | P0 | Fuera del runtime | Crear matriz manual/externa de regresión. | Golden de ejemplo y límites. |
| 2 | COPY-001 | P0 | 2371 | Corregir ayuda Braden de 13–15 a 12–15. | 11→3, 12→2, 15→2, 16→1. |
| 3 | COPY-002 | P0 | 2646, 2722 | Quitar afirmación “óptima” cuando hay overload. | Caso 18/17 sin cambio de asignación. |
| 4 | COPY-003 | P0 | 2844–2871 | Mostrar porcentaje clínico real y carga principal clara. | Caso 18/17 muestra 106% aprox. |
| 5 | VAL-001 | P0 | 2245–2329, 3013–3056 | Rechazar valores inválidos antes del motor. | VAL-001 a VAL-010. |
| 6 | A11Y-001 | P0 | 990–1015, 2918–2947, 3808–3849 | hidden/inert, foco atrapado y retorno. | A11Y-001 a A11Y-006. |
| 7 | A11Y-002 | P0 | 1981–1989, 2904–2916, 3417–3421 | Consentimientos/bronco semánticos y teclado. | A11Y-007 a A11Y-010. |
| 8 | SAFE-001 | P1 | 3078–3086, 3433–3444 | Confirmar limpiar/cargar ejemplo si sobrescribe datos. | Cancelar no muta; confirmar conserva efecto. |
| 9 | COPY-004 | P1 | 1912–1913, 1951–1957, 2320–2321 | Corregir claims demo/locales e ID auxiliar. | Copy coherente; golden intacto. |
| 10 | A11Y-003 | P1 | 2057–2120, 2232–2399, 3387–3407 | Labels, focus visible, live region, skip link, icon labels. | A11Y-011 a A11Y-015. |
| 11 | A11Y-004 | P1 | 1732–1748, 2183–2199, 3532–3552 | Acciones móviles y resumen textual canvas. | A11Y-016 a A11Y-018. |
| 12 | REND-001 | P1 | 3378–3384, 3837–3840 | Descargar robusto y resize en frame. | PDF y resize sin regresión. |
| 13 | REND-002 | P2 | 3459–3799 | Movimiento reducido y pestaña oculta. | Canvas estable y golden intacto. |
| 14 | DOM-001 | P2 | 2466–2474, renders | Pruebas de escape y revisión puntual. | DOM-001 a DOM-003. |
| 15 | SAFE-002 | P2 | 3059–3075 | Confirmar eliminación. | Cancelar y confirmar correctos. |
| 16 | REL-001 | P0 | Ninguna | Ejecutar gates, capturas y release. | Checklist aprobado. |

## Tareas explícitamente bloqueadas

| ID | Solicitud posible | Razón de bloqueo |
|---|---|---|
| BLOCK-001 | Activar cap20 | Cambia elegibilidad clínica. |
| BLOCK-002 | Volver dura careCapacity | Cambia algoritmo y resultados. |
| BLOCK-003 | Elegir estrategia de balanceo | Cambia arquitectura y lógica. |
| BLOCK-004 | Guardar datos al recargar | Añade persistencia y riesgo de privacidad. |
| BLOCK-005 | Agregar API/backend/SaaS | Cambia arquitectura. |
| BLOCK-006 | Migrar a React/Vue | Cambia arquitectura. |
| BLOCK-007 | Alterar datos muestra | Rompe oráculo de regresión. |

## Priorización

P0 se completa antes de demo o prueba con usuarios. P1 se completa antes de uso clínico supervisado. P2 mejora calidad, pero jamás se usa para justificar retraso de P0 o cambios en el motor.

## Output

Para cada fila cerrada: manifiesto, prueba, hash, captura, decisión y rollback. El backlog solo se reordena por Product Owner y nunca por conveniencia de refactor.
