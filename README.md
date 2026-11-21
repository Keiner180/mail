# Jabvox Mail & Calendar — Plataforma Empresarial Multi-Cuenta

Plataforma unificada e independiente para la gestión centralizada de correos electrónicos corporativos y personales (**Gmail** y **Outlook / Office 365**), calendario dinámico con integración de **Google Meet** y panel de monitoreo exclusivo para **Super Administradores**.

El servicio de correo y calendario está **100% integrado en la suscripción general de Jabvox**, permitiendo a cualquier usuario autenticado vincular múltiples cuentas sin bloqueos artificiales ni cobros por buzón adicional.

---

## 🚀 Características Principales

### 📧 Bandeja de Correo Multi-Cuenta (Webmail)
- **Multi-Proveedor Nativo**: Vinculación y sincronización de cuentas **Google (Gmail & Google Workspace)** y **Microsoft (Outlook, Hotmail & Office 365)** mediante sus APIs oficiales (Gmail API v1 y Microsoft Graph API).
- **Selector Rápido de Cuentas**: Alterna instantáneamente entre bandejas personales y de trabajo desde la barra superior sin recargar la sesión.
- **Sin Bloqueos de Planes**: Cuentas ilimitadas por usuario dentro del plan mensual de Jabvox.
- **Redacción Profesional**: Editor enriquecido con adjuntos, auto-guardado de borradores y atajos de teclado.
- **Buscador en Tiempo Real (`Ctrl + K`)**: Filtrado instantáneo por remitente, destinatario, asunto y carpetas.

### 📅 Calendario & Videollamadas
- **Google Calendar API v3**: Gestión de agenda, sincronización de eventos y visualización interactiva por mes, semana y día.
- **Google Meet Integrado**: Creación automática de salas de conferencias virtuales y generación instantánea de enlaces de videollamada al agendar reuniones.

### 🛡️ Panel Exclusivo de Super Administrador (`/admin`)
- **Acceso Restringido por Rol**: Solo visible y accesible para usuarios con privilegios `SUPER_ADMIN` o `PLATFORM_ADMIN`.
- **Directorio Global de Cuentas Vinculadas**: Monitoreo de todas las cuentas conectadas en el sistema (proveedor, correo, usuario propietario, estado de sincronización y fecha).
- **Directorio de Usuarios & Capacidad**: Control de usuarios registrados, cantidad de cuentas vinculadas y estado de cuenta.
- **Disponibilidad de Servicios Cloud**: Monitoreo del estado operativo de Gmail API, Google Calendar API, Google Meet API, Microsoft Graph API y base de datos PostgreSQL.
- **Supervisión de Cuotas y Límites Técnicos**: Información detallada de las cuotas de Google Cloud (15.000 req/día estándar, límites de envío anti-spam) y Microsoft Graph (10.000 req/10 min) para previsión de infraestructura.

### 🔐 Seguridad y Cifrado Enterprise
- **Cifrado AES-256-GCM Envelope**: Todos los tokens OAuth (Access y Refresh Tokens) se almacenan en reposo cifrados con algoritmo simétrico autenticado, vector de inicialización (IV) dinámico y tag de autenticación individual por cuenta.
- **Refresco Automático de Credenciales**: Renovación transparente de tokens OAuth antes de su expiración.
- **Aislamiento Estricto por Usuario**: Ningún usuario puede acceder a buzones, mensajes, sesiones o tokens de otro usuario.
- **Protección XSS & CSRF**: Sanitización de correos HTML con **DOMPurify** y verificación de estados criptográficos en los flujos OAuth.

---

## 🛠️ Tecnologías Utilizadas

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript).
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) con componentes optimizados y diseño responsive.
- **Base de Datos**: [PostgreSQL 16](https://www.postgresql.org/).
- **ORM**: [Prisma ORM 6](https://www.prisma.io/) con esquema relacional fuertemente tipado.
- **Integraciones Oficiales**:
  - `googleapis` (Gmail API v1, Google Calendar API v3).
  - `@microsoft/microsoft-graph-client` (Microsoft Graph API).
- **Criptografía**: Módulos nativos `node:crypto` (AES-256-GCM, SHA-256) y `bcryptjs`.
- **Iconografía**: [Lucide React](https://lucide.dev/).

---

## 📁 Estructura del Proyecto

```text
correo/
├── docker-compose.yml           # Orquestación de servicios (PostgreSQL + App)
├── Dockerfile                   # Build multi-stage para producción
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración de TypeScript
├── prisma/
│   └── schema.prisma            # Modelos: User, Session, ConnectedAccount, OAuthToken, CalendarEvent
├── src/
│   ├── app/
│   │   ├── admin/               # Panel Exclusivo Super Administrador
│   │   ├── api/
│   │   │   ├── admin/overview/  # Métricas, cuentas y servicios para Super Admin
│   │   │   ├── auth/            # Endpoints de autenticación y callbacks OAuth (Google / Microsoft)
│   │   │   ├── accounts/        # Gestión y desvinculación de cuentas
│   │   │   ├── calendar/        # Endpoints de eventos y sincronización de calendario
│   │   │   └── mail/            # Mensajes, hilos, envío, borradores y adjuntos
│   │   ├── auth/
│   │   │   ├── login/           # Inicio de sesión
│   │   │   └── register/        # Registro de usuarios
│   │   ├── calendar/            # Vista de Google Calendar y Meet
│   │   ├── mail/                # Bandeja de entrada Webmail
│   │   ├── profile/             # Gestión de perfil y cuentas vinculadas
│   │   └── layout.tsx           # Layout principal y providers
│   ├── components/
│   │   └── mail/
│   │       ├── TopBar.tsx       # Barra superior con buscador, selector multi-cuenta y perfil
│   │       ├── Sidebar.tsx      # Navegación por carpetas y botón Redactar
│   │       ├── MailList.tsx     # Listado interactivo de correos con acciones masivas
│   │       ├── MailViewer.tsx   # Visor de correos seguro con descarga de adjuntos
│   │       └── ComposeModal.tsx # Redactor de mensajes con soporte de adjuntos
│   └── lib/
│       ├── auth.ts              # Manejo de sesiones seguras y verificación de roles
│       ├── crypto.ts            # Motor criptográfico AES-256-GCM y hashing
│       ├── db.ts                # Cliente singleton de Prisma
│       ├── gmail/               # Servicios oficiales de Google OAuth y Gmail API
│       ├── outlook/             # Servicios oficiales de Microsoft OAuth y Graph API
│       └── calendar/            # Servicios de Google Calendar y Google Meet
```

---

## ⚙️ Configuración de Proveedores Cloud

### 1. Google Cloud Console (Gmail & Calendar API)
1. Accede a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona un proyecto (ej. `Jabvox Enterprise`).
3. En **APIs y servicios > Biblioteca**, habilita:
   - **Gmail API**
   - **Google Calendar API**
4. En **Pantalla de consentimiento de OAuth**:
   - Selecciona tipo **Externo**.
   - Agrega los scopes: `email`, `profile`, `https://mail.google.com/`, `https://www.googleapis.com/auth/calendar.events`, `https://www.googleapis.com/auth/calendar`.
5. En **Credenciales**, crea un **ID de cliente de OAuth** (tipo *Aplicación web*):
   - **URI de redireccionamiento autorizados**:
     `http://localhost:3005/api/auth/google/callback` (o tu URL de producción).
6. Copia el `Client ID` y `Client Secret` en tu archivo `.env`.

### 2. Microsoft Entra ID / Azure Portal (Outlook & Microsoft Graph)
1. Accede a [Microsoft Entra ID / Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Registra una nueva aplicación:
   - Tipos de cuenta compatibles: *Cuentas en cualquier directorio organizativo y cuentas Microsoft personales*.
   - **URI de redirección (Web)**:
     `http://localhost:3005/api/auth/microsoft/callback` (o tu URL de producción).
3. En **Certificados y secretos**, crea un nuevo *Secreto de cliente*.
4. En **Permisos de API**, agrega permisos delegados de **Microsoft Graph**:
   - `User.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.ReadWrite`, `offline_access`.
5. Copia el `Application (client) ID` y el `Client Secret` en tu archivo `.env`.

---

## 🔐 Variables de Entorno (`.env`)

Copia la plantilla de ejemplo:

```bash
cp .env.example .env
```

Configura tus credenciales en el archivo `.env`:

```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://jabvox:jabvox_secret@localhost:5433/jabvox_mail?schema=public"
POSTGRES_DB="jabvox_mail"
POSTGRES_USER="jabvox"
POSTGRES_PASSWORD="jabvox_secret"
DB_PORT="5433"

# Aplicación
PORT="3005"
NEXTAUTH_URL="http://localhost:3005"
NEXT_PUBLIC_APP_URL="http://localhost:3005"

# Claves criptográficas (32 bytes = 64 caracteres hexadecimales)
APP_SECRET="tu-clave-secreta-hex-de-64-caracteres"
ENCRYPTION_KEY="tu-clave-de-cifrado-aes256-hex-de-64-caracteres"

# Google Cloud OAuth 2.0
GOOGLE_CLIENT_ID="tu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3005/api/auth/google/callback"

# Microsoft Entra ID (Graph API)
MICROSOFT_CLIENT_ID="tu-microsoft-app-client-id"
MICROSOFT_CLIENT_SECRET="tu-microsoft-app-client-secret"
MICROSOFT_REDIRECT_URI="http://localhost:3005/api/auth/microsoft/callback"

# Servidor SMTP (Opcional para recuperación de contraseña)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="soporte@jabvox.com"
```

> **Generación de claves seguras de 256 bits:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 💻 Instalación y Ejecución

### Opción A: Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar la base de datos PostgreSQL:**
   ```bash
   docker compose up -d db
   ```

3. **Aplicar migraciones de Prisma:**
   ```bash
   npx prisma db push
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Acceder a la aplicación:**
   - Webmail y Bandeja de Entrada: [http://localhost:3005/mail](http://localhost:3005/mail)
   - Calendario: [http://localhost:3005/calendar](http://localhost:3005/calendar)
   - Panel Super Admin: [http://localhost:3005/admin](http://localhost:3005/admin)

---

### Opción B: Despliegue con Docker Compose

Para desplegar la aplicación completa (PostgreSQL + Contenedor de producción Next.js):

```bash
docker compose up -d --build
```

Para verificar logs y estado:
```bash
docker compose ps
docker compose logs -f web
```

---

## 🛡️ Criterios de Seguridad y Privacidad

- **Zero Plain-Text Secrets**: Ningún `access_token` ni `refresh_token` se guarda en texto plano en la base de datos.
- **Sin exposición de credenciales**: El archivo `.env` está estrictamente ignorado en `.gitignore`. Solo se versiona la plantilla de ejemplo `.env.example`.
- **Control de Roles**: El panel de administración valida la sesión a nivel de middleware y consulta de base de datos (`role === 'SUPER_ADMIN'`), impidiendo el acceso no autorizado.
- **Sanitización Robusta**: Bloqueo total de vectores de ataque XSS en cuerpos de correo electrónicos.
- **Límites de Proveedores**: Manejo preventivo de *Rate Limits* y reintentos automáticos mediante *Exponential Backoff* para cumplimiento de cuotas de Google Cloud y Microsoft Graph.

---

© 2026 Jabvox Enterprise. Todos los derechos reservados.
