---
owner: Engineering Lead
approver: QA Lead
status: obligatorio por cambio
---

# 07. Protocolo de micro-parche

## Objetivo

Hacer cambios pequeños, trazables y reversibles sin alterar el MVP. Un micro-parche resuelve una debilidad concreta; no es una oportunidad de limpieza general.

## Reglas no negociables

- Un micro-parche tiene un solo ID de backlog.
- Modifica como máximo una preocupación: validación, copy, foco, semántica, rendimiento visual o descarga.
- No cambia bloques congelados salvo la excepción textual documentada en el capítulo 00.
- No mezcla reformat masivo, renombres, comentarios no relacionados o archivos ajenos.
- No se utiliza Git desde este directorio.
- No se toca el archivo histórico de plan SaaS ni Scala_Labs-main.

## Paso 0 — Leer antes de editar

1. Leer README, capítulo 00 y el item concreto de backlog.
2. Confirmar que la tarea está clasificada como permitida.
3. Si hay duda sobre lógica, detener y preguntar; no inferir autorización.
4. Leer las funciones vecinas, no solo la línea objetivo.

## Paso 1 — Crear evidencia previa

Usar una copia temporal fuera del runtime del MVP. No almacenar PHI ni secretos.

~~~powershell
$appRoot = 'C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA'
$sourcePath = Join-Path $appRoot 'index.html'
$scratchRoot = Join-Path $env:TEMP ('numia-mvp-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $scratchRoot | Out-Null
$beforePath = Join-Path $scratchRoot 'index.before.html'
Copy-Item -LiteralPath $sourcePath -Destination $beforePath
Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256
~~~

Guardar en el manifiesto:

- ID de backlog;
- hash completo;
- hash lógico normalizado;
- navegador y viewport;
- defecto reproducido;
- resultado de casos golden relevantes.

## Paso 2 — Reproducir

1. Servir el directorio estático localmente.
2. Reproducir el defecto con datos sintéticos.
3. Capturar el resultado visible, no solo una lectura del código.
4. Comprobar consola: no aceptar excepción previa no documentada.

~~~powershell
$appRoot = 'C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA'
python -m http.server 8080 --directory $appRoot
~~~

## Paso 3 — Escribir la prueba antes del parche

La prueba puede ser:

- un checklist manual preciso;
- una prueba de navegador externa al runtime;
- una matriz de entrada/salida;
- una captura antes/después de un defecto visual;
- una comprobación de hash/PDF.

La prueba debe fallar antes y pasar después. No modificar expectativas golden para acomodar el parche.

## Paso 4 — Aplicar cambio mínimo

1. Editar solo el archivo canónico, normalmente index.html.
2. Aplicar un patch localizado; no reescribir el documento entero.
3. Mantener indentación y estilo cercano.
4. No mover las funciones congeladas.
5. No cambiar string clínico o regla salvo que el backlog lo autorice explícitamente.

## Paso 5 — Revisión de diff sin Git

~~~powershell
$beforeLines = Get-Content -LiteralPath $beforePath
$afterLines = Get-Content -LiteralPath $sourcePath
Compare-Object -ReferenceObject $beforeLines -DifferenceObject $afterLines -SyncWindow 3
~~~

Revisar manualmente:

- el diff corresponde a una sola tarea;
- no aparece fetch, XMLHttpRequest, WebSocket, localStorage, sessionStorage, IndexedDB, cookie, token, clave o dependencia;
- no aparecen cambios en funciones L-01 a L-15;
- no se modifican datos de muestra.

## Paso 6 — Ejecutar verificación

| Grupo | Obligatorio |
|---|---|
| Hash de núcleo normalizado | Sí |
| Casos golden clínicos | Sí |
| Turno de ejemplo | Sí |
| Caso de sobrecarga | Sí si se toca UI de carga/copy |
| Flujo de navegador afectado | Sí |
| Console/page errors | Cero nuevos |
| PDF | Sí si se toca exportación, datos, copy de reporte o render |
| Teclado/lector | Sí si se toca modal, formulario, control o toast |
| Móvil | Sí si se toca CSS, navegación o layout |

## Paso 7 — Cerrar o revertir

Cerrar solo con una copia de [templates/TEMPLATE_MICROPATCH.md](templates/TEMPLATE_MICROPATCH.md) completa.

Revertir si:

- falla una salida golden;
- cambia el hash lógico fuera de excepción permitida;
- se modifica arquitectura;
- no puede demostrarse que la mejora resolvió el defecto;
- aparece una regresión visual, de PDF, teclado o consola.

## Regla de rollback

Revertir exclusivamente el bloque introducido por el micro-parche, usando la copia temporal como referencia. Nunca usar reset global, checkout destructivo o borrado de archivos de usuario.

## Output

- Un manifiesto de micro-parche.
- Captura/resultado antes y después.
- Resultados de tests.
- Diff revisado.
- Decisión: aprobado, revertido o bloqueado.
