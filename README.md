# Jabvox Mail — Aplicación Web de Gestión de Correos con Gmail API

Aplicación web independiente para gestionar cuentas de correo electrónico de Gmail mediante **Google OAuth 2.0** y **Gmail API**. Cuenta con sistema propio de autenticación, panel multi-cuenta, experiencia visual inspirada en Gmail (responsive, moderno y limpio), y persistencia en base de datos PostgreSQL con Docker Compose.

---

## 🚀 Tecnologías y Arquitectura

- **Frontend & Backend**: Next.js 15 (App Router, React 19, TypeScript).
- **Estilos**: Tailwind CSS con paleta y diseño inspirados en Gmail.
- **Base de Datos**: PostgreSQL 16.
- **ORM**: Prisma 6 con modelos relacionales y tipado estricto.
- **Seguridad**:
  - Hashing de contraseñas con **Bcrypt**.
  - Cifrado simétrico autenticado **AES-256-GCM** para tokens de acceso y actualización de Google en reposo.
  - Sesiones seguras en base de datos con tokens aleatorios criptográficos (SHA-256) y cookies `httpOnly`, `sameSite=lax`, `secure`.
  - Sanitización estricta de HTML de correos con **DOMPurify** para prevenir XSS.
  - Validación de esquemas con **Zod**.
- **Integración Google**:
  - Google Cloud OAuth 2.0 (`googleapis`).
  - Renovación automática y transparente de tokens de acceso (`refresh_token`).
  - Detección de permisos revocados y gestión de estado.
- **Contenerización**: Docker y Docker Compose (multi-stage build optimizado).

---

## 📁 Estructura del Proyecto

```text
correo/
├── Dockerfile                   # Construcción multi-stage para producción
├── docker-compose.yml           # Orquestación de servicios (app + PostgreSQL)
├── package.json                 # Dependencias y scripts
├── tsconfig.json                # Configuración TypeScript
├── tailwind.config.js           # Configuración de estilos y colores
├── prisma/
│   └── schema.prisma            # Modelos de datos: User, Session, PasswordResetToken, ConnectedAccount
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Endpoints: registro, login, logout, me, perfil, recuperación
│   │   │   ├── accounts/        # Gestión de cuentas vinculadas y predeterminada
│   │   │   └── mail/            # Endpoints Gmail: mensajes, detalle, envío, borradores, adjuntos, lote
│   │   ├── auth/
│   │   │   ├── login/           # Pantalla de inicio de sesión
│   │   │   ├── register/        # Pantalla de registro de usuarios
│   │   │   ├── forgot-password/ # Solicitud de restablecimiento
│   │   │   └── reset-password/  # Restablecimiento de contraseña con token
│   │   ├── profile/             # Panel de usuario y administración de cuentas vinculadas
│   │   ├── mail/                # Bandeja de entrada y gestor principal
│   │   ├── globals.css          # Estilos globales y scrollbars
│   │   └── layout.tsx           # Layout raíz de la aplicación
│   ├── components/
│   │   └── mail/
│   │       ├── TopBar.tsx       # Barra superior con buscador en tiempo real y selector de cuentas
│   │       ├── Sidebar.tsx      # Menú lateral con carpetas (Recibidos, Destacados, etc.) y botón Redactar
│   │       ├── MailList.tsx     # Lista de correos con selección múltiple y acciones rápidas
│   │       ├── MailViewer.tsx   # Visor de correos con HTML seguro y descarga de adjuntos
│   │       ├── ComposeModal.tsx # Ventana flotante/expandible de redacción y auto-guardado
│   │       └── ConnectWelcome.tsx # Pantalla de bienvenida para vincular la primera cuenta
│   └── lib/
│       ├── auth.ts              # Control de sesiones, hashing y validaciones
│       ├── crypto.ts            # Cifrado AES-256-GCM y generación de tokens
│       ├── db.ts                # Instancia singleton de PrismaClient
│       ├── email.ts             # Envío de correos transaccionales (Nodemailer / fallback log)
│       └── gmail/
│           ├── oauth.ts         # Flujo Google OAuth 2.0 y renovación de tokens
│           └── service.ts       # Operaciones oficiales con Gmail API
```

---

## ⚙️ Configuración en Google Cloud Console

Para conectar cuentas de Gmail, se requiere registrar la aplicación en Google Cloud:

1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto (ej. `Jabvox Mail`).
3. En el menú de navegación, ve a **APIs y servicios > Biblioteca**.
4. Busca **Gmail API** y haz clic en **Habilitar**.
5. Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**:
   - Selecciona tipo de usuario **Externo** y haz clic en *Crear*.
   - Completa el nombre de la aplicación (`Jabvox Mail`) y tu correo de soporte.
   - En **Permisos (Scopes)**, agrega:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `https://www.googleapis.com/auth/gmail.modify`
   - En **Usuarios de prueba**, añade los correos de Gmail con los que probarás la aplicación.
6. Ve a **APIs y servicios > Credenciales**:
   - Haz clic en **Crear credenciales > ID de cliente de OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Cliente Jabvox Mail Web`.
   - **URI de redireccionamiento autorizados**:
     - `http://localhost:3000/api/auth/google/callback` (o tu dominio de producción).
   - Haz clic en *Crear* y copia el **ID de cliente** y el **Secreto de cliente**.

---

## 🔐 Variables de Entorno (`.env`)

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Configura los valores correspondientes:

```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://jabvox:jabvox_secret@localhost:5433/jabvox_mail?schema=public"
POSTGRES_DB="jabvox_mail"
POSTGRES_USER="jabvox"
POSTGRES_PASSWORD="jabvox_secret"
DB_PORT="5433"

# Aplicación
PORT="3000"
NEXTAUTH_URL="http://localhost:3000"
APP_SECRET="tu-clave-secreta-hex-de-64-caracteres"
ENCRYPTION_KEY="tu-clave-de-cifrado-aes256-hex-de-64-caracteres"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="tu-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# Servidor SMTP (Opcional, para envío de restablecimiento de contraseña)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="soporte@jabvox.com"
```

> **Generación rápida de claves criptográficas:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 🐳 Ejecución con Docker Compose

Para desplegar la base de datos y la aplicación web mediante contenedores:

```bash
# Iniciar servicios con compilación en segundo plano
docker compose up -d --build

# Verificar estado y logs
docker compose ps
docker compose logs -f web
```

La aplicación estará accesible en: `http://localhost:3000`

---

## 💻 Ejecución en Desarrollo Local

1. Iniciar la base de datos PostgreSQL:
   ```bash
   docker compose up -d db
   ```

2. Aplicar las migraciones a la base de datos:
   ```bash
   bun x prisma db push
   # o: npx prisma db push
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   bun dev
   # o: npm run dev
   ```

4. Abrir en el navegador:
   `http://localhost:3000`

---

## 🧪 Verificación y Pruebas

Se incluye un script de prueba integral que valida:
1. Hashing seguro y verificación de contraseñas.
2. Cifrado simétrico AES-256-GCM y descifrado de tokens OAuth.
3. Creación y consulta de usuarios en PostgreSQL.
4. Generación y validación de sesiones seguras.
5. Emisión y consumo único de tokens de recuperación de contraseña.
6. Vinculación de múltiples cuentas Gmail con aislamiento por usuario.
7. Construcción de URL de autorización OAuth 2.0 con prevención de CSRF.

Para ejecutar las pruebas:
```bash
bun run test-e2e.ts
```

---

## 🛡️ Criterios de Seguridad Implementados

- **Tokens en reposo**: Ni el token de acceso ni el token de actualización se almacenan en texto plano en la base de datos; ambos se cifran con AES-256-GCM y vector de inicialización único por registro.
- **Aislamiento multi-usuario**: Todas las consultas a mensajes, adjuntos, envío y cuentas verifican que la cuenta pertenezca estrictamente al usuario autenticado en la sesión.
- **Protección CSRF**: Los flujos OAuth 2.0 y restablecimiento de contraseña utilizan estados criptográficos firmados con expiración.
- **Sanitización HTML**: Los correos entrantes se limpian con DOMPurify antes de su renderizado, bloqueando etiquetas `<script>`, `<iframe>` u objetos potencialmente maliciosos.
- **Descarga segura de adjuntos**: Servidos mediante streaming en el backend con cabeceras `Content-Disposition: attachment` y tipos MIME validados.
