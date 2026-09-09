# Depuración de integración y paridad NUMIA

Fecha: 2026-09-08. Carpeta: `C:\Users\anglo\OneDrive\Escritorio\NUMIA CALCULADORA`.

## Referencia y alcance

El propietario priorizó equivalencia matemática con `index.html`. Se conserva la arquitectura existente: interfaz estática en `public/`, estado efímero en el navegador, FastAPI serverless y dominio Python determinista. `index.html`, `reference/index.html` y todos los archivos de `backend/app/domain/` permanecen sin modificaciones respecto de `fe19a602f2f4841c64517fe8edc157aeada2acc7`.

SHA-256 de ambos HTML de referencia: `64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6`.

Git almacena el mismo contenido con saltos LF: SHA-256 `B78ADB9EBCE27AA7FB0100E9EDF72F9F00C704953E9AA7AE7C47EBC71F5BC120`. El primer CI Linux detectó esa diferencia de formato; las pruebas ahora normalizan exclusivamente CRLF a LF antes de verificar esta huella fija. Ningún archivo de referencia ni fórmula fue editado.

## Discrepancias corregidas

1. El cliente enviaba `{state: ...}` pero el esquema requería campos raíz. Ahora envía el contrato correcto y el esquema rechaza envoltorios desconocidos.
2. El preview auxiliar enviaba un ID numérico y leía una clave textual diferente. Se unificó en `preview`, acorde con el esquema auxiliar.
3. La extracción había eliminado `nextAuxiliaryId` y el adaptador `autoBalance`. Se restablecieron la generación de identificadores y el enlace con el motor remoto. Las decisiones clínicas siguen exclusivamente en Python.
4. Al cargar ejemplos se renderizaban auxiliares antes de recibir sus cargas. Ahora se espera el resultado completo antes de renderizar.
5. El preview había sustituido el desglose matemático y el tipo mínimo por texto técnico. Se restituyeron partes, total, riesgo, tipo mínimo, capacidad segura y cupos usando la respuesta del motor.
6. Respuestas antiguas podían sobrescribir previews recientes. Se descartan por revisión del formulario; el fallo limpia el resultado y muestra un aviso.
7. Un guardado fallido mutaba el turno y anunciaba éxito. Ahora se conserva el turno confirmado, se mantiene el formulario para reintentar y se impiden mutaciones concurrentes durante el cálculo.
8. Limpiar dejaba métricas antiguas en pantalla. Se restablece el resultado vacío completo.
9. El PDF podía generarse antes de finalizar el balanceo remoto. Ahora espera el cálculo y se cancela si falla.
10. Se corrigieron documentación de arranque, estructura real, dependencias de pruebas y descubrimiento desde raíz. Se añadió CI de paridad en `.github/workflows/parity.yml`.
11. El sitio público devolvía `404` en `/api/health`, `/api/docs` y preview/evaluación por el enrutamiento. Se retiró el rewrite al archivo `api/index.py` y se declaró la entrada del mismo FastAPI en `pyproject.toml`, conservando rutas. Referencia de configuración: https://vercel.com/docs/frameworks/backend/fastapi (entrada explícita y archivos públicos).

## Evidencia de validación local

| Prueba | Resultado |
|---|---|
| `py -3 -B -m unittest discover -s backend/tests -t backend -v` | 44 pruebas, OK; 214,742 s en este equipo |
| 100 turnos diferenciales del dominio | 8.245 pacientes y 1.395 auxiliares; igualdad exacta con el oráculo |
| 100 estados independientes de métricas | Igualdad exacta con el oráculo |
| 100 turnos a través de HTTP/FastAPI | Asignaciones, métricas, puntajes, unidades, perfiles y elegibilidad idénticos |
| Preview HTTP en 3.564 combinaciones de umbrales | Puntajes, riesgos y partes idénticos; 9 Barthel × 6 Braden × 11 pesos × 6 conteos EED |
| `node qa/frontend_contract.cjs` | Transporte real del cliente ejecutado en VM, PASS |
| `node qa/reference_golden.cjs` | PASS; muestras, umbrales y sobrecarga conservados |
| `node --check public/assets/app.js` | PASS |
| `qa/browser_parity.cjs` en navegador local | 30 comprobaciones, PASS |
| PDF de muestra | Dos páginas; texto, números y coordenadas de presentación iguales al generador monolítico; solo se excluye la fecha/hora variable |
| `git diff -- backend/app/domain index.html reference/index.html` | Sin diferencias |

El nuevo test de frontend servido falló antes de corregir las funciones ausentes y pasó después. La prueba de navegador utiliza llamadas de formulario, DOM real y solicitudes HTTP reales; incluye un fallo de red sintético, reintento, respuestas fuera de orden, rebalanceo tras eliminación, espera del PDF y alertas 18/17. No modifica el código servido ni envía datos reales.

## Despliegue y límites

El dominio público registrado en GitHub es `https://numia-ashen.vercel.app`. La integración Vercel publica la rama `main`. La URL técnica de cada despliegue está protegida por SSO, por lo que la verificación pública debe realizarse sobre el dominio registrado. El resultado remoto se registra al finalizar la publicación; las pruebas locales por sí solas no acreditan producción.

Publicación funcional `9d0d77a`: Vercel informó `success` y `https://numia-ashen.vercel.app/api/health` devolvió `200` con `status: ok` y `engine_version: parity-1`. La prueba `qa/browser_parity.cjs` contra el dominio público pasó las 30 comprobaciones, incluidas asignaciones y métricas golden, registro y reintento, espera del PDF y sobrecarga 18/17. El seguimiento posterior solo corrige la portabilidad del control de huellas en CI y documenta esta evidencia; no cambia la aplicación desplegada.

Esto acredita equivalencia de software en los casos indicados, no validación clínica independiente del modelo. Se conservan deliberadamente el algoritmo voraz, los cupos, el cálculo de cap20 sin activarlo, la sobrecarga posible y la ausencia de persistencia.

## Reproducción

Desde la raíz, instalar `requirements.txt` más `httpx` y ejecutar los comandos anteriores. Arrancar con `py -3 -B -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8765`. Abrir una sesión aislada de agent-browser en esa dirección y ejecutar:

```powershell
node qa/browser_parity.cjs C:/Users/anglo/AppData/Roaming/npm/node_modules/agent-browser/bin/agent-browser-win32-x64.exe numia-parity-final
```

La misma prueba puede ejecutarse contra producción en una sesión aislada sin datos existentes. El `qa/audit_engine.py` histórico regenera sus propios archivos de evidencia: no es necesario para repetir esta entrega.

## Reversión

Revertir el commit de integración mediante un nuevo commit, manteniendo intactas las referencias y el dominio. Volver a desplegar `fe19a60` restaura el estado anterior pero también sus fallas conocidas de integración; no constituye una versión funcional validada. No usar restauraciones destructivas del árbol de trabajo.
