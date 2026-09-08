---
owner: Frontend Lead
approver: Product Owner
priority: P0/P1
depends_on: [00_CONTRATO_DE_INMUTABILIDAD, 01_BASELINE_E_INVENTARIO, 02_MATRIZ_REGRESION_GOLDEN]
---

# 04. Accesibilidad y UX sin tocar decisiones clínicas

## Objetivo

Hacer que el MVP se pueda usar con teclado, lector de pantalla, viewport móvil y condiciones de movimiento reducido, sin alterar datos, cálculos ni asignaciones.

## Regla de alcance

Esta sección solo cambia semántica HTML, CSS de visibilidad/foco, gestión de foco, mensajes de interfaz y controles visuales. Nunca cambia STATE, la lista de cinco riesgos bronco, ni funciones de cálculo.

## A. P0 — Modales y onboarding realmente cerrados

### Debilidad observada

Los elementos **modal-backdrop** y **onboarding-backdrop** usan opacity 0 y pointer-events none entre las líneas baseline 990–1015. Eso los hace invisibles, pero no necesariamente los saca del orden de tabulación. Al cerrar onboarding con la clase hidden, sus controles también pueden permanecer alcanzables.

### Cambio permitido

- Aplicar hidden, inert y aria-hidden coherentes a dialogos/onboarding cerrados.
- Al abrir: quitar hidden/inert, establecer aria-hidden falso, enfocar elemento inicial.
- Al cerrar: añadir hidden/inert, aria-hidden verdadero y devolver foco al botón activador.
- Mientras un modal está abierto, volver inerte el fondo de la aplicación.
- Agregar foco atrapado en Tab y Shift+Tab dentro del diálogo activo.

### No tocar

- texto de términos;
- condición de aceptación de ambos consentimientos;
- flujo **goToScreen**;
- contenido clínico del formulario.

### Casos de aceptación

| ID | Resultado |
|---|---|
| A11Y-001 | Con modal cerrado, Tab no llega a sus inputs/botones invisibles. |
| A11Y-002 | Abrir “Registrar paciente” enfoca nombre. |
| A11Y-003 | Tab y Shift+Tab no salen del modal. |
| A11Y-004 | Escape cierra y devuelve foco a “Añadir paciente”. |
| A11Y-005 | Abrir onboarding hace inerte el dashboard. |
| A11Y-006 | Cerrar onboarding elimina sus controles del tabulador. |

## B. P0 — Consentimientos y bronco con controles nativos

### Debilidad observada

- Consentimientos: labels con onclick, baseline 1981–1989 y **toggleConsent** 3417–3421.
- Bronco: div con onclick, baseline 2904–2915 y **toggleBronco** 2949–2954.

### Cambio permitido

Preferir inputs checkbox nativos:

- cada consentimiento conserva sus IDs c1/c2, valor y condición actual;
- cada factor bronco conserva índice 0–4, orden y llamada a toggleBronco;
- agrupar bronco en fieldset con legend;
- sincronizar checked con STATE.formBroncoFlags; un checkbox nativo no requiere aria-checked manual;
- usar Space/Enter mediante comportamiento nativo.

### No tocar

- BRONCO_ITEMS, títulos, hints, iconos, orden o número de factores;
- conteo de flags;
- **scoreBronco** y cálculo de preview.

### Casos de aceptación

| ID | Resultado |
|---|---|
| A11Y-007 | Tab + Space activa y desactiva ambos consentimientos. |
| A11Y-008 | El botón de aceptación sigue deshabilitado hasta ambos checks. |
| A11Y-009 | Los cinco bronco se navegan por teclado y reflejan estado visible/programático. |
| A11Y-010 | Cambiar bronco actualiza exactamente el preview antes existente. |

## C. P1 — Formularios, mensajes y nombres accesibles

### Cambios permitidos

- Encapsular controles de paciente/auxiliar en form semántico con submit controlado que invoque el mismo guardado.
- Asociar labels mediante for/id y rangos mediante aria-describedby.
- Añadir aria-label a iconos de eliminar, incluyendo nombre escapado.
- Convertir toast-container en región viva: status para éxito y alert para error.
- Crear foco visible común para botones, navegación y controles.
- Añadir skip link, main-content y nombres de navegación.

### Casos de aceptación

| ID | Resultado |
|---|---|
| A11Y-011 | Enter en formulario válido guarda exactamente una vez. |
| A11Y-012 | Cada input anuncia nombre, tipo, rango y error si existe. |
| A11Y-013 | Toast de error/éxito se anuncia sin mover foco innecesariamente. |
| A11Y-014 | Iconos de eliminar tienen nombre accesible único. |
| A11Y-015 | Skip link lleva al main y foco es visible. |

## D. P1 — Canvas y navegación móvil

### Cambios permitidos

- Tratar el canvas como decoración mediante aria-hidden.
- Añadir un resumen DOM alternativo y accesible de asignaciones, alertas y pacientes sin asignar.
- En móvil, exponer ayuda, tour y limpiar turno mediante una barra de acciones equivalente a la barra lateral oculta.
- No cambiar nodos, líneas, elegibilidad visual ni cálculos de canvas.

### Casos de aceptación

| ID | Resultado |
|---|---|
| A11Y-016 | Lector de pantalla puede acceder a resumen textual sin usar hover. |
| A11Y-017 | A 320 y 390 px existen acciones de Ayuda, Tour y Limpiar. |
| A11Y-018 | El resumen textual coincide con asignaciones golden. |

## E. P2 — Inclusión visual y movimiento

| Mejora | Regla |
|---|---|
| Contraste de texto secundario | Verificar AA sobre fondo real antes de cambiar variables CSS. |
| Objetivos táctiles | Botones icono con tamaño cercano a 44 × 44 sin alterar su acción. |
| Movimiento reducido | Respetar prefers-reduced-motion y mostrar estado estático equivalente. |
| PDF visual | No declararlo accesible; mantener alternativa textual de resumen. |
| Estado efímero | Mostrar aviso visible de que recargar elimina el turno; no añadir localStorage. |

## Outputs

- Matriz de tabulación antes/después.
- Pruebas de teclado para onboarding, modal paciente, modal auxiliar, ayuda, limpieza y exportación.
- Auditoría de lector de pantalla documentada.
- Capturas de 1440, 768, 390 y 320 px.
- Resultado golden sin cambios.

## Gate de salida

No se cierra la mejora si Tab alcanza un control oculto, el foco se pierde, un lector no puede comprender un control crítico o una acción del móvil desaparece.
