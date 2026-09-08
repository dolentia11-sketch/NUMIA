---
owner: QA Lead
approver: Product Owner
status: obligatorio antes de entregar
---

# 08. Criterios de aceptación y release

## Objetivo

Convertir “se ve mejor” en una decisión verificable. El MVP solo se entrega si mantiene comportamiento y evidencia suficiente.

## Gate A — Integridad de alcance

| Comprobación | Requerido |
|---|---|
| Se modificó solo index.html o documentación de plan autorizada | Sí |
| No se tocó Scala_Labs-main | Sí |
| No se tocó NUMIA_SaaS_Plan_Paso_a_Paso.md | Sí |
| No hay backend/API/persistencia/dependencia nueva | Sí |
| No se ejecutó Git en root incorrecto | Sí |
| No se incluyó PHI, secretos o credenciales | Sí |

## Gate B — Núcleo inmutable

| Comprobación | Requerido |
|---|---|
| Hash lógico normalizado coincide | Sí |
| Bandas Barthel, Braden, bronco y peso pasan | Sí |
| Tipos, cupos, cap10 y cap20 conservan resultado | Sí |
| Elegibilidad y unidades conservan resultado | Sí |
| Orden/rank/desempate de balanceo conserva resultado | Sí |
| Datos de ejemplo conservan asignación exacta | Sí |
| Rebalanceo conserva comportamiento | Sí |

## Gate C — Veracidad visual

| Caso | Requerido |
|---|---|
| Cobertura 100 con overload | No se llama óptima y alerta es visible. |
| Más de 100% clínico | Se muestra valor real, no se disimula con 100%. |
| Braden 12 | Ayuda, preview y código comunican 2 puntos. |
| Estado efímero | Se comunica sin introducir persistencia. |
| PDF | Se genera localmente y refleja datos del turno. |

## Gate D — Interacción

| Flujo | Requerido |
|---|---|
| Onboarding y ambos consentimientos | Conservan condición de aceptación. |
| Alta paciente/auxiliar | Validación, foco y error no mutan STATE. |
| Balancear | Conserva resultado golden. |
| Eliminar/limpiar | Confirmación, cancelación segura y efecto actual tras confirmar. |
| Modal | Foco atrapado, Escape, retorno de foco y controles ocultos no tabulables. |
| Canvas/resumen | Información crítica disponible sin mouse. |
| Móvil | Acciones esenciales siguen presentes a 320/390 px. |

## Gate E — Estabilidad

| Prueba | Criterio |
|---|---|
| Consola | Cero errores nuevos no controlados. |
| Red | No salen datos de pacientes/auxiliares. |
| Almacenamiento | No se introduce almacenamiento clínico. |
| Resize | Canvas termina en estado correcto. |
| Movimiento reducido | No hay animación innecesaria y datos siguen visibles. |
| PDF | Cabecera PDF correcta y descarga estable. |

## Gate F — Revisión humana

Antes de mostrar el MVP:

1. Cargar ejemplo y revisar las 8 asignaciones.
2. Ejecutar el caso de sobrecarga.
3. Recorrer onboarding, formulario, ayuda y eliminación solo con teclado.
4. Probar 1440, 768, 390 y 320 px.
5. Descargar PDF de ejemplo.
6. Leer cada texto modificado para comprobar que no haya claim clínico/regulatorio indebido.

## Decisión de release

| Estado | Definición |
|---|---|
| Aprobado | Todos los gates obligatorios pasan y evidencia adjunta. |
| Condicionado | Solo defectos P3 abiertos, documentados y aceptados. |
| Bloqueado | Falla de lógica, seguridad, accesibilidad crítica, PDF o alcance. |
| Revertido | El micro-parche no cumple no regresión. |

## Output

Completar [templates/TEMPLATE_RELEASE.md](templates/TEMPLATE_RELEASE.md) y dejar la decisión firmada por QA y Product Owner.

