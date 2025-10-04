# Konfirmado 📅

**Pasarela de agendamiento multi-tenant con pagos integrados**

Konfirmado es una plataforma que permite a negocios reducir no-shows mediante cobro anticipado (parcial o total) antes de las citas. Integra Google Calendar para disponibilidad en tiempo real y Wompi para procesamiento de pagos.

> **Estado**: ✅ MVP Completo y Listo para Producción

## 🚀 Características

### ✅ Completamente Implementado

#### **Core Features**
- ✅ **Multi-tenant**: Cada cliente tiene su propia configuración aislada
- ✅ **Autenticación completa**: NextAuth con registro, login, recuperación de contraseña
- ✅ **Wizard de reserva** (5 pasos): Servicio → Profesional → Disponibilidad → Datos → Pago
- ✅ **Hold/Lock System**: Prevención de double-booking con holds temporales (10 min)
- ✅ **Responsive design**: Mobile-first con diseño de card moderno

#### **Panel de Administración**
- ✅ Branding personalizado (logo, colores, URLs)
- ✅ Gestión de servicios (CRUD con precios y % de anticipo)
- ✅ Gestión de profesionales (CRUD con horarios de negocio)
- ✅ Links de agendamiento (con preselección opcional)
- ✅ Visor de reservas con filtros

#### **Google Calendar Integration**
- ✅ OAuth flow para profesionales
- ✅ Lectura de disponibilidad en tiempo real (FreeBusy API)
- ✅ Creación automática de eventos
- ✅ Horarios de negocio configurables
- ✅ Timezone handling (America/Bogota)
- ✅ Detección y manejo de tokens expirados

#### **Wompi Payments**
- ✅ Checkout con firma de integridad
- ✅ Webhook handler con verificación
- ✅ Callback al comercio con reintentos
- ✅ Pagos parciales o totales

#### **Booking Management**
- ✅ **Cancelación**: Links seguros en email, webhook notification
- ✅ **Reagendamiento**: Selección de nueva fecha, actualización de calendario
- ✅ **Email notifications**: Confirmación, cancelación, reagendamiento
- ✅ **Calendar invitations**: .ics attachments en emails

#### **Seguridad**
- ✅ Encriptación AES-256-GCM para tokens
- ✅ Firmas HMAC-SHA256 para callbacks
- ✅ Validación Zod en todos los endpoints
- ✅ Tokens seguros para cancel/reschedule

## 📋 Requisitos Previos

- Node.js 18+ y pnpm
- PostgreSQL 14+
- Cuenta de Google Cloud (para Calendar API)
- Cuenta de Wompi (para pagos)

## 🛠️ Instalación

### 1. Clonar y configurar

```bash
git clone <repo-url>
cd konfirmado
pnpm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

**Variables de entorno requeridas:**

```env
# ============================================================================
# DATABASE
# ============================================================================
DATABASE_URL="postgresql://user:password@localhost:5432/konfirmado"

# ============================================================================
# NEXTAUTH (Authentication)
# ============================================================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<genera con: openssl rand -base64 32>"

# ============================================================================
# ENCRYPTION (para refresh tokens de Google)
# ============================================================================
ENCRYPTION_KEY="<32 caracteres aleatorios>"

# ============================================================================
# GOOGLE CALENDAR API
# ============================================================================
GOOGLE_CLIENT_ID="<tu-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<tu-client-secret>"

# ============================================================================
# APP CONFIGURATION
# ============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ============================================================================
# WEBHOOKS & CALLBACKS
# ============================================================================
CALLBACK_SECRET="<genera con: openssl rand -base64 32>"

# ============================================================================
# EMAIL (Resend) - OPCIONAL
# ============================================================================
RESEND_API_KEY="re_..."  # Opcional: para enviar emails
RESEND_FROM_EMAIL="noreply@tudominio.com"

# ============================================================================
# CRON JOBS - OPCIONAL
# ============================================================================
CRON_SECRET="<genera con: openssl rand -base64 32>"  # Para cleanup de holds

# ============================================================================
# WOMPI (Configurado por tenant en el panel admin)
# ============================================================================
# No se requieren variables de entorno globales
# Cada tenant configura sus propias llaves en el panel
```

**📚 Documentación detallada:**
- [Google Calendar Setup](./docs/GOOGLE_CALENDAR_SETUP.md)
- [Email Setup (Resend)](./docs/EMAIL_SETUP.md)
- [Wompi Setup](./docs/PLATFORM_WOMPI_SETUP.md)

### 3. Configurar Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita **Google Calendar API**
4. Crea credenciales OAuth 2.0:
   - Tipo: Web application
   - Redirect URI: `http://localhost:3000/api/calendar/callback`
5. Copia Client ID y Client Secret al `.env`

### 4. Configurar base de datos

```bash
# Crear base de datos
createdb konfirmado

# Ejecutar migraciones
pnpm prisma db push

# Generar cliente Prisma
pnpm prisma generate
```

### 5. Iniciar desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📖 Guía de Uso

### Para Administradores

1. **Registro inicial**:
   - Ve a `/auth/register`
   - Crea tu cuenta
   - Verifica tu email

2. **Configuración inicial**:
   - **Marca**: Logo, colores, URLs de privacidad/términos
   - **Integración**: URLs de callback y retorno
   - **Pagos**: Credenciales de Wompi (test o producción)

3. **Crear servicios**:
   - Nombre, descripción, imagen
   - Duración y precio
   - Tipo de cobro: Parcial (25-100%) o Total
   - Asignar profesionales

4. **Agregar profesionales**:
   - Nombre, descripción, foto
   - Asignar servicios
   - Generar link de invitación
   - Enviar link al profesional

5. **Generar links de agendamiento**:
   - Nombre del link (interno)
   - Preselección opcional de servicio/profesional
   - Fecha de expiración opcional
   - Copiar y compartir URL

### Para Profesionales

1. **Conectar calendario**:
   - Recibir link de invitación del admin
   - Hacer clic en "Conectar con Google Calendar"
   - Autorizar acceso (solo lectura)
   - ¡Listo! Tu disponibilidad se sincroniza automáticamente

### Para Clientes Finales

1. **Hacer una reserva**:
   - Abrir link de agendamiento
   - **Paso 1**: Seleccionar servicio y profesional
   - **Paso 2**: Elegir fecha y hora disponible
   - **Paso 3**: Ingresar datos personales
   - **Paso 4**: Pagar con Wompi
   - Recibir confirmación

## 🔧 Configuración de Wompi

### Modo Pruebas

1. Registrarse en [Wompi](https://comercios.wompi.co)
2. Ir a Developers → Llaves de prueba
3. Copiar:
   - Public Key (`pub_test_...`)
   - Private Key (`prv_test_...`)
   - Integrity Secret
   - Events Secret
4. Configurar webhook: `https://tu-dominio.com/api/webhooks/wompi`

### Tarjetas de Prueba

- **Aprobada**: 4242 4242 4242 4242
- **Rechazada**: 4111 1111 1111 1111
- CVV: cualquier 3 dígitos
- Fecha: cualquier fecha futura

## 🏗️ Arquitectura

```
konfirmado/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── bookings/      # Crear reservas
│   │   │   ├── availability/  # Consultar disponibilidad
│   │   │   ├── calendar/      # OAuth callback
│   │   │   ├── professionals/ # CRUD profesionales
│   │   │   ├── services/      # CRUD servicios
│   │   │   ├── booking-links/ # CRUD links
│   │   │   ├── tenant/        # Configuración tenant
│   │   │   └── webhooks/      # Wompi webhooks
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── dashboard/         # Panel admin
│   │   ├── book/              # Wizard de reserva
│   │   └── connect-calendar/  # Conexión de calendario
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades
│   │   ├── auth.ts           # NextAuth config
│   │   ├── prisma.ts         # Cliente Prisma
│   │   ├── google-calendar.ts # Google Calendar API
│   │   ├── wompi.ts          # Wompi utilities
│   │   └── encryption.ts     # AES-256-GCM
│   └── prisma/
│       └── schema.prisma     # Modelo de datos
```

## 📊 Modelo de Datos

- **Tenant**: Cliente multi-tenant
- **User**: Administradores
- **Service**: Servicios ofrecidos
- **Professional**: Profesionales/agentes
- **BookingLink**: Links de agendamiento
- **Booking**: Reservas
- **Payment**: Pagos
- **AuditLog**: Auditoría
- **Metric**: Métricas

## 🔐 Seguridad

- **Encriptación**: Refresh tokens y secrets con AES-256-GCM
- **Firmas**: HMAC-SHA256 para callbacks
- **Validación**: Zod schemas en todos los endpoints
- **Rate limiting**: Preparado (Upstash Redis)
- **HTTPS**: Obligatorio en producción
- **Scopes mínimos**: Solo lectura de calendarios

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel dashboard
# Actualizar NEXTAUTH_URL y NEXT_PUBLIC_APP_URL
```

### Docker

```bash
# Build
docker build -t konfirmado .

# Run
docker run -p 3000:3000 --env-file .env konfirmado
```

## 📚 Documentación

- **[AGENTS.md](./AGENTS.md)** - Especificación completa del proyecto y arquitectura
- **[Google Calendar Setup](./docs/GOOGLE_CALENDAR_SETUP.md)** - Configuración de Google Calendar API
- **[Email Setup](./docs/EMAIL_SETUP.md)** - Configuración de Resend para emails
- **[Wompi Setup](./docs/PLATFORM_WOMPI_SETUP.md)** - Configuración de pagos con Wompi
- **[Password Recovery](./docs/PASSWORD_RECOVERY.md)** - Sistema de recuperación de contraseña
- **[Cancellation Feature](./docs/CANCELLATION_FEATURE.md)** - Sistema de cancelación de reservas

## 🔄 Cron Jobs (Producción)

Para producción en Vercel, crea `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/cleanup-holds",
    "schedule": "*/5 * * * *"
  }]
}
```

Este job limpia holds expirados cada 5 minutos.

## 📈 Roadmap Futuro

### Mejoras Planeadas
- [ ] Admin bookings viewer (lista completa de reservas)
- [ ] Callback logs viewer (debugging de webhooks)
- [ ] Booking reminders (24h antes)
- [ ] Professional dashboard (ver sus propias reservas)
- [ ] Analytics avanzado
- [ ] Soporte para Outlook Calendar
- [ ] Soporte para Mercado Pago
- [ ] API pública para integraciones
- [ ] Exportación de reportes

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Propietario - Todos los derechos reservados

## 🆘 Soporte

Para soporte, contacta a [tu-email@ejemplo.com]

---

**Hecho con ❤️ por el equipo de Konfirmado**
