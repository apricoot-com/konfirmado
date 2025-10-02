# Konfirmado - Implementation Plan

## Executive Summary

**Konfirmado** is a multi-tenant booking gateway built with **Next.js + TypeScript** that generates unique booking links leading to a checkout-style flow: service/professional selection → availability → user data → **Wompi payment** → confirmation → callback to merchant + redirect.

**Target:** Businesses needing to reduce no-shows with partial or total pre-payment (clinics, real estate, consultancies).

**MVP Scope:** Google Calendar (availability only) + Wompi (payments). No Outlook, Mercado Pago, rescheduling, or invoicing.

---

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Calendar:** Google Calendar API (FreeBusy)
- **Payments:** Wompi (redirect + webhooks)
- **Styling:** TailwindCSS + shadcn/ui
- **Deployment:** Vercel/Railway (recommended)

---

## Phase 0: Foundation (1-2 weeks)

### 0.1 Project Setup

**Tasks:**
- Initialize Next.js 14 with TypeScript and App Router
- Configure Prisma with PostgreSQL
- Setup TailwindCSS + shadcn/ui
- Configure ESLint, Prettier
- Setup environment variables structure

**Deliverables:**
- `/app` directory structure
- `prisma/schema.prisma` with initial models
- `package.json` with dependencies
- `.env.example` template

**Dependencies:**
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "next-auth": "^5.0.0-beta",
  "tailwindcss": "^3.4.0",
  "zod": "^3.22.0"
}
```

---

### 0.2 Authentication (NextAuth)

**Requirements:**
- Email + password registration/login
- Email verification (mandatory)
- Password recovery with single-use tokens (expiration)
- Secure sessions (HTTPOnly cookies)

**Database Models:**
```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  password          String    // bcrypt hashed
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([tenantId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

**API Routes:**
- `POST /api/auth/register` - Create account + send verification email
- `POST /api/auth/verify-email` - Verify email token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset with token
- NextAuth routes at `/api/auth/[...nextauth]`

**Security:**
- bcrypt for password hashing (cost factor 12)
- CSRF protection via NextAuth
- Rate limiting on auth endpoints (5 attempts/15min)

---

### 0.3 Multi-Tenant Foundation

**Database Model:**
```prisma
model Tenant {
  id                String    @id @default(cuid())
  name              String
  subdomain         String?   @unique
  
  // Branding
  logoUrl           String?
  primaryColor      String    @default("#3B82F6")
  secondaryColor    String    @default("#10B981")
  
  // URLs
  callbackUrl       String    // Where to POST booking data
  returnUrl         String    // Where to redirect user after payment
  
  // Wompi config
  wompiPublicKey    String?
  wompiPrivateKey   String?   @db.Text // Encrypted
  wompiMode         String    @default("test") // test | production
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  users             User[]
  services          Service[]
  professionals     Professional[]
  bookingLinks      BookingLink[]
  bookings          Booking[]
  payments          Payment[]
}
```

**Middleware:**
- `/middleware.ts` - Extract tenant from subdomain or session
- Inject `tenantId` into all authenticated requests
- Enforce tenant isolation in all queries

**Implementation:**
```typescript
// lib/tenant.ts
export async function getTenantFromRequest(req: Request) {
  const hostname = req.headers.get('host')
  const subdomain = hostname?.split('.')[0]
  
  if (subdomain && subdomain !== 'www') {
    return await prisma.tenant.findUnique({ where: { subdomain } })
  }
  
  // Fallback to session tenant
  const session = await getServerSession()
  if (session?.user?.tenantId) {
    return await prisma.tenant.findUnique({ 
      where: { id: session.user.tenantId } 
    })
  }
  
  return null
}
```

---

### 0.4 Branding Configuration

**Admin Panel UI:**
- `/app/dashboard/settings/branding/page.tsx`

**Features:**
- Logo upload (PNG/SVG, max 2MB) → S3/Cloudinary
- Color pickers for primary/secondary colors
- Callback URL input (validated HTTPS)
- Return URL input (validated HTTPS)
- Optional subdomain (alphanumeric, availability check)

**API Routes:**
- `PATCH /api/tenant/branding` - Update branding settings
- `POST /api/tenant/logo` - Upload logo

**Validation:**
```typescript
const BrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  callbackUrl: z.string().url().startsWith('https://'),
  returnUrl: z.string().url().startsWith('https://'),
  subdomain: z.string().regex(/^[a-z0-9-]+$/).optional()
})
```

---

### 0.5 Services CRUD

**Database Model:**
```prisma
model Service {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  name            String
  description     String    @db.Text
  imageUrl        String?
  durationMinutes Int
  price           Int       // COP cents (e.g., 120000 = $120.000 COP)
  chargeType      String    // "partial" | "total"
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  professionals   ServiceProfessional[]
  bookings        Booking[]
  
  @@index([tenantId])
}

model ServiceProfessional {
  serviceId       String
  professionalId  String
  service         Service      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  @@id([serviceId, professionalId])
}
```

**Admin Panel:**
- `/app/dashboard/services/page.tsx` - List view
- `/app/dashboard/services/new/page.tsx` - Create form
- `/app/dashboard/services/[id]/edit/page.tsx` - Edit form

**API Routes:**
- `GET /api/services` - List all (tenant-scoped)
- `POST /api/services` - Create
- `PATCH /api/services/[id]` - Update
- `DELETE /api/services/[id]` - Delete (soft delete recommended)

**Validation:**
```typescript
const ServiceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().int().min(0),
  chargeType: z.enum(['partial', 'total']),
  professionalIds: z.array(z.string().cuid())
})
```

---

### 0.6 Professionals CRUD

**Database Model:**
```prisma
model Professional {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  
  name              String
  description       String?   @db.Text
  photoUrl          String?
  
  // Calendar integration
  calendarStatus    String    @default("pending") // pending | connected | error
  calendarProvider  String    @default("google")
  calendarId        String?
  refreshToken      String?   @db.Text // Encrypted
  connectionToken   String?   @unique // For OAuth flow
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  services          ServiceProfessional[]
  bookings          Booking[]
  
  @@index([tenantId])
  @@index([connectionToken])
}
```

**Admin Panel:**
- `/app/dashboard/professionals/page.tsx` - List with calendar status badges
- `/app/dashboard/professionals/new/page.tsx` - Create form
- `/app/dashboard/professionals/[id]/edit/page.tsx` - Edit form
- "Send Invitation" button → generates connection link

**API Routes:**
- `GET /api/professionals` - List all (tenant-scoped)
- `POST /api/professionals` - Create
- `PATCH /api/professionals/[id]` - Update
- `POST /api/professionals/[id]/invite` - Generate connection link

**Connection Link Format:**
```
https://konfirmado.com/connect-calendar/{connectionToken}
```

---

### 0.7 Wompi Configuration

**Admin Panel:**
- `/app/dashboard/settings/payments/page.tsx`

**Features:**
- Public key input
- Private key input (masked, encrypted at rest)
- Mode toggle (test/production)
- Test connection button

**Encryption:**
```typescript
// lib/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
```

**API Routes:**
- `PATCH /api/tenant/payments` - Update Wompi config
- `POST /api/tenant/payments/test` - Test connection

---

### 0.8 Booking Links Generation

**Database Model:**
```prisma
model BookingLink {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  publicId        String    @unique @default(cuid())
  name            String    // Internal reference
  
  // Preselection (optional)
  serviceId       String?
  professionalId  String?
  
  expiresAt       DateTime?
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  bookings        Booking[]
  
  @@index([tenantId])
  @@index([publicId])
}
```

**Admin Panel:**
- `/app/dashboard/links/page.tsx` - List with copy button
- `/app/dashboard/links/new/page.tsx` - Create form

**Link Format:**
```
https://konfirmado.com/book/{publicId}
?service={serviceId}&professional={professionalId}
```

**JWT Signing (optional enhancement):**
```typescript
import jwt from 'jsonwebtoken'

export function generateBookingLink(linkId: string, tenantId: string) {
  const token = jwt.sign(
    { linkId, tenantId },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )
  
  return `${process.env.NEXT_PUBLIC_APP_URL}/book/${token}`
}
```

**API Routes:**
- `GET /api/booking-links` - List all
- `POST /api/booking-links` - Create
- `PATCH /api/booking-links/[id]` - Update
- `DELETE /api/booking-links/[id]` - Deactivate

---

## Phase 1: Availability (1-2 weeks)

### 1.1 Google OAuth Flow

**Flow:**
1. Admin creates professional → system generates `connectionToken`
2. Admin sends link to professional: `/connect-calendar/{connectionToken}`
3. Professional lands on page, clicks "Connect Google Calendar"
4. OAuth redirect to Google with scopes: `calendar.readonly`, `calendar.freebusy`
5. Google redirects back to `/api/auth/google/callback`
6. Store `refresh_token` (encrypted) + selected `calendarId`
7. Update professional status to `connected`

**OAuth Configuration:**
```typescript
// lib/google-oauth.ts
import { google } from 'googleapis'

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
)

export function getAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.freebusy'
    ],
    state,
    prompt: 'consent' // Force to get refresh_token
  })
}
```

**API Routes:**
- `GET /connect-calendar/[token]` - Landing page
- `GET /api/auth/google/connect` - Initiate OAuth
- `GET /api/auth/google/callback` - Handle OAuth callback

**Security:**
- `connectionToken` expires after 7 days
- Verify token before OAuth initiation
- Store `state` parameter to prevent CSRF

---

### 1.2 Calendar Provider Interface

**Abstract Interface:**
```typescript
// lib/calendar/types.ts
export interface CalendarProvider {
  getAvailableSlots(params: {
    calendarId: string
    refreshToken: string
    startDate: Date
    endDate: Date
    durationMinutes: number
    timezone: string
  }): Promise<TimeSlot[]>
  
  refreshAccessToken(refreshToken: string): Promise<string>
}

export interface TimeSlot {
  start: Date
  end: Date
}
```

**Google Implementation:**
```typescript
// lib/calendar/google-provider.ts
import { google } from 'googleapis'
import { CalendarProvider, TimeSlot } from './types'

export class GoogleCalendarProvider implements CalendarProvider {
  async getAvailableSlots(params) {
    const { calendarId, refreshToken, startDate, endDate, durationMinutes } = params
    
    // Refresh access token
    const accessToken = await this.refreshAccessToken(refreshToken)
    
    // Query FreeBusy
    const calendar = google.calendar({ version: 'v3' })
    const response = await calendar.freebusy.query({
      auth: accessToken,
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: calendarId }]
      }
    })
    
    const busySlots = response.data.calendars?.[calendarId]?.busy || []
    
    // Generate available slots
    return this.generateSlots(startDate, endDate, busySlots, durationMinutes)
  }
  
  async refreshAccessToken(refreshToken: string): Promise<string> {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token!
  }
  
  private generateSlots(
    start: Date,
    end: Date,
    busySlots: Array<{ start: string; end: string }>,
    duration: number
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const slotDuration = duration * 60 * 1000 // Convert to ms
    
    let current = new Date(start)
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + slotDuration)
      
      // Check if slot overlaps with any busy period
      const isAvailable = !busySlots.some(busy => {
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        return current < busyEnd && slotEnd > busyStart
      })
      
      if (isAvailable) {
        slots.push({ start: new Date(current), end: slotEnd })
      }
      
      // Move to next slot (15-min intervals)
      current = new Date(current.getTime() + 15 * 60 * 1000)
    }
    
    return slots
  }
}
```

---

### 1.3 Slot Generation with Timezone Handling

**Requirements:**
- Store all dates in UTC
- Display in `America/Bogota` (or tenant timezone)
- Query FreeBusy for 7-14 days ahead
- Filter business hours (configurable per professional)

**Implementation:**
```typescript
// lib/slots.ts
import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz'

export async function getAvailableSlots(
  professionalId: string,
  serviceId: string,
  timezone: string = 'America/Bogota'
) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { services: { where: { serviceId } } }
  })
  
  if (!professional || professional.calendarStatus !== 'connected') {
    throw new Error('Professional calendar not connected')
  }
  
  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) throw new Error('Service not found')
  
  // Query range: next 14 days
  const now = new Date()
  const startDate = zonedTimeToUtc(now, timezone)
  const endDate = zonedTimeToUtc(
    new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    timezone
  )
  
  const provider = new GoogleCalendarProvider()
  const slots = await provider.getAvailableSlots({
    calendarId: professional.calendarId!,
    refreshToken: decrypt(professional.refreshToken!),
    startDate,
    endDate,
    durationMinutes: service.durationMinutes,
    timezone
  })
  
  // Convert back to tenant timezone for display
  return slots.map(slot => ({
    start: utcToZonedTime(slot.start, timezone),
    end: utcToZonedTime(slot.end, timezone),
    startISO: slot.start.toISOString(),
    endISO: slot.end.toISOString()
  }))
}
```

**API Route:**
- `GET /api/availability?professional={id}&service={id}` - Get slots

---

### 1.4 Slot Hold Mechanism

**Database Model:**
```prisma
model SlotHold {
  id              String    @id @default(cuid())
  professionalId  String
  serviceId       String
  
  startTime       DateTime
  endTime         DateTime
  
  expiresAt       DateTime
  sessionId       String    // Browser session or temp user ID
  
  createdAt       DateTime  @default(now())
  
  @@index([professionalId, startTime])
  @@index([expiresAt])
}
```

**Implementation:**
```typescript
// lib/holds.ts
export async function createSlotHold(
  professionalId: string,
  serviceId: string,
  startTime: Date,
  endTime: Date,
  sessionId: string
): Promise<SlotHold> {
  // Check for existing holds or bookings
  const conflicts = await prisma.$transaction([
    prisma.slotHold.findFirst({
      where: {
        professionalId,
        expiresAt: { gt: new Date() },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      }
    }),
    prisma.booking.findFirst({
      where: {
        professionalId,
        status: { in: ['pending', 'paid', 'confirmed'] },
        OR: [
          { startTime: { lt: endTime }, endTime: { gt: startTime } }
        ]
      }
    })
  ])
  
  if (conflicts[0] || conflicts[1]) {
    throw new Error('Slot no longer available')
  }
  
  // Create hold with 10-minute TTL
  return await prisma.slotHold.create({
    data: {
      professionalId,
      serviceId,
      startTime,
      endTime,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      sessionId
    }
  })
}

export async function releaseExpiredHolds() {
  await prisma.slotHold.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  })
}
```

**Cron Job:**
```typescript
// app/api/cron/cleanup-holds/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  await releaseExpiredHolds()
  
  return Response.json({ success: true })
}
```

**Vercel Cron:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-holds",
    "schedule": "*/5 * * * *"
  }]
}
```

**API Routes:**
- `POST /api/holds` - Create hold
- `DELETE /api/holds/[id]` - Release hold

---

### 1.5 User Wizard Steps 1 & 2

**Step 1: Service/Professional Selection**

**Route:** `/book/[linkId]/select`

**UI Components:**
- Service cards with image, name, description, price, duration
- Professional cards with photo, name, description
- If preselected via query params, show selected but allow change

**API:**
- `GET /api/booking/[linkId]/options` - Get available services/professionals

**Step 2: Availability Calendar**

**Route:** `/book/[linkId]/availability`

**UI Components:**
- Date picker (next 14 days)
- Time slot grid (mobile-first, scrollable)
- Selected slot highlighted
- "Hold slot" button

**State Management:**
```typescript
// app/book/[linkId]/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookingState {
  linkId: string
  serviceId: string | null
  professionalId: string | null
  selectedSlot: { start: Date; end: Date } | null
  holdId: string | null
  
  setService: (id: string) => void
  setProfessional: (id: string) => void
  setSlot: (slot: { start: Date; end: Date }) => void
  setHold: (id: string) => void
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      linkId: '',
      serviceId: null,
      professionalId: null,
      selectedSlot: null,
      holdId: null,
      
      setService: (id) => set({ serviceId: id }),
      setProfessional: (id) => set({ professionalId: id }),
      setSlot: (slot) => set({ selectedSlot: slot }),
      setHold: (id) => set({ holdId: id })
    }),
    { name: 'booking-state' }
  )
)
```

---

## Phase 2: Payments & Confirmation (1-2 weeks)

### 2.1 User Wizard Step 3: User Data

**Route:** `/book/[linkId]/details`

**Form Fields:**
```typescript
const UserDataSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+57[0-9]{10}$/), // Colombian format
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'Debe aceptar los términos' })
  })
})
```

**UI Components:**
- Name input
- Email input
- Phone input (with format hint)
- Terms checkbox with link to `/terms`
- "Continue to payment" button

**Validation:**
- Client-side with Zod + React Hook Form
- Server-side validation before creating booking

---

### 2.2 Wompi Payment Integration

**Booking Creation:**
```typescript
// lib/bookings.ts
export async function createBooking(data: {
  linkId: string
  serviceId: string
  professionalId: string
  startTime: Date
  endTime: Date
  holdId: string
  user: {
    name: string
    email: string
    phone: string
  }
}) {
  const link = await prisma.bookingLink.findUnique({
    where: { publicId: data.linkId },
    include: { tenant: true }
  })
  
  if (!link || !link.isActive) {
    throw new Error('Invalid booking link')
  }
  
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId }
  })
  
  if (!service) throw new Error('Service not found')
  
  // Calculate amount
  const amount = service.chargeType === 'partial' 
    ? Math.floor(service.price * 0.25) // 25% for partial
    : service.price
  
  // Create booking
  const booking = await prisma.booking.create({
    data: {
      tenantId: link.tenantId,
      linkId: link.id,
      serviceId: data.serviceId,
      professionalId: data.professionalId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'pending',
      userName: data.user.name,
      userEmail: data.user.email,
      userPhone: data.user.phone,
      acceptedTerms: true,
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  })
  
  // Delete hold
  await prisma.slotHold.delete({ where: { id: data.holdId } })
  
  return { booking, amount, tenant: link.tenant }
}
```

**Wompi Transaction:**
```typescript
// lib/wompi.ts
import crypto from 'crypto'

export async function createWompiTransaction(
  booking: Booking,
  amount: number,
  tenant: Tenant
) {
  const reference = `bk_${booking.id}_${Date.now()}`
  
  // Generate integrity signature
  const integrityString = `${reference}${amount}COP${tenant.wompiPublicKey}`
  const integrity = crypto
    .createHash('sha256')
    .update(integrityString)
    .digest('hex')
  
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${booking.id}/confirm`
  
  // Create payment record
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      bookingId: booking.id,
      provider: 'wompi',
      reference,
      amount,
      currency: 'COP',
      status: 'pending'
    }
  })
  
  // Build Wompi checkout URL
  const wompiUrl = new URL('https://checkout.wompi.co/p/')
  wompiUrl.searchParams.set('public-key', tenant.wompiPublicKey!)
  wompiUrl.searchParams.set('currency', 'COP')
  wompiUrl.searchParams.set('amount-in-cents', (amount * 100).toString())
  wompiUrl.searchParams.set('reference', reference)
  wompiUrl.searchParams.set('redirect-url', redirectUrl)
  wompiUrl.searchParams.set('signature:integrity', integrity)
  
  return {
    reference,
    checkoutUrl: wompiUrl.toString()
  }
}
```

**API Route:**
- `POST /api/bookings` - Create booking + redirect to Wompi

---

### 2.3 Wompi Webhook Handler

**Route:** `POST /api/webhooks/wompi`

**Implementation:**
```typescript
// app/api/webhooks/wompi/route.ts
import { headers } from 'next/headers'
import crypto from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('x-wompi-signature')
  
  // Verify signature (if Wompi provides it)
  // const isValid = verifyWompiSignature(body, signature)
  // if (!isValid) return new Response('Invalid signature', { status: 401 })
  
  const event = JSON.parse(body)
  
  // Idempotency check
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { externalId: event.data.id }
  })
  
  if (existingEvent) {
    return Response.json({ received: true })
  }
  
  // Store event
  await prisma.webhookEvent.create({
    data: {
      externalId: event.data.id,
      provider: 'wompi',
      type: event.event,
      payload: event,
      processedAt: null
    }
  })
  
  // Process based on event type
  if (event.event === 'transaction.updated') {
    await handleTransactionUpdate(event.data)
  }
  
  return Response.json({ received: true })
}

async function handleTransactionUpdate(data: any) {
  const reference = data.reference
  const status = data.status // APPROVED, DECLINED, ERROR, VOIDED
  
  const payment = await prisma.payment.findFirst({
    where: { reference },
    include: { booking: { include: { tenant: true } } }
  })
  
  if (!payment) {
    console.error('Payment not found for reference:', reference)
    return
  }
  
  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: status.toLowerCase(),
      rawWebhook: data
    }
  })
  
  // Update booking status
  if (status === 'APPROVED') {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'paid' }
    })
    
    // Trigger callback to merchant
    await sendMerchantCallback(payment.booking)
  } else if (status === 'DECLINED' || status === 'ERROR') {
    // Release slot
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'failed' }
    })
  }
}
```

**Webhook Event Model:**
```prisma
model WebhookEvent {
  id          String    @id @default(cuid())
  externalId  String    @unique
  provider    String
  type        String
  payload     Json
  processedAt DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([externalId])
}
```

---

### 2.4 Callback to Merchant

**Implementation:**
```typescript
// lib/callbacks.ts
import crypto from 'crypto'

export async function sendMerchantCallback(booking: Booking & {
  tenant: Tenant
  service: Service
  professional: Professional
  payment: Payment
}) {
  const payload = {
    tenant_id: booking.tenantId,
    booking_id: booking.id,
    servicio: {
      id: booking.service.id,
      nombre: booking.service.name,
      duracion_min: booking.service.durationMinutes,
      pago: booking.service.chargeType,
      precio: booking.service.price,
      monto_cobrado: booking.payment.amount
    },
    profesional: {
      id: booking.professional.id,
      nombre: booking.professional.name
    },
    cita: {
      inicio: booking.startTime.toISOString(),
      fin: booking.endTime.toISOString(),
      timezone: 'America/Bogota'
    },
    usuario: {
      nombre: booking.userName,
      email: booking.userEmail,
      telefono: booking.userPhone,
      acepto_terminos: booking.acceptedTerms
    },
    pago: {
      proveedor: 'wompi',
      estado: 'aprobado',
      referencia: booking.payment.reference,
      monto: booking.payment.amount,
      moneda: 'COP'
    },
    seguridad: {
      timestamp: new Date().toISOString(),
      firma_hmac: ''
    }
  }
  
  // Generate HMAC signature
  const secret = process.env.CALLBACK_SECRET!
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  payload.seguridad.firma_hmac = signature
  
  // Send with retries
  await sendWithRetry(booking.tenant.callbackUrl, payload, booking.id)
}

async function sendWithRetry(
  url: string,
  payload: any,
  bookingId: string,
  attempt: number = 1
) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10s timeout
    })
    
    if (!response.ok && attempt < 5) {
      // Exponential backoff: 2s, 4s, 8s, 16s
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendWithRetry(url, payload, bookingId, attempt + 1)
    }
    
    // Log result
    await prisma.callbackLog.create({
      data: {
        bookingId,
        url,
        payload,
        statusCode: response.status,
        attempts: attempt,
        success: response.ok
      }
    })
    
    if (response.ok) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed' }
      })
    }
  } catch (error) {
    console.error('Callback failed:', error)
    
    if (attempt < 5) {
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendWithRetry(url, payload, bookingId, attempt + 1)
    }
  }
}
```

**Callback Log Model:**
```prisma
model CallbackLog {
  id         String   @id @default(cuid())
  bookingId  String
  booking    Booking  @relation(fields: [bookingId], references: [id])
  url        String
  payload    Json
  statusCode Int?
  attempts   Int
  success    Boolean
  createdAt  DateTime @default(now())
  
  @@index([bookingId])
}
```

---

### 2.5 User Wizard Step 4: Confirmation

**Route:** `/book/[bookingId]/confirm`

**UI States:**

1. **Processing Payment:**
   - Spinner
   - "Estamos confirmando tu pago..."
   - Poll payment status every 2s

2. **Payment Approved:**
   - Success icon
   - Booking details summary
   - "Redirigiendo..." (auto-redirect after 3s)

3. **Payment Declined:**
   - Error icon
   - "Tu pago no pudo ser procesado"
   - "Intentar nuevamente" button

**Auto-redirect:**
```typescript
// app/book/[bookingId]/confirm/page.tsx
'use client'

export default function ConfirmPage({ params }: { params: { bookingId: string } }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [booking, setBooking] = useState<Booking | null>(null)
  
  useEffect(() => {
    const pollStatus = async () => {
      const res = await fetch(`/api/bookings/${params.bookingId}/status`)
      const data = await res.json()
      
      if (data.status === 'paid' || data.status === 'confirmed') {
        setStatus('success')
        setBooking(data.booking)
        
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = `${data.tenant.returnUrl}?status=ok&ref=${params.bookingId}`
        }, 3000)
      } else if (data.status === 'failed') {
        setStatus('error')
      }
    }
    
    const interval = setInterval(pollStatus, 2000)
    pollStatus()
    
    return () => clearInterval(interval)
  }, [params.bookingId])
  
  // ... render based on status
}
```

---

### 2.6 Bookings Viewer

**Admin Panel Route:** `/app/dashboard/bookings/page.tsx`

**Features:**
- Table with columns: Date, Time, Service, Professional, User, Status, Amount
- Status badges: pending (gray), paid (yellow), confirmed (green), failed (red)
- Filters: date range, service, professional, status
- Search by user email/name
- Export to CSV

**API Route:**
- `GET /api/bookings?status=&service=&professional=&from=&to=&search=`

**Implementation:**
```typescript
// app/api/bookings/route.ts
export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const serviceId = searchParams.get('service')
  const professionalId = searchParams.get('professional')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const search = searchParams.get('search')
  
  const where: any = {
    tenantId: session.user.tenantId
  }
  
  if (status) where.status = status
  if (serviceId) where.serviceId = serviceId
  if (professionalId) where.professionalId = professionalId
  if (from && to) {
    where.startTime = {
      gte: new Date(from),
      lte: new Date(to)
    }
  }
  if (search) {
    where.OR = [
      { userName: { contains: search, mode: 'insensitive' } },
      { userEmail: { contains: search, mode: 'insensitive' } }
    ]
  }
  
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      service: true,
      professional: true,
      payment: true
    },
    orderBy: { startTime: 'desc' },
    take: 100
  })
  
  return Response.json(bookings)
}
```

---

## Phase 3: Hardening (1-2 weeks)

### 3.1 Security Hardening

**Rate Limiting:**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s')
})

export async function middleware(req: NextRequest) {
  // Apply to public endpoints
  if (req.nextUrl.pathname.startsWith('/api/bookings') ||
      req.nextUrl.pathname.startsWith('/api/webhooks')) {
    
    const ip = req.ip ?? '127.0.0.1'
    const { success } = await ratelimit.limit(ip)
    
    if (!success) {
      return new Response('Too many requests', { status: 429 })
    }
  }
  
  return NextResponse.next()
}
```

**HTTPS Enforcement:**
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && 
      req.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${req.headers.get('host')}${req.nextUrl.pathname}`,
      301
    )
  }
}
```

**Refresh Token Encryption:**
- Already implemented in Phase 0.7
- Ensure `ENCRYPTION_KEY` is 32 bytes (64 hex chars)
- Rotate keys periodically (manual process for MVP)

---

### 3.2 Audit Logging

**Database Model:**
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String?
  action    String   // link_created, calendar_connected, payment_attempted, callback_sent
  entityType String  // booking_link, professional, booking, payment
  entityId  String
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([tenantId, action])
  @@index([entityType, entityId])
}
```

**Helper Function:**
```typescript
// lib/audit.ts
export async function logAudit(params: {
  tenantId: string
  userId?: string
  action: string
  entityType: string
  entityId: string
  metadata?: any
  req?: Request
}) {
  await prisma.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ipAddress: params.req?.headers.get('x-forwarded-for') || 
                 params.req?.headers.get('x-real-ip'),
      userAgent: params.req?.headers.get('user-agent')
    }
  })
}
```

**Usage:**
```typescript
// When creating booking link
await logAudit({
  tenantId: session.user.tenantId,
  userId: session.user.id,
  action: 'link_created',
  entityType: 'booking_link',
  entityId: link.id,
  metadata: { name: link.name, serviceId: link.serviceId },
  req
})
```

---

### 3.3 Basic Metrics

**Database Model:**
```prisma
model Metric {
  id        String   @id @default(cuid())
  tenantId  String
  name      String   // conversion_funnel, webhook_latency, oauth_failure
  value     Float
  metadata  Json?
  timestamp DateTime @default(now())
  
  @@index([tenantId, name, timestamp])
}
```

**Conversion Funnel Tracking:**
```typescript
// Track at each step
await prisma.metric.create({
  data: {
    tenantId,
    name: 'conversion_funnel',
    value: 1,
    metadata: {
      step: 'service_selected', // service_selected, slot_selected, details_entered, payment_initiated, payment_approved
      linkId,
      sessionId
    }
  }
})
```

**Webhook Latency:**
```typescript
// In webhook handler
const startTime = Date.now()
// ... process webhook
const latency = Date.now() - startTime

await prisma.metric.create({
  data: {
    tenantId: payment.booking.tenantId,
    name: 'webhook_latency',
    value: latency,
    metadata: { provider: 'wompi', reference: payment.reference }
  }
})
```

**Dashboard Queries:**
```typescript
// Get conversion rates
const funnel = await prisma.metric.groupBy({
  by: ['metadata'],
  where: {
    tenantId,
    name: 'conversion_funnel',
    timestamp: { gte: startDate, lte: endDate }
  },
  _count: true
})

// Get webhook latency percentiles
const latencies = await prisma.metric.findMany({
  where: {
    tenantId,
    name: 'webhook_latency',
    timestamp: { gte: startDate, lte: endDate }
  },
  select: { value: true },
  orderBy: { value: 'asc' }
})

const p50 = latencies[Math.floor(latencies.length * 0.5)]?.value
const p95 = latencies[Math.floor(latencies.length * 0.95)]?.value
```

---

### 3.4 Edge Case Handling

**Expired Refresh Token:**
```typescript
// lib/calendar/google-provider.ts
async refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token!
  } catch (error) {
    // Token expired or revoked
    if (error.code === 'invalid_grant') {
      // Mark professional as disconnected
      await prisma.professional.updateMany({
        where: { refreshToken: encrypt(refreshToken) },
        data: { calendarStatus: 'error' }
      })
      
      throw new Error('CALENDAR_DISCONNECTED')
    }
    throw error
  }
}
```

**UI for Reconnection:**
```typescript
// app/dashboard/professionals/[id]/page.tsx
{professional.calendarStatus === 'error' && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Calendario desconectado</AlertTitle>
    <AlertDescription>
      El acceso al calendario ha expirado.
      <Button onClick={handleReconnect}>Reconectar</Button>
    </AlertDescription>
  </Alert>
)}
```

**Wompi Downtime:**
```typescript
// lib/wompi.ts
export async function createWompiTransaction(...) {
  try {
    // ... existing code
  } catch (error) {
    // Log error
    await logAudit({
      tenantId: tenant.id,
      action: 'payment_provider_error',
      entityType: 'payment',
      entityId: booking.id,
      metadata: { error: error.message }
    })
    
    throw new Error('PAYMENT_PROVIDER_UNAVAILABLE')
  }
}
```

**Link Expiration:**
```typescript
// app/book/[linkId]/page.tsx
const link = await prisma.bookingLink.findUnique({
  where: { publicId: params.linkId }
})

if (!link || !link.isActive) {
  return <ErrorPage message="Este enlace no es válido" />
}

if (link.expiresAt && link.expiresAt < new Date()) {
  return <ErrorPage message="Este enlace ha expirado" />
}
```

**Timezone Validation:**
```typescript
// Ensure professional and tenant are in same timezone (or handle conversion)
const professionalTz = 'America/Bogota' // Could be stored per professional
const tenantTz = 'America/Bogota' // Could be stored per tenant

if (professionalTz !== tenantTz) {
  console.warn('Timezone mismatch:', { professionalTz, tenantTz })
  // Convert or show warning
}
```

---

### 3.5 UX Polish

**State Messages:**
- "Reteniendo tu horario..." (when creating hold)
- "Procesando pago..." (redirect to Wompi)
- "Confirmando tu reserva..." (waiting for webhook)
- "¡Reserva confirmada!" (success)
- "Pago rechazado. Por favor intenta nuevamente." (failure)

**Error Messages (Plain Language):**
- ❌ "Invalid token" → ✅ "Este enlace no es válido"
- ❌ "Slot conflict" → ✅ "Este horario ya no está disponible"
- ❌ "Payment failed" → ✅ "No pudimos procesar tu pago"

**Loading States:**
- Skeleton loaders for service/professional cards
- Spinner for slot availability
- Progress bar for wizard steps

**Mobile Responsiveness:**
- Wizard steps stack vertically on mobile
- Touch-friendly slot selection (min 44px tap targets)
- Sticky "Continue" button at bottom

---

### 3.6 Testing & Validation

**Critical Tests:**

1. **Double-booking Prevention:**
   - Simulate two users selecting same slot simultaneously
   - Verify only one gets hold
   - Verify second user sees "unavailable"

2. **Webhook Idempotency:**
   - Send same webhook twice
   - Verify booking status only updated once
   - Verify callback only sent once

3. **Hold Expiration:**
   - Create hold
   - Wait 10 minutes
   - Verify hold is deleted
   - Verify slot becomes available again

4. **Timezone Conversions:**
   - Create booking at midnight UTC
   - Verify displays correctly in America/Bogota
   - Verify stored as UTC in database

5. **HMAC Signature Verification:**
   - Generate callback payload
   - Verify signature matches
   - Modify payload
   - Verify signature fails

**Test Script Example:**
```typescript
// tests/double-booking.test.ts
import { test, expect } from '@playwright/test'

test('prevents double-booking', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()
  
  const page1 = await context1.newPage()
  const page2 = await context2.newPage()
  
  const linkUrl = 'http://localhost:3000/book/test-link'
  
  // Both users navigate to same link
  await Promise.all([
    page1.goto(linkUrl),
    page2.goto(linkUrl)
  ])
  
  // Both select same service/professional
  await Promise.all([
    page1.click('[data-service="srv_001"]'),
    page2.click('[data-service="srv_001"]')
  ])
  
  // Both try to select same slot
  const slotSelector = '[data-slot="2025-10-10T15:00:00Z"]'
  
  await Promise.all([
    page1.click(slotSelector),
    page2.click(slotSelector)
  ])
  
  // One should succeed, one should see error
  const error1 = await page1.locator('[data-error]').count()
  const error2 = await page2.locator('[data-error]').count()
  
  expect(error1 + error2).toBe(1) // Exactly one error
})
```

---

## Database Schema (Complete)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tenant {
  id                String    @id @default(cuid())
  name              String
  subdomain         String?   @unique
  
  logoUrl           String?
  primaryColor      String    @default("#3B82F6")
  secondaryColor    String    @default("#10B981")
  
  callbackUrl       String
  returnUrl         String
  
  wompiPublicKey    String?
  wompiPrivateKey   String?   @db.Text
  wompiMode         String    @default("test")
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  users             User[]
  services          Service[]
  professionals     Professional[]
  bookingLinks      BookingLink[]
  bookings          Booking[]
  payments          Payment[]
  auditLogs         AuditLog[]
  metrics           Metric[]
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     DateTime?
  password          String
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([tenantId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}

model Service {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  name            String
  description     String    @db.Text
  imageUrl        String?
  durationMinutes Int
  price           Int
  chargeType      String
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  professionals   ServiceProfessional[]
  bookings        Booking[]
  
  @@index([tenantId])
}

model Professional {
  id                String    @id @default(cuid())
  tenantId          String
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  
  name              String
  description       String?   @db.Text
  photoUrl          String?
  
  calendarStatus    String    @default("pending")
  calendarProvider  String    @default("google")
  calendarId        String?
  refreshToken      String?   @db.Text
  connectionToken   String?   @unique
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  services          ServiceProfessional[]
  bookings          Booking[]
  
  @@index([tenantId])
  @@index([connectionToken])
}

model ServiceProfessional {
  serviceId       String
  professionalId  String
  service         Service      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  @@id([serviceId, professionalId])
}

model BookingLink {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  publicId        String    @unique @default(cuid())
  name            String
  
  serviceId       String?
  professionalId  String?
  
  expiresAt       DateTime?
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  bookings        Booking[]
  
  @@index([tenantId])
  @@index([publicId])
}

model Booking {
  id              String    @id @default(cuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  linkId          String
  link            BookingLink @relation(fields: [linkId], references: [id])
  
  serviceId       String
  service         Service   @relation(fields: [serviceId], references: [id])
  
  professionalId  String
  professional    Professional @relation(fields: [professionalId], references: [id])
  
  startTime       DateTime
  endTime         DateTime
  
  status          String    @default("pending")
  holdExpiresAt   DateTime?
  
  userName        String
  userEmail       String
  userPhone       String
  acceptedTerms   Boolean
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  payment         Payment?
  callbackLogs    CallbackLog[]
  
  @@index([tenantId])
  @@index([professionalId, startTime])
  @@index([status])
}

model Payment {
  id          String   @id @default(cuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  bookingId   String   @unique
  booking     Booking  @relation(fields: [bookingId], references: [id])
  
  provider    String
  reference   String   @unique
  amount      Int
  currency    String
  status      String
  rawWebhook  Json?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])
  @@index([reference])
}

model SlotHold {
  id              String    @id @default(cuid())
  professionalId  String
  serviceId       String
  
  startTime       DateTime
  endTime         DateTime
  
  expiresAt       DateTime
  sessionId       String
  
  createdAt       DateTime  @default(now())
  
  @@index([professionalId, startTime])
  @@index([expiresAt])
}

model WebhookEvent {
  id          String    @id @default(cuid())
  externalId  String    @unique
  provider    String
  type        String
  payload     Json
  processedAt DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([externalId])
}

model CallbackLog {
  id         String   @id @default(cuid())
  bookingId  String
  booking    Booking  @relation(fields: [bookingId], references: [id])
  url        String
  payload    Json
  statusCode Int?
  attempts   Int
  success    Boolean
  createdAt  DateTime @default(now())
  
  @@index([bookingId])
}

model AuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  userId    String?
  action    String
  entityType String
  entityId  String
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([tenantId, action])
  @@index([entityType, entityId])
}

model Metric {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  value     Float
  metadata  Json?
  timestamp DateTime @default(now())
  
  @@index([tenantId, name, timestamp])
}
```

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/konfirmado"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Encryption
ENCRYPTION_KEY="generate-with-openssl-rand-hex-32"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Wompi (per tenant, but need defaults for testing)
WOMPI_PUBLIC_KEY_TEST="pub_test_..."
WOMPI_PRIVATE_KEY_TEST="prv_test_..."

# Callbacks
CALLBACK_SECRET="generate-with-openssl-rand-base64-32"
CRON_SECRET="generate-with-openssl-rand-base64-32"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

---

## Deployment Checklist

- [ ] Setup PostgreSQL database (Railway/Supabase)
- [ ] Configure environment variables in Vercel
- [ ] Setup Google OAuth credentials (production redirect URIs)
- [ ] Configure Wompi webhook URL in merchant dashboard
- [ ] Setup Upstash Redis for rate limiting
- [ ] Configure custom domain (optional)
- [ ] Enable Vercel Cron for hold cleanup
- [ ] Test end-to-end flow in production
- [ ] Setup monitoring (Sentry/LogRocket)
- [ ] Configure email service (Resend/SendGrid) for verification

---

## MVP Acceptance Criteria

✅ **Phase 0 Complete:**
- Admin can register, login, verify email, recover password
- Admin can configure branding, services, professionals, Wompi
- Admin can generate booking links

✅ **Phase 1 Complete:**
- Admin can invite professional to connect Google Calendar
- Professional can complete OAuth flow successfully
- System queries FreeBusy and displays available slots
- Slot hold prevents double-booking

✅ **Phase 2 Complete:**
- User completes 4-step wizard
- Payment redirects to Wompi and processes webhook
- System sends HMAC-signed callback to merchant
- User redirects to merchant return URL

✅ **Phase 3 Complete:**
- Security hardening (rate limits, encryption, HTTPS)
- Audit logging for critical actions
- Basic metrics dashboard
- Edge cases handled gracefully

---

## Next Steps After MVP

1. **Outlook Integration** - Implement `OutlookCalendarProvider`
2. **Mercado Pago** - Add payment provider abstraction
3. **Rescheduling/Cancellation** - Allow users to modify bookings
4. **Reminders** - Email/WhatsApp notifications
5. **Advanced Analytics** - Conversion funnels, revenue tracking
6. **Multi-language** - i18n support
7. **Mobile App** - React Native wrapper

---

## Estimated Timeline

- **Phase 0:** 1-2 weeks (foundation)
- **Phase 1:** 1-2 weeks (availability)
- **Phase 2:** 1-2 weeks (payments)
- **Phase 3:** 1-2 weeks (hardening)

**Total MVP:** 4-8 weeks (depending on team size and experience)

---

## Critical Success Factors

1. **Hold mechanism works reliably** - No double-bookings
2. **Webhook handling is robust** - Idempotent, retries, logging
3. **Timezone handling is correct** - UTC storage, proper conversions
4. **Callback signatures are verified** - Security is paramount
5. **UX is clear** - Users understand each step and state

**If these 5 things work, you have a viable MVP.**
