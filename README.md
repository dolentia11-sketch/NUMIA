# NUMIA Calculadora Clínica

Este repositorio contiene la calculadora clínica estructurada en una arquitectura Serverless: **Frontend nativo estático** y **Backend Python/FastAPI**.

## Estructura del Proyecto
- `/frontend/` - Archivos estáticos de la aplicación (HTML, CSS, JS).
- `/backend/` - Motor clínico escrito en Python y API (FastAPI).
- `/api/` - Puente Serverless de Vercel (Index.py).
- `vercel.json` - Configuración de enrutamiento para despliegue en Vercel.
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
Inicia tu repositorio local y súbelo a GitHub:
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
3. Vercel detectará automáticamente la configuración base, pero **no requiere un framework específico**.
4. Haz clic en **Deploy**. 

Vercel automáticamente:
- Desplegará la carpeta `/frontend` como estática de forma global en su Edge Network gracias a `vercel.json`.
- Detectará el archivo `api/index.py` y el archivo `requirements.txt`, compilando el motor de Python como una **Vercel Serverless Function**.
- Enrutará todas las peticiones `tu-dominio.vercel.app/api/*` hacia tu motor en Python, y el resto hacia el frontend.

### 3. Consideraciones Post-Despliegue
Una vez desplegado, la aplicación estará lista para la producción y auditable cara a cara con tu "Excel madre". El frontend consumirá la API sin estado automáticamente utilizando rutas relativas.
