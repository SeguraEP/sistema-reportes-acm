# Sistema de Reportes ACM – SEGURA EP – PRM XVI

![Logo](./frontend/public/images/5.jpg)

Sistema web de gestión de reportes del Cuerpo de Agentes de Control Municipal, desarrollado con **Next.js**, **React**, **Material UI**, **Supabase** y un backend en **Node.js/Express**. Permite a los usuarios crear, consultar y administrar reportes operativos de manera segura y eficiente.

---

## Características principales

-  **Login/Registro** con autenticación de Supabase.  
-  **ID único para reportes** que no se repite.  
-  **Registro en base de datos** de todos los reportes.  
-  **Búsqueda de reportes propios** y acceso admin a todos los reportes.  
-  **Geolocalización**: captura coordenadas en reportes.  
-  **Hoja de vida digital** y tradicional (Word/PDF).  
-  **Datos automáticos del usuario** en los reportes.  
-  **Acceso a leyes y normativas** en ventana separada.  
-  **Almacenamiento de imágenes** en Supabase Storage.  
-  **Generación de documentos Word/PDF** desde la aplicación.  
-  **Interfaz responsive** usando **TailwindCSS** y **MUI**.  
-  **Seguridad**: RLS, autenticación JWT y permisos por roles.  
-  **API REST completa** con validaciones.  

---

## Tecnologías utilizadas

- **Frontend**: Next.js, React, Material UI, TailwindCSS, React Hook Form, Supabase JS.  
- **Backend**: Node.js, Express, Supabase, JWT, Bcrypt, Multer, PDFKit, Docx.  
- **Base de datos y almacenamiento**: Supabase (PostgreSQL + Storage).  

---

## Instalación y ejecución local

### 1. Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
```
### 2. Configurar backend

Ir a la carpeta backend/ y ejecutar:
```bash
npm install
```
### Crear un archivo .env en la raíz del backend con las siguientes variables:
# Supabase
SUPABASE_URL=<tu_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_role_key>
SUPABASE_ANON_KEY=<tu_anon_key>

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Seguridad
JWT_SECRET=<tu_jwt_secret>
SESSION_SECRET=<tu_session_secret>

# CORS
CORS_ORIGIN=http://localhost:3000

# Storage
MAX_FILE_SIZE=5242880
MAX_FILES=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif
### Iniciar servidor backend:
npm run dev

### 3. Configurar frontend

Ir a la carpeta frontend/ y ejecutar:
```bash
npm install
```
### Crear un archivo .env.local con las siguientes variables:
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<tu_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>

# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<tu_nextauth_secret>

# App
NEXT_PUBLIC_APP_NAME="Sistema de Reportes ACM"
## Iniciar frontend:
```bash
npm run dev
```
### Uso del sistema

1. Acceder al sistema en http://localhost:3000.

2. Crear una cuenta o iniciar sesión.

3. Consultar reportes existentes o crear nuevos.

4. Administradores pueden gestionar todos los reportes y usuarios.

5. El sistema muestra el estado del backend, base de datos y almacenamiento en tiempo real.
### Estado del sistema
El sistema verifica constantemente la conexión con:
Backend
Base de datos
Storage de archivos