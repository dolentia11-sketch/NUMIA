---
owner: Engineering Lead
approver: Product Owner
status: obligatorio antes de cada lote
---

# 01. Baseline e inventario reproducible

## Objetivo

Establecer una referencia comprobable antes de editar. Ningún agente empieza un cambio con una fuente distinta, un archivo duplicado o un estado visual no documentado.

## Fuente canónica

| Rol | Ruta |
|---|---|
| Fuente de referencia de paridad | C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\index.html |
| Informe de comportamiento | C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\INFORME_LOGICA_MATEMATICA_NUMIA.md |
| Directorio de planes | C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\plan paso a paso numia |

Antes de migrar, registrar el SHA-256 del HTML de referencia y crear una copia de sólo lectura fuera del árbol de salida. No inferir que la copia bajo `Documents\New project` es equivalente: el 8 de septiembre de 2026 ambos archivos existen y el HTML de Escritorio es la referencia declarada por el propietario.

## Inventario de responsabilidades

| Área | Ancla principal | Estado |
|---|---|---|
| Estado en memoria | STATE, 2402–2409 | Congelado |
| Datos de muestra | SAMPLE_PATIENTS/SAMPLE_AUX, 2444–2461 | Congelado |
| Fórmulas y motor | scoreBarthel a getMetrics, 2476–2702 | Congelado |
| Render de listas | renderPatients/renderAuxiliaries, 2741–2898 | Solo presentación |
| Captura | modales, controles y save*, 2904–3056 | Mejora permitida condicionada |
| PDF | 3088–3385 | Contenido congelado; estabilidad permitida |
| Onboarding y modales | 3409–3457 | Accesibilidad permitida |
| Canvas y resize | 3459–3846 | Rendimiento/accesibilidad permitidos |

## Preflight obligatorio

1. Confirmar existencia del archivo canónico y plan.
2. Calcular SHA-256 completo del archivo.
3. Calcular hash del núcleo lógico con el comando del capítulo 00.
4. Abrir el MVP mediante servidor estático local; no modificar archivos de aplicación para servirlo.
5. Cargar “Datos de ejemplo”.
6. Ejecutar balanceo y registrar: cobertura, alertas, asignaciones y estado por auxiliar.
7. Exportar PDF y comprobar que descarga un archivo no vacío.
8. Ejecutar la matriz del capítulo 02.
9. Guardar evidencia en una copia del template de regresión.

## Comandos de lectura seguros

~~~powershell
$appRoot = 'C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA'
Get-FileHash -LiteralPath (Join-Path $appRoot 'index.html') -Algorithm SHA256
rg -n 'function (scoreBarthel|scoreBraden|patientScore|auxiliaryProfile|isEligible|autoBalance|getMetrics)' (Join-Path $appRoot 'index.html')
python -m http.server 8080 --directory $appRoot
~~~

Abrir después:

    http://localhost:8080/

## Snapshot mínimo de evidencia

| Evidencia | Resultado esperado |
|---|---|
| Hash completo | SHA-256 registrado con fecha. |
| Hash lógico | Idéntico al baseline de la tarea. |
| Captura con datos de ejemplo | Ocho pacientes, cinco auxiliares. |
| Resultado de balanceo | Cobertura 100%, cero sin asignar, cero sobrecargas. |
| PDF | Archivo descargado y legible. |
| Navegador | Versión, sistema operativo y ancho de ventana. |

## Outputs

- Registro de baseline.
- Hash completo y hash lógico.
- Resultado de los casos golden.
- Capturas antes de cualquier cambio.
- Lista de archivos tocables y congelados.

## Gate de salida

Solo se puede iniciar un micro-parche si el baseline pasa y las dos copias de referencia no presentan una ambigüedad no resuelta.
