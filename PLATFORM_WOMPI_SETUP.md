# Platform Wompi Configuration

## 🎯 Critical: Two Separate Wompi Accounts

Konfirmado uses **TWO different Wompi configurations**:

### 1. **Platform Wompi** (YOUR account)
- **Purpose**: Collect subscription payments from tenants
- **Money goes to**: Your platform account
- **Used for**: Monthly subscription charges (Basic, Pro plans)
- **Configured in**: Environment variables (`.env`)

### 2. **Tenant Wompi** (Each tenant's account)
- **Purpose**: Collect booking payments from end-users
- **Money goes to**: Each tenant's account
- **Used for**: Appointment/service bookings
- **Configured in**: Dashboard → Settings → Pagos

---

## 🔧 Setup Instructions

### Step 1: Create Platform Wompi Account

1. Go to [Wompi](https://wompi.com)
2. Create an account for **your platform** (not for tenants)
3. Get your credentials from the dashboard

### Step 2: Add to Environment Variables

Add these to your `.env` file:

```bash
# Platform Wompi Credentials (for subscription payments)
PLATFORM_WOMPI_PUBLIC_KEY="pub_test_xxxxxxxxxxxxx"
PLATFORM_WOMPI_PRIVATE_KEY="prv_test_xxxxxxxxxxxxx"
PLATFORM_WOMPI_INTEGRITY_SECRET="test_integrity_xxxxxxxxxxxxx"
PLATFORM_WOMPI_EVENTS_SECRET="test_events_xxxxxxxxxxxxx"
```

### Step 3: Get Test Credentials

**For Development (Sandbox):**
1. Login to Wompi
2. Go to **Developers** → **API Keys**
3. Copy **Test/Sandbox** keys
4. Use format: `pub_test_...`, `prv_test_...`

**For Production:**
1. Complete Wompi verification
2. Get **Production** keys
3. Use format: `pub_prod_...`, `prv_prod_...`

---

## 💰 Payment Flow

### Subscription Payments (Tenant → Platform)
```
Tenant adds payment method
↓
Card tokenized with PLATFORM Wompi keys
↓
Monthly charge using PLATFORM credentials
↓
Money goes to YOUR Wompi account
```

### Booking Payments (End-user → Tenant)
```
End-user books appointment
↓
Payment processed with TENANT's Wompi keys
↓
Money goes to TENANT's Wompi account
```

---

## 🧪 Testing

### Test Cards (Sandbox):
- **Approved**: `4242 4242 4242 4242`
- **Declined**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)

### Test Flow:
1. Start dev server: `pnpm run dev`
2. Go to **Métodos de Pago**
3. Add test card: `4242 4242 4242 4242`
4. Go to **Suscripción**
5. Upgrade to Basic or Pro
6. Check Wompi dashboard for transaction

---

## 🚨 Common Errors

### "La llave proveída no corresponde a este ambiente"
**Cause**: Using test keys with production URL or vice versa

**Solution**: 
- Development automatically uses `sandbox.wompi.co`
- Production uses `production.wompi.co`
- Make sure your keys match the environment

### "Platform payment system not configured"
**Cause**: Missing environment variables

**Solution**: Add all 4 platform Wompi keys to `.env`:
```bash
PLATFORM_WOMPI_PUBLIC_KEY="..."
PLATFORM_WOMPI_PRIVATE_KEY="..."
PLATFORM_WOMPI_INTEGRITY_SECRET="..."
PLATFORM_WOMPI_EVENTS_SECRET="..."
```

### "Wompi not configured" (in tenant booking flow)
**Cause**: Tenant hasn't configured their Wompi keys

**Solution**: Tenant must go to **Settings → Pagos** and add their keys

---

## 📊 Verification

### Check Platform Config:
```bash
# In your terminal
echo $PLATFORM_WOMPI_PUBLIC_KEY
```

Should output: `pub_test_...` or `pub_prod_...`

### Check Tenant Config:
1. Login as tenant admin
2. Go to **Settings → Pagos**
3. Verify all 4 fields are filled

---

## 🔐 Security Notes

1. **Never commit** `.env` to git
2. **Rotate keys** if exposed
3. **Use test keys** in development
4. **Use production keys** only in production
5. **Encrypt tokens** before storing (already implemented)

---

## 📝 Environment Variables Summary

```bash
# Required for platform (subscription payments)
PLATFORM_WOMPI_PUBLIC_KEY="pub_test_xxxxx"
PLATFORM_WOMPI_PRIVATE_KEY="prv_test_xxxxx"
PLATFORM_WOMPI_INTEGRITY_SECRET="test_integrity_xxxxx"
PLATFORM_WOMPI_EVENTS_SECRET="test_events_xxxxx"

# Optional: Cron secret for billing
CRON_SECRET="your-secret-for-cron-jobs"

# Other required vars
DATABASE_URL="postgresql://..."
ENCRYPTION_KEY="your-32-character-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## ✅ Checklist

Before going live:

- [ ] Platform Wompi account created
- [ ] Test keys added to `.env`
- [ ] Tested subscription payment flow
- [ ] Verified money goes to platform account
- [ ] Production keys ready (when deploying)
- [ ] Cron job configured for monthly billing
- [ ] Webhook endpoints secured
- [ ] Test tenant can configure their own Wompi

---

## 🆘 Support

If you encounter issues:

1. Check Wompi dashboard for transaction logs
2. Check server logs for errors
3. Verify all 4 keys are correct
4. Ensure keys match environment (test vs prod)
5. Contact Wompi support if payment fails
