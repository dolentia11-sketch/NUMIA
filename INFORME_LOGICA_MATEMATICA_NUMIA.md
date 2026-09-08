# Informe de la lógica matemática de Numia de Nexo

**Fecha de análisis:** 2026-09-04  
**Fuente auditada:** `index.html`  
**Huella SHA-256 de la fuente auditada:** `8D0F5EF46F8E39E18A5DEE961A70FF3C3DB02F6EB0DB6A1B6D18DA80FA5AEF53`

## 1. Alcance y conclusión ejecutiva

Numia de Nexo es una calculadora clínica estática para distribuir auxiliares de enfermería entre pacientes. El archivo auditado contiene una sola aplicación HTML; no es un libro de Excel con hojas independientes. Sus componentes funcionales equivalentes a “hojas” son:

1. Registro y clasificación de pacientes.
2. Clasificación biomecánica de auxiliares.
3. Elegibilidad paciente–auxiliar.
4. Balanceo automático.
5. Métricas, alertas y recomendaciones operativas.

El sistema **no es un modelo de aprendizaje automático ni un clasificador probabilístico**. Es un modelo determinista, explicable y basado en reglas: discretiza cuatro variables clínicas, las suma en un puntaje ordinal y usa un algoritmo voraz para repartir pacientes entre auxiliares elegibles.

## 2. Notación

| Símbolo | Definición |
|---|---|
| \(p\) | Paciente. |
| \(a\) | Auxiliar. |
| \(w_p\) | Peso del paciente, en kg. |
| \(w_a\) | Peso corporal del auxiliar, en kg. |
| \(B_p\) | Puntaje discretizado de Barthel. |
| \(R_p\) | Puntaje discretizado de Braden. |
| \(A_p\) | Puntaje por factores de broncoaspiración. |
| \(W_p\) | Puntaje discretizado por peso del paciente. |
| \(S_p\) | Puntaje clínico total del paciente. |
| \(r_p\) | Nivel numérico de demanda: leve = 1, moderado = 2, severo = 3. |
| \(T_a\) | Tipo biomecánico del auxiliar, de 1 a 5. |
| \(N_a\) | Máximo de pacientes asignables al auxiliar. |
| \(U_p\) | Unidades de cuidado demandadas por el paciente. |
| \(C_a\) | Capacidad de unidades de cuidado del auxiliar. |
| \(n_a\) | Número de pacientes ya asignados al auxiliar. |
| \(u_a\) | Unidades de cuidado ya asignadas al auxiliar. |

## 3. Módulo de pacientes: clasificación clínica

### 3.1 Puntaje compuesto

Para cada paciente el sistema calcula:

\[
S_p = B_p + R_p + A_p + W_p
\]

Los cuatro componentes se ponderan implícitamente con peso uno: no hay coeficientes estadísticos, calibración ni normalización adicional.

### 3.2 Conversión de variables a puntajes

#### Índice de Barthel

| Valor de Barthel | \(B_p\) |
|---:|---:|
| 100 | 1 |
| 61–99 | 2 |
| 40–60 | 3 |
| 20–39 | 4 |
| <20 | 5 |

Un Barthel menor representa mayor dependencia y, por tanto, suma más demanda al puntaje final.

#### Escala de Braden

| Valor de Braden | \(R_p\) |
|---:|---:|
| <12 | 3 |
| 12–15 | 2 |
| ≥16 | 1 |

Un Braden bajo aumenta el puntaje por mayor riesgo de lesión por presión. La implementación asigna explícitamente el valor 12 al grupo de 2 puntos.

#### Tamizaje de broncoaspiración

Se registran cinco indicadores binarios:

1. Alteración de conciencia o deterioro neurológico.
2. Disfagia, tos o voz húmeda al deglutir.
3. Sonda, traqueostomía o vía aérea artificial.
4. Edad mayor de 65 años o posoperatorio relevante.
5. Movilidad reducida o imposibilidad de mantener la cabecera por encima de 30°.

Sea \(k_p\) la cantidad de indicadores positivos. Entonces:

\[
A_p =
\begin{cases}
1, & k_p = 0\\
2, & 1 \leq k_p \leq 2\\
3, & k_p \geq 3
\end{cases}
\]

La identidad del factor positivo no altera el cálculo; únicamente importa el conteo \(k_p\).

#### Peso del paciente

| Peso del paciente | \(W_p\) |
|---:|---:|
| ≤60 kg | 1 |
| >60–65 kg | 2 |
| >65–70 kg | 3 |
| >70–75 kg | 4 |
| >75–80 kg | 5 |
| >80 kg | 6 |

### 3.3 Clasificación final del paciente

Con datos válidos, el mínimo posible es \(1+1+1+1=4\) y el máximo es \(5+3+3+6=17\).

\[
\operatorname{riesgo}(p) =
\begin{cases}
\text{LEVE}, & 4 \leq S_p \leq 8, \quad r_p=1\\
\text{MODERADO}, & 9 \leq S_p \leq 11, \quad r_p=2\\
\text{SEVERO}, & S_p \geq 12, \quad r_p=3
\end{cases}
\]

El estado `INCOMPLETO` aparece si falta Barthel, Braden o peso. El estado `FUERA DE RANGO` está programado, pero no se alcanza con valores válidos porque el puntaje mínimo siempre es 4.

## 4. Módulo de auxiliares: tipo biomecánico y cupo

### 4.1 Tipo por peso corporal

| Tipo | Rango de peso del auxiliar | \(T_a\) | Cupo \(N_a\) |
|---|---:|---:|---:|
| Tipo 1 | ≤55 kg | 1 | 6 |
| Tipo 2 | >55–65 kg | 2 | 8 |
| Tipo 3 | >65–75 kg | 3 | 10 |
| Tipo 4 | >75–85 kg | 4 | 11 |
| Tipo 5 | >85 kg | 5 | 12 |

### 4.2 Capacidad segura para el peso del paciente

La capacidad segura usada por el motor es:

\[
K_a = 1.1w_a
\]

El código también calcula \(1.2w_a\), denominado internamente `cap20`, pero esa cantidad no interviene en ninguna decisión ni alerta.

## 5. Módulo de elegibilidad paciente–auxiliar

Un paciente es elegible para un auxiliar si y solo si cumple simultáneamente:

\[
E(p,a) =
\left(w_p \leq K_a\right)
\land
\left(T_a \geq r_p\right)
\]

La primera condición es una restricción biomecánica de peso; la segunda garantiza que el tipo del auxiliar alcance el nivel de demanda clínica.

Consecuencias de esta regla:

- Tipo 1: únicamente pacientes leves.
- Tipo 2: leves y moderados.
- Tipos 3, 4 y 5: leves, moderados y severos.
- Tipo 4 y Tipo 5 no añaden niveles clínicos de elegibilidad frente a Tipo 3, pues el máximo nivel de riesgo es 3; su diferencia práctica es capacidad física, cupo y una mínima preferencia del balanceador.

## 6. Módulo de demanda clínica y capacidad de cuidado

El sistema transforma la clasificación clínica en unidades de cuidado:

\[
U_p = r_p + I(k_p \geq 3) + 0.5I(W_p \geq 5)
\]

Donde \(I(\cdot)\) vale 1 si la condición es verdadera y 0 en caso contrario.

Por tanto:

- Leve sin recargos: 1 unidad.
- Moderado sin recargos: 2 unidades.
- Severo sin recargos: 3 unidades.
- Se suma 1 unidad con tres o más factores de broncoaspiración.
- Se suman 0.5 unidades con puntaje de peso 5 o 6, equivalente a peso mayor de 75 kg.

La capacidad del auxiliar en unidades de cuidado es:

\[
C_a = 1.7N_a
\]

Ejemplo: un Tipo 3 tiene \(N_a=10\), por tanto \(C_a=17\) unidades.

## 7. Módulo de balanceo automático

### 7.1 Orden de priorización

El motor ordena pacientes en forma descendente por:

1. Nivel de riesgo \(r_p\).
2. Número de indicadores de broncoaspiración \(k_p\).
3. Peso \(w_p\).
4. Orden original de registro, como desempate final.

Así, primero intenta ubicar pacientes severos, después moderados y finalmente leves; dentro de cada grupo favorece los casos con más broncoaspiración y mayor peso.

### 7.2 Función de ranking para cada auxiliar candidato

Para cada paciente y auxiliar elegible con cupo disponible, calcula:

\[
P_{\text{cupo}} = \frac{n_a+1}{N_a}
\]

\[
P_{\text{cuidado}} = \frac{u_a+U_p}{C_a}
\]

\[
\operatorname{rank}(p,a)=
\max(P_{\text{cupo}},P_{\text{cuidado}})
 + 0.18P_{\text{cuidado}}
 - 0.002T_a
\]

El paciente se asigna al auxiliar con el menor `rank`.

Interpretación:

- `max(...)` intenta evitar que el componente más cargado —cupo o cuidado— quede muy alto.
- `0.18 × P_cuidado` da un castigo adicional a carga clínica alta.
- `−0.002 × T_a` favorece de forma muy leve a auxiliares de mayor tipo.

### 7.3 Naturaleza del algoritmo

Es un algoritmo voraz: asigna un paciente a la vez y no vuelve atrás. Por tanto, no demuestra optimalidad global. No realiza programación lineal, flujo en redes, búsqueda exhaustiva ni reasignación para reparar una elección previa.

El cupo de pacientes sí es una restricción dura: un auxiliar con \(n_a \geq N_a\) se excluye. En contraste, la capacidad de unidades \(C_a\) solo afecta el ranking; una asignación puede superar dicha capacidad y luego quedar marcada como sobrecarga.

## 8. Módulo de métricas, alertas y recomendaciones

Para cada auxiliar se calculan:

\[
\%\text{ cupos}_a = \frac{n_a}{N_a}
\qquad
\%\text{ cuidado}_a = \frac{u_a}{C_a}
\]

### Estados operativos

| Estado | Regla |
|---|---|
| `overload` | \(n_a>N_a\), o \(u_a>C_a\), o el paciente más pesado supera \(K_a\). |
| `full` | \(n_a=N_a\), o al menos 90% de cupos, o al menos 90% de cuidado. |
| `libre` | \(n_a=0\). |
| `ok` | Cualquier otro caso. |

Métricas globales:

\[
\text{Cobertura}=\operatorname{round}\left(100\frac{\text{pacientes asignados}}{\text{pacientes totales}}\right)
\]

\[
\text{Alertas}=\text{pacientes sin asignar}+\text{auxiliares en sobrecarga}
\]

El panel visual y la exportación PDF presentan estos resultados, pero no introducen matemáticas adicionales.

## 9. Verificación con los datos de ejemplo incluidos

Se ejecutó el motor implementado con los ocho pacientes y cinco auxiliares de muestra incluidos en el archivo.

| Paciente | \(S_p\) | Clasificación | \(U_p\) | Auxiliar asignado |
|---|---:|---|---:|---|
| 101 | 7 | Leve | 1.0 | aux3 |
| 102 | 5 | Leve | 1.0 | aux1 |
| 103 | 5 | Leve | 1.0 | aux2 |
| 104 | 8 | Leve | 1.0 | aux4 |
| 105 | 11 | Moderado | 2.0 | aux3 |
| 106 | 17 | Severo | 4.5 | aux5 |
| 107 | 7 | Leve | 1.0 | aux4 |
| 108 | 9 | Moderado | 2.0 | aux1 |

El resultado de ejemplo alcanza 100% de cobertura, sin pacientes sin asignar y sin auxiliares en estado `overload`.

## 10. Hallazgos y límites clínicos

1. **Modelo de reglas, no evidencia predictiva.** No contiene fuentes, coeficientes estimados, validación clínica, sensibilidad, especificidad, calibración ni medidas de incertidumbre.
2. **Inconsistencia documental en Braden.** El cuadro de ayuda visual indica 13–15 para 2 puntos, mientras que el código y el README implementan 12–15. El valor 12 debe quedar unificado en toda la documentación.
3. **`cap20` no tiene efecto.** La capacidad \(1.2w_a\) se calcula, pero no participa en ninguna decisión.
4. **Capacidad de cuidado no bloqueante.** El motor puede crear sobrecarga de unidades porque \(C_a\) solo ordena alternativas; no impide la asignación.
5. **Sin garantía de solución óptima.** Un resultado factible globalmente puede no encontrarse si una elección voraz temprana ocupa un auxiliar escaso.
6. **Peso con doble efecto.** El peso del paciente aumenta simultáneamente su demanda clínica y restringe la compatibilidad biomecánica.
7. **Validación insuficiente en código.** Al guardar, se verifica que los datos sean numéricos, pero no se comprueba explícitamente que peso sea positivo ni que Barthel y Braden queden en sus rangos clínicos.
8. **Uso clínico.** El archivo se presenta como apoyo a la decisión. Antes de usarlo para asignación real debe validar reglas, umbrales, responsabilidad profesional, criterios ergonómicos y resultados con el equipo clínico responsable.

## 11. Referencias de implementación

| Elemento | Ubicación en `index.html` |
|---|---:|
| Explicación visible de fórmulas | 2369–2386 |
| Factores de broncoaspiración | 2416–2442 |
| Funciones de puntuación | 2476–2524 |
| Perfil y elegibilidad auxiliar | 2526–2541 |
| Unidades y capacidad de cuidado | 2543–2555 |
| Balanceo automático | 2577–2648 |
| Métricas y alertas | 2650–2702 |
| Recomendaciones por estado | 2787–2824 |
| Validación de captura de datos | 3013–3056 |
