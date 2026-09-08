# 11. Auditoría de estado — 8 de septiembre de 2026

## Dictamen

El producto es funcional como MVP estático, pero no está separado por responsabilidades. `index.html` (150 227 bytes; SHA-256 `64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6`) contiene interfaz, CSS, estado, reglas clínicas, algoritmo, render, canvas y PDF. No hay backend, API ni persistencia.

La migración debe preservar el HTML como oráculo: para una entrada válida y el mismo orden de listas, la clasificación, asignación, métricas, textos y PDF deben coincidir.

## Evidencia observada

| Área | Estado | Evidencia |
|---|---|---|
| UI | Completa, en un HTML | CSS embebido y DOM entre el inicio y la línea 2446. |
| Estado | Sólo memoria | `STATE` en línea 2448; se pierde al recargar. |
| Motor | JavaScript embebido | `scoreBarthel` a `getMetrics`, líneas 2522–2748. |
| Balanceo | Determinista voraz | `autoBalance`, líneas 2623–2694. |
| Reporte | Local en canvas/PDF | `createReportPages`, `makePdfFromCanvases`, `exportReportPdf`. |
| Integraciones | Ninguna de datos | No se encontró `fetch`, `XMLHttpRequest`, almacenamiento web ni API. |

## Riesgos técnicos priorizados

1. Una regla clínica duplicada en frontend y backend puede divergir. El backend Python será la única autoridad de cálculo tras MIG-040.
2. El estado mutable, la lógica y el render están acoplados; hoy no existen pruebas automatizadas del motor. Se mitiga con fixtures y `pytest` antes de integrar HTTP.
3. El HTML usa manejadores inline y `innerHTML`. No se reescriben en esta iniciativa porque cambiarían innecesariamente la interfaz; se documentan como deuda técnica posterior.
4. Los datos son clínicos potenciales. La primera arquitectura será sin persistencia y sólo para entorno local/controlado. No afirmar cumplimiento regulatorio.
5. Existe otra copia bajo `Documents\New project` y el plan antiguo la nombraba como canónica. No es equivalente al HTML de Escritorio; la referencia explícita de esta iniciativa es Escritorio.

## Límites de la iniciativa

- Se conservan Barthel, Braden, broncoaspiración, peso, cap10, cap20 calculado, tipo, cupos, ranking, desempate, ejemplos y PDF.
- No se activa cap20, no se endurece `careCapacity`, no se añade IA, usuarios, base de datos, autenticación ni multitenencia.
- No se entrega migración en este lote de auditoría; este documento y los capítulos 12–13 son el plan ejecutable.
