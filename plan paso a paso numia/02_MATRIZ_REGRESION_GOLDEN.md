---
owner: QA Lead
approver: Product Owner
status: obligatorio antes y después de cada micro-parche
---

# 02. Matriz de regresión golden

## Objetivo

Preservar exactamente el comportamiento matemático, operativo y demostrativo del MVP. Estas salidas son el contrato de no regresión.

## Reglas

- Ningún valor de esta matriz puede cambiar.
- Los valores se prueban con datos válidos; la validación de datos inválidos se prueba por separado.
- La asignación de muestra se compara por paciente y auxiliar, no solo por cobertura.
- Si un cambio visual dificulta verificar una salida, el cambio se rechaza.

## A. Bandas de Barthel congeladas

| Entrada | Puntaje esperado |
|---:|---:|
| 100 | 1 |
| 99 | 2 |
| 61 | 2 |
| 60 | 3 |
| 40 | 3 |
| 39 | 4 |
| 20 | 4 |
| 19 | 5 |

## B. Bandas de Braden congeladas

| Entrada | Puntaje esperado |
|---:|---:|
| 11 | 3 |
| 12 | 2 |
| 15 | 2 |
| 16 | 1 |

No cambiar esta tabla aunque una ayuda documental difiera. Esta matriz describe el código bloqueado.

## C. Broncoaspiración congelada

| Indicadores positivos | Puntaje esperado |
|---:|---:|
| 0 | 1 |
| 1 | 2 |
| 2 | 2 |
| 3 | 3 |
| 5 | 3 |

## D. Peso del paciente congelado

| Peso kg | Puntaje esperado |
|---:|---:|
| 60 | 1 |
| 60.1 | 2 |
| 65 | 2 |
| 65.1 | 3 |
| 70 | 3 |
| 70.1 | 4 |
| 75 | 4 |
| 75.1 | 5 |
| 80 | 5 |
| 80.1 | 6 |

## E. Perfil biomecánico congelado

| Peso auxiliar kg | Tipo | Tipo numérico | Máximo pacientes |
|---:|---|---:|---:|
| 55 | Tipo 1 | 1 | 6 |
| 55.1 | Tipo 2 | 2 | 8 |
| 65 | Tipo 2 | 2 | 8 |
| 65.1 | Tipo 3 | 3 | 10 |
| 75 | Tipo 3 | 3 | 10 |
| 75.1 | Tipo 4 | 4 | 11 |
| 85 | Tipo 4 | 4 | 11 |
| 85.1 | Tipo 5 | 5 | 12 |

Además, cap10 siempre es peso auxiliar multiplicado por 1.1. cap20 se conserva calculado, pero no interviene en elegibilidad ni alertas.

## F. Riesgo y unidades congeladas

| Escenario válido | Puntaje total | Riesgo | Unidades |
|---|---:|---|---:|
| Barthel 100, Braden 23, 0 bronco, 60 kg | 4 | LEVE | 1.0 |
| Barthel 35, Braden 14, 2 bronco, 69 kg | 11 | MODERADO | 2.0 |
| Barthel 18, Braden 11, 5 bronco, 88 kg | 17 | SEVERO | 4.5 |

## G. Dataset de ejemplo congelado

Después de “Cargar datos de ejemplo” y “Balancear”, el resultado esperado es:

| Paciente/cama | Total | Riesgo | Unidades | Auxiliar |
|---:|---:|---|---:|---|
| 101 | 7 | LEVE | 1.0 | aux3 |
| 102 | 5 | LEVE | 1.0 | aux1 |
| 103 | 5 | LEVE | 1.0 | aux2 |
| 104 | 8 | LEVE | 1.0 | aux4 |
| 105 | 11 | MODERADO | 2.0 | aux3 |
| 106 | 17 | SEVERO | 4.5 | aux5 |
| 107 | 7 | LEVE | 1.0 | aux4 |
| 108 | 9 | MODERADO | 2.0 | aux1 |

Indicadores globales esperados:

- ocho pacientes;
- cinco auxiliares;
- cobertura 100%;
- cero pacientes sin asignar;
- cero auxiliares en sobrecarga.

## H. Comportamiento operativo congelado

| Acción | Resultado que debe conservarse |
|---|---|
| Agregar paciente después de balancear | Rebalanceo automático silencioso. |
| Agregar auxiliar después de balancear | Rebalanceo automático silencioso. |
| Eliminar paciente con más pacientes restantes | Rebalanceo automático. |
| Eliminar auxiliar con auxiliares restantes | Rebalanceo automático. |
| Limpiar datos | Estado vacío, nextPatientId 101 y hasBalanced false. |
| Exportar PDF | Descarga un reporte visual local. |

## Método de ejecución

Para cada caso, registrar entrada, salida visible, hash lógico y captura. Si se crea un harness local, debe ser externo al archivo de aplicación, usar datos sintéticos y no introducir librerías ni cambios de arquitectura.

## Gate de salida

La matriz completa pasa antes de marcar un micro-parche como terminado.

