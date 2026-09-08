# 10. Handoff literal para agentes de código

## Selección obligatoria de modo

Antes de actuar, declarar `MANTENIMIENTO` o `MIGRACION_PARIDAD`. Para `MIGRACION_PARIDAD`, este capítulo sustituye la prohibición histórica de backend: leer 11, 12 y 13; trabajar sólo un ID `MIG-*`; usar Python/FastAPI sin base de datos; y conservar la paridad clínica, operativa, textual, visual y PDF del `index.html` de Escritorio. No seguir `NUMIA_SaaS_Plan_Paso_a_Paso.md`.

## Instrucción maestra (sólo MANTENIMIENTO)

Copia este texto al iniciar cualquier tarea de mejora del MVP:

> Trabaja exclusivamente sobre C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\index.html. Antes de editar, lee README.md, 00_CONTRATO_DE_INMUTABILIDAD.md, 01_BASELINE_E_INVENTARIO.md, 02_MATRIZ_REGRESION_GOLDEN.md y el único item elegido en 09_BACKLOG_SECUENCIADO.md dentro de C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA\plan paso a paso numia. No cambies la arquitectura ni la lógica matemática. No agregues backend, API, persistencia, framework, paquetes, módulos, archivos JavaScript, localStorage, bases de datos, autenticación, hospital_id ni dependencias. No modifiques scoreBarthel, scoreBraden, scoreBronco, scoreWeight, patientScore, auxiliaryProfile, isEligible, careUnitsForPatient, careCapacityForAuxiliary, autoBalance, getMetrics, STATE, datos de muestra o PDF numérico. Trabaja en un solo micro-parche permitido. Usa evidencia antes/después, conserva todos los casos golden y detente si aparece una necesidad clínica o arquitectónica. No uses Git porque el root actual está fuera del proyecto. No edites Scala_Labs-main ni NUMIA_SaaS_Plan_Paso_a_Paso.md. No incluyas PHI, secretos, claves ni URLs privadas en archivos o evidencia.

## Algoritmo de trabajo

### 1. Elegir trabajo

- Abrir el backlog.
- Tomar el primer item no cerrado cuyas dependencias estén aprobadas.
- Si no es claramente permitido, responder BLOQUEADO y explicar qué autorización falta.

### 2. Preflight

Ejecutar:

    Get-FileHash index.html -Algorithm SHA256

Calcular hash lógico normalizado desde el capítulo 00. Cargar datos de ejemplo, guardar la matriz de asignación y verificar que no hay errores de consola.

### 3. Tocar solo la zona permitida

- Usar patch localizado.
- No reordenar HTML/CSS/JS.
- No “aprovechar” para reformatear.
- Mantener los nombres actuales de función.
- No cambiar copy clínico o de estado salvo los literales explícitamente autorizados por COPY-001, COPY-002 o COPY-003.

### 4. Pruebas

Siempre ejecutar:

1. tabla golden de clasificación;
2. tabla golden de elegibilidad;
3. turno de ejemplo;
4. prueba del flujo alterado;
5. inspección de consola;
6. hash lógico normalizado.

Ejecutar adicionalmente:

- caso de sobrecarga si se toca copy, KPI o tarjetas de auxiliar;
- teclado/foco si se toca modal, formulario, botón, consentimientos, bronco o toast;
- PDF si se toca exportación, reportes o datos renderizados;
- móvil si se toca CSS/layout;
- prueba XSS si se toca innerHTML/render dinámico.

### 5. Condición de parada

Detener sin editar más si:

- cambia un golden;
- la asignación de ejemplo cambia;
- el hash lógico cambia fuera de excepción permitida;
- se necesita modificar cap10/cap20, regla Braden, capacidad, rank, orden o cupo;
- se necesita persistencia o una llamada de red;
- el cambio abarca más de una preocupación.

## Formato de respuesta obligatorio

Al terminar, responder exactamente con estas secciones:

    ## Micro-parche
    - ID:
    - Objetivo:
    - Archivo y líneas:

    ## Alcance congelado
    - Bloques lógicos tocados: ninguno / excepción COPY documentada
    - Arquitectura tocada: no

    ## Evidencia
    - Hash antes:
    - Hash después:
    - Golden:
    - Prueba específica:
    - Consola/PDF/teclado según aplique:

    ## Riesgo residual y rollback
    - Riesgo:
    - Cómo revertir solo este cambio:

    ## Estado
    - Aprobado / bloqueado / revertido

## Prohibición de respuestas engañosas

Un agente nunca debe afirmar:

- que el MVP es SaaS, persistente, multi-tenant, HIPAA compliant o una historia clínica;
- que una distribución es óptima si hay sobrecarga;
- que una salida “funciona” sin ejecutar la matriz golden;
- que un refactor es seguro sin comparar la salida válida antes/después.

## Entrada a una futura fase distinta

Una solicitud para modificar arquitectura o lógica se debe crear como una iniciativa nueva fuera de esta carpeta. No se mezcla con mantenimiento conservador.
