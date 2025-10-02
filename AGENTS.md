
# 1) Visión y alcance (Konfirmado)

* **Qué es:** Konformado es Una **pasarela de agendamiento** (no un widget embebido) multi-tenant. Genera **links únicos** que llevan a un flujo estilo checkout: selección (servicio/profesional) → disponibilidad → datos → **pago (Wompi)** → confirmación → **callback** al comercio + **redirect**.
* **Para quién:** Comercios que necesitan reducir no-shows con cobro **parcial o total** antes de la cita (clínicas, inmobiliarias, consultorías, etc.).
* **Dónde corre:** **Next.js + TypeScript** (frontend + backend). Sin Python.
* **MVP acotado:** Solo **Google Calendar** (disponibilidad) y **Wompi** (pagos). Nada de Outlook ni Mercado Pago por ahora.

Fuera de alcance del MVP:

* Sin sincronización universal de calendarios (solo lectura/consulta con Google).
* Sin reprogramaciones/ cancelaciones automatizadas (se puede dejar manual).
* Sin facturación fiscal automática ni contabilidad.
* Sin marketplace/landing pública: esto es una pasarela ligada a links generados por el comercio.

---

# 2) Roles y flujos de acceso

* **Administrador del comercio (cliente):** accede a un **Panel** para configurar branding, servicios, profesionales, Wompi y generar links de agendamiento.
* **Profesional (médico/agente):** **no** entra al panel completo. Recibe un **link único** para conectar su **Google Calendar** vía OAuth. Fin.
* **Usuario final:** entra por un **link de agendamiento** y completa el wizard de 4 pasos hasta pagar y confirmar.

---

# 3) Panel de control (multi-tenant)

## 3.1 Branding

* Logo (PNG/SVG), colores primario/secundario.
* **URL de redirección** final (donde vuelve el usuario tras pagar y confirmar).
* Opcional: subdominio por cliente (`cliente.pasarela.com`).

## 3.2 Servicios

* Nombre, **descripción**, **imagen** (opcional).
* **Duración** (minutos).
* **Precio** (COP en MVP).
* **Tipo de cobro**: **parcial** (anticipo/penalización) o **total** (monto completo).
* Asignación de **profesionales** válidos para el servicio.

## 3.3 Profesionales

* Nombre, descripción/rol, **foto** opcional.
* **Estado de calendario**: `pendiente` / `conectado`.
* Acción “**Enviar invitación**” → genera **link único** de conexión a Google.

## 3.4 Pagos (Wompi)

* **Llave pública** y **privada** por cliente (su propia cuenta de Wompi).
* **Moneda**: COP (fijo en MVP).
* Modo **pruebas** / **producción**.

## 3.5 Generación de links

* Crear **link único** por campaña/caso de uso.
* **Parámetros opcionales** para **preseleccionar** `service` y/o `professional`.
* Expiración configurable (recomendado).

## 3.6 Visor de reservas (mínimo)

* Lista con estado: `pendiente`, `pagada`, `confirmada` (según webhook + callback).
* Búsqueda por fecha/servicio/profesional.

---

# 4) Flujo del usuario final (wizard)

1. **Selección**

   * Muestra servicios y profesionales asignados.
   * Si el link trae `service`/`professional`, se **precargan**; el usuario **puede cambiar**.

2. **Disponibilidad (Google Calendar)**

   * Consulta **FreeBusy API** con el **calendarId** del profesional en rango (ej. 7–14 días).
   * Se muestra grilla de **slots** compatibles con la **duración** del servicio.
   * **Prevención de double-booking**: al seleccionar un slot se aplica **“hold” temporal** (TTL corto) hasta completar pago (ver §11).

3. **Datos del usuario**

   * Campos obligatorios: **nombre**, **email**, **teléfono**.
   * **Aceptación de términos** (checkbox obligatorio, con enlace).
   * Validaciones mínimas (formato email/teléfono, required).

4. **Pago (Wompi)**

   * Monto = **parcial** o **total** según servicio.
   * Se genera transacción con **referencia única** y **redirección** al checkout de Wompi.
   * Tras pago: **webhook** → marcamos `pagada`.
   * **Pantalla de confirmación** y luego:

     * **Callback POST** al comercio (payload JSON), y
     * **Redirect** a la URL de retorno del comercio (con query `status=ok` y `ref=`).

**Nota realista:** el “hold” y la confirmación deben coordinarse para evitar que se reserven dos al mismo tiempo. Ver §11.

---

# 5) Autenticación de administradores (NextAuth)

* **Registro/Login** con **email+password**.
* **Verificación de email** (recomendable, no opcional en serio).
* **Recuperación de contraseña**: flujo “olvidé mi contraseña” con **token de un solo uso** y **expiración**.
* **Sesiones seguras** (cookies HTTPOnly, expiración).
* Opción futura (no MVP): login social/SSO.

**Profesionales** NO usan NextAuth: solo **OAuth de Google** para calendario mediante su **link de conexión**.

---

# 6) Integración con Google Calendar (solo lectura de disponibilidad)

* **Modelo:** Interfaz genérica de “Calendar Provider”, con **implementación MVP para Google**.
* **Conexión profesional:**

  * Admin crea profesional → sistema genera **link único** `https://pasarela.com/connect-calendar/{uuid}`.
  * Profesional ingresa, hace **OAuth** con su Google, selecciona calendario → guardamos **refresh_token** + **calendarId**.
  * Estado pasa a **conectado**.
* **Consulta de slots:**

  * Con **FreeBusy API** generamos disponibilidad real.
  * Convertimos a **intervalos** compatibles con la **duración del servicio**.
* **Privacidad:** Solo scopes de lectura necesarios. No se muestra agenda completa ni eventos.

**Decisión consciente:** no intentamos “crear” eventos en Google en el MVP. **Menos fricción, menos permisos**. El comercio recibe **callback** y decide qué hacer.

---

# 7) Pagos (Wompi) en MVP

* **Un solo proveedor** (Wompi) configurado **por cliente**.
* **Redirección** al checkout (no manejamos datos sensibles → evitamos PCI directo).
* **Webhooks** para estado de pago (`APPROVED`, `DECLINED`, etc.).
* **Montos**: parcial o total, definidos por servicio.
* **Idempotencia**: referencias únicas por intento.

**Realismo:** Wompi tiene sus propias particularidades (latencias, timeouts, callbacks tardíos). No des por hecho que el webhook llega en 2s. Diseña **reintentos** y **tolerancia a demora**.

---

# 8) Callback al comercio + Redirect final

* **Callback POST** (JSON) hacia la **URL del comercio** con firma (HMAC) y reintentos.
* **Redirect** del navegador a la URL de retorno configurada (`/gracias?status=ok&ref=...`).

**Ejemplo de payload (callback POST):**

```json
{
  "tenant_id": "cli_123",
  "booking_id": "bk_789",
  "servicio": {
    "id": "srv_001",
    "nombre": "Consulta general",
    "duracion_min": 30,
    "pago": "parcial",
    "precio": 120000,
    "monto_cobrado": 30000
  },
  "profesional": {
    "id": "pro_045",
    "nombre": "Dra. López"
  },
  "cita": {
    "inicio": "2025-10-10T15:00:00Z",
    "fin": "2025-10-10T15:30:00Z",
    "timezone": "America/Bogota"
  },
  "usuario": {
    "nombre": "Juan Pérez",
    "email": "juan@mail.com",
    "telefono": "+573001112233",
    "acepto_terminos": true
  },
  "pago": {
    "proveedor": "wompi",
    "estado": "aprobado",
    "referencia": "wmp_ABC123",
    "monto": 30000,
    "moneda": "COP"
  },
  "seguridad": {
    "timestamp": "2025-10-10T15:05:12Z",
    "firma_hmac": "c7a9f..."
  }
}
```

**Recomendación dura:** el comercio debe **verificar firma** y **guardar** antes de responder 200. Si devuelve 5xx, reintentamos (backoff).

---

# 9) Datos (modelo conceptual)

* **tenants** (clientes): branding, colores, domain/subdomain, **callback_url**, **return_url**, **wompi_keys**.
* **usuarios** (admins): email, hash_password, estado, **tenant_id**.
* **servicios**: nombre, desc, imagen, duración, precio, tipo_cobro, **tenant_id**.
* **profesionales**: nombre, desc, foto, **tenant_id**, estado_calendar, **calendar_provider** (“google”), **calendar_id**, **refresh_token**.
* **links_agendamiento**: id público, **tenant_id**, opcionales (service/professional), expiración, estado.
* **reservas**: **tenant_id**, **servicio_id**, **profesional_id**, usuario (nombre/email/teléfono), fecha/hora, estado (`pendiente`,`pagada`,`confirmada`), **hold_expires_at**.
* **pagos**: **tenant_id**, **reserva_id**, proveedor (“wompi”), referencia, monto, moneda, estado, raw_webhook.
* **auditoría**: logs clave (creación de link, conexión de calendario, intentos de pago, callbacks).

No compliques con 30 tablas ahora; **MVP pide lo mínimo sensato**.

---

# 10) Seguridad y cumplimiento (pragmático)

* **No tocamos tarjetas**: redirección a Wompi → evitamos PCI scope directo.
* **Firmas HMAC** en callbacks; **HTTPS** obligatorio.
* **JWT o firmas temporales** en links de conexión y agendamiento (con **expiración**).
* **Rate-limits** básicos en endpoints públicos (para evitar abuso).
* **Cifrado** en reposo de **refresh_token** de Google.
* **Habeas Data/GDPR**: política de privacidad, consentimiento de términos, borrado de datos a solicitud.

---

# 11) Riesgos operativos y edge cases (donde se rompe todo)

* **Double-booking**: dos usuarios eligen mismo slot.

  * Mitigación: **hold** (bloqueo suave) al seleccionar slot, con TTL (ej. 5–10 min).
  * Confirmación de reserva solo tras **webhook aprobado**. Si expira el hold o falla pago → **liberar** slot.
* **Webhook tardío o perdido**:

  * Reintentos y endpoint idempotente.
  * Estado `pendiente_pago` con expiración; pantalla intermedia que explica “estamos confirmando pago”.
* **Refresh token inválido/caducado** (Google):

  * Mostrar al admin/profesional **estado rojo** y botón “reconectar”.
* **Wompi en mantenimiento**:

  * Mensaje claro y **fallback** “reintente más tarde”.
* **Links de agendamiento compartidos públicamente**:

  * Expiración y/o cuota de usos; verificación anti-bots mínima (captcha ligero si hay abuso).
* **Husos horarios**:

  * Persistir en **UTC** y renderizar en **America/Bogota** (o la del tenant).
  * Validar TZ del profesional vs. TZ del comercio.

Si algo aquí se ignora, la plataforma parecerá inestable. Mejor ser estrictos.

---

# 12) Métricas y analítica (mínimo viable que sí sirve)

* **Conversiones** por link: visitas → selección slot → pago iniciado → pago aprobado.
* **No-show proxy**: ratio de pagos parciales vs. totales (proxy de intención).
* **Latencia** webhook Wompi (mediana/p95).
* **Fallos** de OAuth Google y reconexiones necesarias.

Estas métricas cuentan la **salud real** del sistema.

---

# 13) Accesibilidad y UX

* Wizard **mobile-first**, pasos simples, textos cortos.
* Estados claros: “slot retenido”, “procesando pago”, “pago confirmado”, “pago rechazado”.
* Errores en humano, no en jerga técnica.

---

# 14) Roadmap por fases (realista)

* **Fase 0 – Base (1–2 semanas):**
  Autenticación admins (NextAuth), tenants básicos, servicios, profesionales (sin calendario), branding, Wompi config, generación de links.

* **Fase 1 – Disponibilidad (1–2 semanas):**
  OAuth Google por profesional, FreeBusy → slots, holds y expiraciones.

* **Fase 2 – Pagos y confirmación (1–2 semanas):**
  Integración completa Wompi (redirect + webhook + idempotencia), callback + redirect al comercio, vistas de confirmación.

* **Fase 3 – Sólidos (1–2 semanas):**
  Auditoría, métricas básicas, reintentos robustos, UX de estados, hardening de seguridad.

* **Futuro:** Outlook Provider, Mercado Pago, reprogramaciones, recordatorios, analítica avanzada.

*(Los tiempos dependen de equipo y profundidad; aquí no hay magia.)*

---

# 15) Criterios de aceptación del MVP (lo mínimo que “sí” es producto)

1. Admin puede crear tenant, entrar con NextAuth, **recuperar contraseña** y configurar: branding, servicios, profesionales, Wompi.
2. Admin puede **invitar profesional** y este **conecta Google** con éxito.
3. Admin genera **link**; usuario final completa **4 pasos** y **paga**.
4. Sistema recibe **webhook**, actualiza estado de reserva y ejecuta **callback POST** firmado + **redirect** al comercio.
5. Se evita **double-booking** con **hold** + liberación si falla/expira.
6. Logs mínimos y métricas básicas operativas.

Si todo lo anterior funciona de forma estable, **tienes MVP**.

---

# 16) Riesgos clave (sin maquillaje)

* **Calendarios reales** son caóticos: eventos last-minute rompen slots si no actualizas en vivo.
* **Wompi** puede tardar en confirmar; si la UX no lo explica, la gente se frustra.
* **Multi-tenant** con llaves de pago mal configuradas = dinero al hoyo; requiere validaciones.
* **Husos horarios** mal tratados → citas a la hora equivocada.
* **Seguridad floja** en links/token → spam/abuso.
* **Sin reprogramación/cancelación** en MVP: habrá solicitudes manuales (debes tener respuesta).

---

# 17) Extensiones futuras obvias

* **Outlook / Microsoft Graph** como `OutlookCalendarProvider`.
* **Mercado Pago** y/o **DLocal** via `PaymentProvider` extensible.
* **Recordatorios** (email/WhatsApp) y reprogramación/cancelación.
* **Bloqueo automático** del slot en Google (crear evento con “tentative”) si decides pedir más permisos.

---

# 18) Conclusión franca

El diseño es **suficientemente simple para llegar a producción** y **lo bastante modular** para crecer. La clave del MVP es **no pasarse**: Google Calendar solo lectura, Wompi único, holds para evitar choques y **NextAuth completo (incluyendo recuperación de contraseña)**.
Si fallas en holds, webhooks o TZ, te vas a comer quejas. Si clavas esos tres, el resto fluye.
