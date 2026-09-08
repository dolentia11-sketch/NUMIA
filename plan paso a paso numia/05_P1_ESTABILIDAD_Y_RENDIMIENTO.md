---
owner: Frontend Lead
approver: QA Lead
priority: P1
depends_on: [00_CONTRATO_DE_INMUTABILIDAD, 01_BASELINE_E_INVENTARIO, 02_MATRIZ_REGRESION_GOLDEN]
---

# 05. Estabilidad y rendimiento visual

## Objetivo

Reducir trabajo innecesario de interfaz y riesgos de descarga sin tocar el motor ni cambiar los datos presentados.

## Alcance permitido

| Zona | Líneas baseline | Mejora admisible |
|---|---:|---|
| URL de descarga PDF | 3378–3384 | Liberar URL de forma diferida y segura. |
| Resize | 3837–3840 | Consolidar múltiples resize en un frame. |
| Ambient canvas | 3459–3491 | Respetar reduced motion/visibilidad de página. |
| Matchfield canvas | 3493–3799 | Respetar reduced motion/visibilidad sin cambiar nodos o vínculos. |
| CSS de transición | 990–1032 y estilos visuales | Desactivar animación no esencial cuando el usuario lo pide. |

## No tocar

- Cálculo de posiciones del canvas que derive de pacientes/auxiliares.
- Colores asociados a riesgo.
- Llamadas a isEligible al dibujar líneas.
- Comportamiento por defecto de requestAnimationFrame cuando no hay preferencia reducida.
- Contenido, métricas o estructura numérica del PDF.

## Micro-parche REND-001 — Resize con requestAnimationFrame

### Problema

Cada evento resize dispara resizeAmbient y resizeMatchfield de inmediato. En una ventana redimensionada puede haber muchos eventos consecutivos.

### Implementación permitida

- Añadir un único flag de frame pendiente.
- En resize, programar un requestAnimationFrame.
- Dentro del frame, ejecutar exactamente resizeAmbient y resizeMatchfield una vez.
- No cambiar las funciones llamadas ni sus argumentos.

### Aceptación

- Tras terminar resize, canvas tiene las mismas dimensiones y nodos que baseline.
- No hay errores en consola.
- La asignación, métricas y preview no cambian.

## Micro-parche REND-002 — Preferencia de movimiento reducido

### Implementación permitida

- Leer matchMedia para prefers-reduced-motion.
- Si es reduce, dibujar estado estático inicial y evitar bucles de animación continuos.
- Si no es reduce, conservar animaciones actuales.
- Reaccionar a cambio de preferencia sin tocar STATE.

### Aceptación

- Con reduce, no se ejecutan ciclos visuales continuos innecesarios.
- Con no-preference, apariencia y comportamiento baseline se conservan.
- El canvas mantiene sus datos, resumen y asignaciones.

## Micro-parche REND-003 — Descarga PDF robusta

### Problema

La URL del Blob se revoca inmediatamente después de anchor.click en la línea baseline 3383. En algunos entornos esto puede competir con la descarga.

### Implementación permitida

- Mantener mismo Blob, nombre de archivo y click.
- Revocar URL después de la siguiente tarea/event loop, no antes.
- No cambiar contenido del PDF ni introducir biblioteca.

### Aceptación

- Archivo conserva nombre numia-distribucion-fecha.pdf.
- Primeros bytes siguen siendo %PDF-1.4.
- PDF de turno ejemplo conserva valores y filas esperadas.
- No queda URL viva después de descarga.

## Micro-parche REND-004 — Pestaña en segundo plano

Solo después de REND-002 y con reproducción medida:

- Pausar redibujo visual cuando document.visibilityState es hidden.
- Al volver visible, redibujar una vez y continuar solo cuando corresponde.
- No detener toasts, balanceo, formularios ni exportación.

## Medición obligatoria

| Prueba | Evidencia |
|---|---|
| Resize 10 segundos | Captura de performance y ausencia de errores. |
| Modo movimiento reducido | Captura y comportamiento estático. |
| Pestaña oculta/visible | No hay freeze lógico ni canvas vacío persistente. |
| PDF | Archivo y comprobación de encabezado. |
| Turno ejemplo | Golden completo. |

## Outputs

- Antes/después de performance visual.
- Resultado del test de reduced motion.
- PDF de referencia con hash/byte-size.
- Resultado golden idéntico.

## Gate de salida

El parche se revierte si el canvas muestra conexiones distintas con el mismo estado, el PDF cambia contenido o la interfaz deja de actualizar después de volver de segundo plano.

