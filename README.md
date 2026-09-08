# ACTUALIZACIÓN (8 de Septiembre 2026):
Se han corregido 4 fallas críticas arquitectónicas en la conexión Frontend-Backend:
1. Codificación UTF-8 y errores asíncronos en el inicio.
2. Mapeo de payloads correctos hacia la API (incluyendo weight y broncoFlags).
3. Conversión de IDs tipo string ("preview") a enteros para cumplir validaciones Pydantic.
4. Reinserción de funciones UI perdidas en la migración (shouldAutoRebalance y enderAfterDataChange) que impedían guardar pacientes.

**El repositorio en GitHub y la carpeta local se encuentran 100% actualizados y operativos.**

---# NUMIA Calculadora ClÃ­nica

Este repositorio contiene la calculadora clÃ­nica estructurada en una arquitectura Serverless: **Frontend nativo estÃ¡tico** y **Backend Python/FastAPI**.

## Estructura del Proyecto
- `/frontend/` - Archivos estÃ¡ticos de la aplicaciÃ³n (HTML, CSS, JS).
- `/backend/` - Motor clÃ­nico escrito en Python y API (FastAPI).
- `/api/` - Puente Serverless de Vercel (Index.py).
- `vercel.json` - ConfiguraciÃ³n de enrutamiento para despliegue en Vercel.
- `requirements.txt` - Dependencias para el entorno de Vercel y local.

## Desarrollo Local
1. Crea un entorno virtual e instala las dependencias:
   ```bash
   python -m venv .venv
   source .venv/Scripts/activate  # (En Windows)
   pip install -r requirements.txt
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   uvicorn backend.app.main:app --reload
   ```
3. Abre `http://localhost:8000` en tu navegador.

## Despliegue en Vercel y GitHub

### 1. Subir a GitHub
Inicia tu repositorio local y sÃºbelo a GitHub:
```bash
git init
git add .
git commit -m "Arquitectura inicial Frontend-Backend lista"
git branch -M main
git remote add origin https://github.com/<TU_USUARIO>/<TU_REPOSITORIO>.git
git push -u origin main
```

### 2. Despliegue en Vercel
1. Ingresa a [Vercel](https://vercel.com/) y haz clic en **Add New Project**.
2. Conecta tu cuenta de GitHub e importa el repositorio de la calculadora.
3. Vercel detectarÃ¡ automÃ¡ticamente la configuraciÃ³n base, pero **no requiere un framework especÃ­fico**.
4. Haz clic en **Deploy**. 

Vercel automÃ¡ticamente:
- DesplegarÃ¡ la carpeta `/frontend` como estÃ¡tica de forma global en su Edge Network gracias a `vercel.json`.
- DetectarÃ¡ el archivo `api/index.py` y el archivo `requirements.txt`, compilando el motor de Python como una **Vercel Serverless Function**.
- EnrutarÃ¡ todas las peticiones `tu-dominio.vercel.app/api/*` hacia tu motor en Python, y el resto hacia el frontend.

### 3. Consideraciones Post-Despliegue
Una vez desplegado, la aplicaciÃ³n estarÃ¡ lista para la producciÃ³n y auditable cara a cara con tu "Excel madre". El frontend consumirÃ¡ la API sin estado automÃ¡ticamente utilizando rutas relativas.

