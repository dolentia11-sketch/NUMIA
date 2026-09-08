# Plan Paso a Paso: Transformación de NUMIA a Plataforma SaaS

Este documento detalla la hoja de ruta técnica y operativa para convertir la actual calculadora estática de NUMIA en una plataforma SaaS (Software as a Service) B2B, robusta, segura y escalable para múltiples hospitales.

## Fase 1: Arquitectura y Diseño Base (Semanas 1-2)

### 1.1 Diseño de Base de Datos Multitenencia
*   **Acción:** Diseñar el esquema relacional (PostgreSQL recomendado).
*   **Entregables:**
    *   Tabla `Hospitals` (Tenant principal).
    *   Tabla `Users` con RBAC (Admin Hospital, Jefe Enfermería, Auxiliar) vinculados al `hospital_id`.
    *   Tablas de Configuración: `Scales_Config` (ej. EED, Barthel), `Limits_Config` (ej. activador de `cap20`).
    *   Tablas Operativas: `Patients`, `Nurses_Shift`.
    *   Tabla `Audit_Logs` (Trazabilidad estricta e inmutable).
*   **Auditoría:** Garantizar que absolutamente todas las consultas SQL filtren siempre por `hospital_id`.

### 1.2 Configuración del Proyecto (Backend)
*   **Acción:** Inicializar el repositorio del backend.
*   **Stack Sugerido:** Python + FastAPI (Alto rendimiento, tipado estático, ideal para motores matemáticos).
*   **Entregables:**
    *   Estructura de carpetas (`api/`, `core/`, `models/`, `db/`).
    *   Configuración de autenticación (JWT - JSON Web Tokens) para aislar las sesiones.

## Fase 2: Desarrollo del Motor Determinista (Semanas 3-5)

Esta fase traduce el Excel original a código Python parametrizable.

### 2.1 Módulo de Clasificación (`modulo_clasificacion.py`)
*   **Acción:** Implementar el motor de reglas de riesgo.
*   **Detalle:** En lugar de reglas duras, el módulo leerá la configuración del hospital. Integrará la **EED (Evaluación Estándar de Disfagia)** como estándar nativo (1, 2, 3 puntos) sumado al Barthel y Braden para dar el Riesgo Final (Leve, Moderado, Severo).

### 2.2 Módulo de Elegibilidad (`modulo_elegibilidad.py`)
*   **Acción:** Programar los límites biomecánicos.
*   **Detalle:** Traducir las capacidades de auxiliares (Tipos 1 al 5). Agregar el interruptor de configuración para el hospital: si tienen ayudas mecánicas, el multiplicador sube automáticamente a $1.2 w_a$. Si no, se queda en el estándar de seguridad $1.1 w_a$.

### 2.3 Módulo de Balanceo (`modulo_balanceo.py`)
*   **Acción:** Implementar el algoritmo de asignación (Greedy).
*   **Detalle:** El motor calculará la disponibilidad en tiempo real (Cupos máximos - Pacientes asignados) y emparejará al paciente con el auxiliar óptimo según la estrategia elegida por el hospital.

### 2.4 Módulo de Trazabilidad (`modulo_trazabilidad.py`)
*   **Acción:** Crear el sistema de logs médicos.
*   **Detalle:** Cada asignación dispara un registro en base de datos indicando: Usuario (Jefe Enfermería), Paciente, Auxiliar asignado, Justificación del motor, y Fecha/Hora.

## Fase 3: Desarrollo del Panel de Control Frontend (Semanas 6-8)

### 3.1 Migración a Framework Moderno
*   **Acción:** Pasar del `index.html` estático a un framework reactivo (React.js, Vue.js o Next.js).
*   **Entregables:**
    *   **Dashboard Jefe de Enfermería:** Vista de pacientes sin asignar, lista de auxiliares en turno con barras de capacidad (semáforos visuales).
    *   **Panel Admin Hospital:** Pantalla para que el hospital active/desactive la EED, el `cap20` o cambie los rangos de riesgo.

### 3.2 Integración con la API
*   **Acción:** Conectar el Frontend con el Backend FastAPI.
*   **Detalle:** El frontend solo recopilará datos y dibujará resultados; toda decisión pasa por la API.

## Fase 4: Pruebas, Seguridad y QA (Semanas 9-10)

### 4.1 Pruebas Unitarias (Testing del Motor)
*   **Acción:** Escribir pruebas automatizadas (pytest) para el motor matemático.
*   **Detalle:** Inyectar "casos extremos" (ej. paciente de 150kg con riesgo severo) para verificar que el sistema *jamás* lo asigne a un auxiliar Tipo 1 y bloquee la operación por seguridad.

### 4.2 Auditoría de Seguridad (HIPAA Compliance base)
*   **Acción:** Encriptar datos sensibles.
*   **Detalle:** Nombres de pacientes y datos de salud (PHI) deben guardarse cifrados. Implementar borrado seguro o anonimización.

## Fase 5: Despliegue y Piloto SaaS (Semanas 11-12)

### 5.1 Infraestructura Cloud
*   **Acción:** Desplegar en la nube (AWS, Google Cloud o Azure).
*   **Componentes:** Base de datos gestionada (RDS/Cloud SQL), servidor de backend, y CDN para el frontend.

### 5.2 Piloto (Go-Live)
*   **Acción:** Iniciar con un hospital de prueba.
*   **Detalle:** Crear su `hospital_id`, configurar sus parámetros, capacitar a los Jefes de Enfermería y dejar correr el sistema en paralelo con su método actual durante 1 semana para validar la reducción de sobrecarga.
