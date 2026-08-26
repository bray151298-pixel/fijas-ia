# GUÍA DE CONFIGURACIÓN POSTGRESQL PARA PRODUCCIÓN — FIJAS IA

**Documento:** `DATABASE_SETUP.md`  
**Objetivo:** Configurar una base de datos PostgreSQL persistente en Render para que las señales de producción, eventos y liquidaciones sobrevivan indefinidamente a cualquier redeploy o reinicio de contenedor.

---

## 1. PASO A PASO EN EL DASHBOARD DE RENDER

### Paso 1: Crear la Base de Datos PostgreSQL en Render
1. Inicia sesión en tu cuenta de [Render Dashboard](https://dashboard.render.com/).
2. Haz clic en el botón azul **"New +"** (arriba a la derecha) y selecciona **"PostgreSQL"**.
3. Completa los campos básicos:
   * **Name:** `fijas-ia-db` (o el nombre que prefieras).
   * **Database:** `fijas_ia`
   * **User:** `fijas_admin`
   * **Region:** Selecciona la misma región donde está tu Web Service (por ejemplo, `Oregon (US West)` o `Frankfurt (EU)`).
   * **Plan:** Selecciona **Free** (Gratuito).
4. Haz clic en **"Create Database"**.

---

### Paso 2: Copiar la URL de Conexión (`DATABASE_URL`)
1. Una vez creada la base de datos, en la pestaña **"Info"** de tu PostgreSQL, busca la sección de conexiones.
2. Si tu Web Service está en la misma cuenta de Render, copia la **"Internal Database URL"** (comienza con `postgres://...`).
3. *(Opcional)* Si tu Web Service se conecta desde fuera, copia la **"External Database URL"**.

---

### Paso 3: Agregar la Variable de Entorno en el Web Service de FIJAS IA
1. En tu dashboard de Render, abre tu Web Service: **`fijas-ia`**.
2. Ve a la pestaña **"Environment"** en el menú lateral izquierdo.
3. Haz clic en **"Add Environment Variable"**:
   * **Key:** `DATABASE_URL`
   * **Value:** Pega la URL de conexión que copiaste en el Paso 2 (ej. `postgres://fijas_admin:xxxx@dpg-xxxx/fijas_ia`).
4. Haz clic en **"Save Changes"**.

---

## 2. COMPORTAMIENTO AUTOMÁTICO DE FIJAS IA AL DETECTAR `DATABASE_URL`

En cuanto guardes la variable `DATABASE_URL`, Render reiniciará automáticamente el servicio y FIJAS IA ejecutará de forma 100% autónoma:

1. **Auto-Detección y Conexión:** `PostgresRepository` detecta `process.env.DATABASE_URL` y establece el pool de conexiones seguras con SSL.
2. **Creación Automática de Tablas (DDL):**
   * `events`: Registro de marcadores y fixtures deportivos oficiales.
   * `signals`: Registro inmutable de pronósticos (`signal_id`, cuota, selección, línea, stake, estado).
   * `signal_settlements`: Historial de auditoría y resultados verificados.
   * `telegram_dispatches`: Claves de idempotencia `${signal_id}_${type}` para evitar re-envíos o spam.
   * `system_state`: Estado del scheduler y marcas de tiempo de ejecución.
3. **Migración Automática de Señales Existentes:** Todas las señales de producción pendientes (`SIG_20260826_001`, `SIG_20260828_002`, `SIG_20260828_003`, `SIG_20260828_004`) y el archivo histórico se insertan automáticamente en PostgreSQL con `ON CONFLICT (signal_id) DO NOTHING`.
4. **Verificación en `/health`:** El endpoint `/health` reflejará automáticamente:
   ```json
   "database": {
     "status": "connected",
     "storage_type": "PostgreSQL (Primary Source of Truth) + Dual-Layer Local Snapshot",
     "postgres_status": "connected"
   }
   ```
