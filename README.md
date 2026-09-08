# NUMIA Calculadora Clínica

NUMIA usa una interfaz estática nativa servida desde `public/` y un motor clínico Python/FastAPI sin estado. La frontera cliente–API conserva las fórmulas, reglas de elegibilidad, capacidad, asignación y métricas del motor de paridad.

## Estructura

- `public/`: interfaz que Vercel y FastAPI sirven al navegador.
- `public/assets/app.js`: cliente de la API; envía `patients`, `auxiliaries`, `assignments` y `action` en la raíz de `TurnRequest`.
- `backend/`: motor clínico y endpoints FastAPI.
- `pyproject.toml`: entrada serverless explícita `backend.app.main:app` para Vercel; `api/index.py` conserva el import compatible anterior.
- `reference/index.html`: oráculo histórico de paridad clínica; no es el frontend servido.
- `qa/`: regresiones del oráculo y del contrato frontend–API.

## Desarrollo local

1. Instala dependencias:

   ```powershell
   py -3 -m pip install -r requirements.txt
   ```

2. Inicia la aplicación:

   ```powershell
   py -3 -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. Abre `http://127.0.0.1:8000`.

No hay persistencia: los registros del turno viven solo en la sesión del navegador.

## Validación

Desde la raíz:

```powershell
py -3 -m pip install -r requirements.txt httpx
py -3 -B -m unittest discover -s backend/tests -t backend -v
node --check public/assets/app.js
node qa/frontend_contract.cjs
node qa/reference_golden.cjs
```

Para probar el navegador, abre la aplicación en una sesión aislada de `agent-browser` y ejecuta:

```powershell
agent-browser --session numia-parity-final open http://127.0.0.1:8000
node qa/browser_parity.cjs RUTA_AL_EJECUTABLE_AGENT_BROWSER numia-parity-final
```

Esta prueba usa exclusivamente datos sintéticos: comprueba registro, previews, balanceo, sobrecarga 18/17, errores de red y compara los textos/números del PDF con `index.html`. No debe ejecutarse en una sesión con datos de pacientes.

La referencia congelada `index.html` y `reference/index.html` tiene SHA-256 `64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6`. Las fórmulas permanecen en `backend/app/domain/`; no hay motor clínico alternativo en el cliente. El historial y los planes anteriores describen etapas pasadas; el estado de esta entrega se documenta en `DEPURACION_PARIDAD_2026-09-08.md`.

El auditor exhaustivo del dominio también está disponible, pero actualiza deliberadamente sus artefactos de evidencia:

```powershell
py -3 -B qa/audit_engine.py
```

## Despliegue

`vercel.json` selecciona FastAPI y `pyproject.toml` declara su entrada. Se conservan las rutas originales `/api/*` sin reescribirlas al nombre de un archivo; `public/` contiene los estáticos. Antes de declarar una versión de producción, verifique el commit desplegado, `GET /api/health`, `POST /api/v1/turn/evaluate` y el flujo de registrar paciente/auxiliar en `https://numia-ashen.vercel.app`. No se deben usar datos clínicos reales durante pruebas.
