# 📚 Konfirmado Documentation

This directory contains detailed documentation for setting up and using Konfirmado.

## 📖 Table of Contents

### Setup Guides

- **[Google Calendar Setup](./GOOGLE_CALENDAR_SETUP.md)**
  - How to configure Google Cloud Console
  - OAuth 2.0 credentials setup
  - Calendar API configuration
  - Professional calendar connection flow

- **[Email Setup (Resend)](./EMAIL_SETUP.md)**
  - Resend account configuration
  - Email templates overview
  - Domain verification
  - Testing email delivery

- **[Wompi Payment Setup](./PLATFORM_WOMPI_SETUP.md)**
  - Wompi account registration
  - API keys configuration
  - Webhook setup
  - Test cards and sandbox mode

### Features Documentation

- **[Password Recovery](./PASSWORD_RECOVERY.md)**
  - Forgot password flow
  - Reset password implementation
  - Email templates
  - Security considerations

- **[Cancellation Feature](./CANCELLATION_FEATURE.md)**
  - Booking cancellation system
  - Secure cancellation links
  - Webhook notifications
  - Email confirmations

## 🔑 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/konfirmado` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | Generate with `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | AES-256 encryption key | 32 random characters |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | From Google Cloud Console |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` |
| `CALLBACK_SECRET` | HMAC secret for webhooks | Generate with `openssl rand -base64 32` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for emails | None (emails disabled) |
| `RESEND_FROM_EMAIL` | From email address | `noreply@yourdomain.com` |
| `CRON_SECRET` | Secret for cron job auth | `dev-secret-change-in-production` |

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd konfirmado
   pnpm install
   ```

2. **Setup environment:**
   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Setup database:**
   ```bash
   createdb konfirmado
   pnpm prisma db push
   pnpm prisma generate
   ```

4. **Start development:**
   ```bash
   pnpm dev
   ```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
└────────────┬────────────────────────────────────┬───────────┘
             │                                    │
             ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│  Booking Wizard     │              │  Admin Panel        │
│  (Public)           │              │  (Authenticated)    │
└──────────┬──────────┘              └──────────┬──────────┘
           │                                    │
           └────────────────┬───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │   Next.js API    │
                  │   Routes         │
                  └────────┬─────────┘
                           │
        ┏━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┓
        ▼                  ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │Google Calendar│  │    Wompi     │
│  (Prisma)    │  │   FreeBusy   │  │   Payments   │
└──────────────┘  └──────────────┘  └──────────────┘
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Rotate secrets regularly** - Especially in production
3. **Use HTTPS in production** - Required for OAuth and payments
4. **Verify webhook signatures** - Always validate HMAC signatures
5. **Encrypt sensitive data** - Refresh tokens are encrypted at rest
6. **Limit OAuth scopes** - Only request necessary permissions

## 📊 Database Schema

Key models:
- **Tenant** - Multi-tenant isolation
- **User** - Admin users
- **Service** - Services offered
- **Professional** - Professionals with calendar integration
- **Booking** - Reservations
- **SlotHold** - Temporary slot locks (prevents double-booking)
- **Payment** - Payment records
- **CallbackLog** - Webhook delivery logs

See `prisma/schema.prisma` for complete schema.

## 🔄 Webhooks

### Incoming (from Wompi)
- **Endpoint:** `/api/webhooks/wompi`
- **Events:** `transaction.updated`
- **Verification:** HMAC signature with Events Secret

### Outgoing (to Merchant)
- **Events:** `booking.created`, `booking.cancelled`, `booking.rescheduled`
- **Signature:** HMAC with `CALLBACK_SECRET`
- **Retries:** 3 attempts with exponential backoff

## 🧪 Testing

### Test Wompi Payments
- **Approved:** 4242 4242 4242 4242
- **Declined:** 4111 1111 1111 1111
- **CVV:** Any 3 digits
- **Expiry:** Any future date

### Test Email Delivery
Set `RESEND_API_KEY` and trigger:
- Password reset
- Booking confirmation
- Cancellation confirmation

### Test Calendar Integration
1. Create professional
2. Send invitation link
3. Connect Google Calendar
4. Check availability reflects calendar events

## 🆘 Troubleshooting

### Calendar not syncing
- Check refresh token is valid
- Verify OAuth redirect URI matches
- Check professional's `calendarStatus` field

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Check domain is verified in Resend
- Look for errors in console logs

### Payments failing
- Verify Wompi keys are correct (test vs production)
- Check webhook URL is accessible
- Verify signature generation matches Wompi's

### Double bookings
- Ensure cron job is running (`/api/cron/cleanup-holds`)
- Check `SlotHold` records are being created
- Verify availability API excludes holds

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review [AGENTS.md](../AGENTS.md) for architecture details
3. Check console logs for errors
4. Contact development team

---

**Last Updated:** 2025-10-04
