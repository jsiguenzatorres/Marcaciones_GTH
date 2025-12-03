# BFA Asistencia Móvil (React PWA)

Aplicación web progresiva (PWA) para el control de asistencia con geolocalización, diseñada con los colores corporativos de BFA. Soporta modo offline y sincronización con Supabase.

## Stack Tecnológico
- **Frontend:** React 19, TailwindCSS, Lucide Icons, Recharts.
- **Backend:** Supabase (Base de datos PostgreSQL + RLS).
- **Mapa/GPS:** Geolocation API + Haversine Formula (Local).

## 🚀 Conexión con Supabase

La aplicación ya está pre-configurada con las credenciales de tu proyecto Supabase:
- **URL:** `https://hsjtutlxrrohkjxbwfgd.supabase.co`
- **Key:** Configurada en `services/supabase.ts` (API Key corregida).

### Configuración de Base de Datos (Muy Importante)

Para que la aplicación funcione, debes ejecutar los scripts SQL generados en el **Supabase SQL Editor** en el siguiente orden estricto:

1.  **`supabase_01_cleanup.sql`**: Limpia instalaciones previas.
2.  **`supabase_02_tables.sql`**: Crea la estructura de datos.
3.  **`supabase_03_policies.sql`**: Configura los permisos de seguridad.
4.  **`supabase_04_indexes.sql`**: Optimiza el rendimiento.

## Uso de la Aplicación
1. **Configuración Inicial:** Al abrir la app por primera vez, ingresa tu código de empleado y ubicación de oficina.
2. **Marcaciones:** La app validará tu geolocalización y hora.
3. **Estado de Conexión:**
   - Icono Wifi Verde: Conectado a la nube.
   - Icono Wifi Naranja: Modo Offline (datos guardados localmente).

## Despliegue (Deploy)
Para subir esta aplicación a producción (Vercel, Netlify, etc.):
1. Sube este código a un repositorio (GitHub/GitLab).
2. Conecta el repositorio a tu servicio de hosting preferido.
3. El build script (`npm run build`) generará la carpeta `dist` lista para servir.