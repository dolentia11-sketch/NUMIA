---
owner: Engineering Lead
approver: Product Owner y responsable clínico
priority: P0
depends_on: [00_CONTRATO_DE_INMUTABILIDAD, 01_BASELINE_E_INVENTARIO, 02_MATRIZ_REGRESION_GOLDEN]
---

# 03. P0 — Validación de entrada sin tocar el motor

## Objetivo

Evitar que el formulario envíe al motor datos físicamente imposibles o fuera de los límites ya declarados por la interfaz. Esto endurece la frontera de captura, no modifica ninguna fórmula.

## Defecto observado

En la línea baseline 3020, **savePatient** solo exige valores finitos. En la línea 3043, **saveAux** hace lo mismo. Por tanto, la interfaz puede aceptar:

- cama negativa o decimal;
- peso de paciente o auxiliar cero/negativo;
- Barthel menor de 0 o mayor de 100;
- Braden menor de 6 o mayor de 23.

Los campos visuales ya declaran Barthel 0–100 y Braden 6–23, pero el guardado mediante botón no garantiza esos límites.

## Límite de alcance

Se permite cambiar solamente:

- atributos de los inputs de captura, baseline 2245–2329;
- validación previa dentro de **savePatient**, baseline 3013–3036;
- validación previa dentro de **saveAux**, baseline 3038–3056;
- mensajes de error, foco y atributos aria asociados.

No se permite modificar:

- **scoreBarthel**, **scoreBraden**, **scoreWeight**, **patientScore** o **auxiliaryProfile**;
- **isEligible**, **careUnitsForPatient**, **autoBalance** o **getMetrics**;
- forma de objetos en **STATE**;
- datos de muestra;
- valores aceptados válidos ya existentes.

## Reglas de validación permitidas

| Campo | Regla de frontera permitida | Regla que no se debe añadir |
|---|---|---|
| Cama | Entero mayor que 0 y único | Cambiar semántica de cama o secuenciación. |
| Nombre | Texto no vacío tras trim | Normalizar, traducir o alterar nombre. |
| Peso paciente | Número finito mayor que 0 | Limitar peso máximo sin aprobación clínica. |
| Barthel | Entero entre 0 y 100 | Cambiar bandas de puntuación. |
| Braden | Entero entre 6 y 23 | Cambiar banda 12–15. |
| ID auxiliar | Texto no vacío y único | Reescribir esquema de IDs. |
| Nombre auxiliar | Texto no vacío tras trim | Normalizar identidad. |
| Peso auxiliar | Número finito mayor que 0 | Cambiar tipo/cupo/cap10/cap20. |

## Pasos exactos

1. Crear casos de prueba que reproduzcan cada valor inválido antes de editar.
2. Agregar atributos HTML solo si coinciden con la tabla anterior: required, min, max y step.
3. En **savePatient**, validar antes de cualquier mutación de **STATE.patients**.
4. En **saveAux**, validar antes de cualquier mutación de **STATE.auxiliaries**.
5. Si una entrada es inválida, no mutar STATE, no cerrar modal y enfocar el primer campo inválido.
6. Usar el toast existente y, si se agrega texto inline, asociarlo al input mediante aria-describedby.
7. Ejecutar toda la matriz golden; no actualizar ninguna expectativa.

## Patrón de implementación autorizado

El agente puede usar una función pequeña de validación de interfaz o validaciones explícitas al inicio de **savePatient** y **saveAux**. Debe retornar solo un resultado de UI, por ejemplo:

    { valid: false, firstInvalid: '#p-weight', message: 'El peso debe ser mayor que cero.' }

La función no puede llamar a **patientScore**, **auxiliaryProfile**, **isEligible** ni modificar STATE.

## Casos de aceptación

| ID | Acción | Resultado requerido |
|---|---|---|
| VAL-001 | Guardar cama -1 | No se crea paciente; foco queda en cama. |
| VAL-002 | Guardar cama 1.5 | No se crea paciente; foco queda en cama. |
| VAL-003 | Guardar peso paciente 0 o -1 | No se crea paciente; STATE no cambia. |
| VAL-004 | Guardar Barthel -1 o 101 | No se crea paciente; STATE no cambia. |
| VAL-005 | Guardar Braden 5 o 24 | No se crea paciente; STATE no cambia. |
| VAL-006 | Guardar peso auxiliar 0 o -1 | No se crea auxiliar; STATE no cambia. |
| VAL-007 | Guardar Barthel 0 y 100 | Ambos se aceptan y conservan su salida golden. |
| VAL-008 | Guardar Braden 6 y 23 | Ambos se aceptan y conservan su salida golden. |
| VAL-009 | Guardar paciente/auxiliar válido después de balancear | Conserva rebalanceo automático actual. |
| VAL-010 | Valor inválido tras turno ejemplo | Asignaciones existentes no se modifican. |

## Outputs

- Evidencia de defectos reproducidos.
- Cambio mínimo en inputs y savePatient/saveAux.
- Resultado de VAL-001 a VAL-010.
- Matriz golden completa idéntica.
- Registro de revisión clínica/producto que autoriza bloquear esos valores.

## Gate de salida

El item se acepta solo si:

- ningún bloque congelado cambia;
- todos los límites válidos de la UI siguen aceptándose;
- valores inválidos no mutan estado;
- la asignación de ejemplo y los PDFs permanecen idénticos;
- no aparece persistencia, red o dependencia nueva.

## Rollback

Revertir exclusivamente las líneas de validación y atributos añadidos. No restaurar el archivo completo sobre cambios de otros micro-parches.

