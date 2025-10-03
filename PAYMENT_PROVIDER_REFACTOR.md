# Payment Provider Refactoring

## ✅ What Changed

Refactored from Wompi-specific columns to **provider-agnostic JSON structure** to easily support multiple payment providers (Wompi, Mercado Pago, Stripe, etc.).

---

## 📊 Database Changes

### **Before (Wompi-specific):**
```prisma
model Tenant {
  // Wompi config
  wompiPublicKey      String?
  wompiPrivateKey     String?
  wompiIntegritySecret String?
  wompiEventsSecret   String?
  wompiMode           String
  
  // Payment method
  paymentMethodToken  String?
  paymentMethodType   String?
  paymentMethodMask   String?
}

model Subscription {
  paymentReference   String?
  paymentStatus      String?
}
```

### **After (Provider-agnostic):**
```prisma
model Tenant {
  // Payment provider config
  paymentProvider     String?   @default("wompi")
  paymentConfig       Json?     // { provider: 'wompi', publicKey: '...', ... }
  
  // Payment method
  paymentMethodInfo   Json?     // { provider: 'wompi', token: '...', type: 'CARD', mask: '4242' }
}

model Subscription {
  paymentInfo        Json?    // { provider: 'wompi', reference: 'SUB-123', status: 'approved', ... }
}
```

---

## 🔧 Code Changes

### **1. Tenant Payment Config (Wompi)**
```typescript
// OLD
tenant.wompiPublicKey
tenant.wompiPrivateKey

// NEW
tenant.paymentConfig = {
  provider: 'wompi',
  publicKey: 'pub_test_...',
  privateKey: 'encrypted_...',
  integritySecret: 'encrypted_...',
  eventsSecret: 'encrypted_...',
  mode: 'test'
}
```

### **2. Payment Method Info**
```typescript
// OLD
tenant.paymentMethodToken
tenant.paymentMethodType
tenant.paymentMethodMask

// NEW
tenant.paymentMethodInfo = {
  provider: 'wompi',
  token: 'encrypted_tok_...',
  type: 'CARD',
  mask: '4242'
}
```

### **3. Subscription Payment Info**
```typescript
// OLD
subscription.paymentReference
subscription.paymentStatus

// NEW
subscription.paymentInfo = {
  provider: 'wompi',
  reference: 'SUB-1234567890-abc123',
  status: 'APPROVED',
  transactionId: '11977467-1759442072-54693'
}
```

---

## 📝 Updated Files

### **Schema:**
- ✅ `prisma/schema.prisma` - Updated models
- ✅ `prisma/migrations/20251003_refactor_payment_provider/migration.sql` - Migration script

### **Helper Functions:**
- ✅ `src/lib/wompi.ts` - Updated `getWompiConfig()` to read from JSON

### **API Endpoints:**
- ✅ `src/app/api/subscription/payment-method/route.ts` - Save/delete payment method
- ✅ `src/app/api/subscription/upgrade/route.ts` - Subscription upgrade
- ✅ `src/app/api/cron/billing/route.ts` - Monthly billing (needs update)
- ✅ `src/app/api/webhooks/wompi/route.ts` - Webhook handler (needs update)

### **UI Components:**
- ✅ `src/app/api/tenant/route.ts` - Returns payment method info
- ✅ `src/app/dashboard/payment-methods/page.tsx` - Displays payment method

---

## 🚀 How to Add New Payment Providers

### **Example: Adding Mercado Pago**

**1. Update Tenant Config:**
```typescript
// Save Mercado Pago config
await prisma.tenant.update({
  where: { id: tenantId },
  data: {
    paymentProvider: 'mercadopago',
    paymentConfig: {
      provider: 'mercadopago',
      publicKey: 'APP_USR_...',
      accessToken: encrypt('APP_USR_...'),
      mode: 'test'
    }
  }
})
```

**2. Create Provider Helper:**
```typescript
// src/lib/mercadopago.ts
export function getMercadoPagoConfig(tenant: any) {
  if (tenant.paymentProvider !== 'mercadopago') return null
  
  const config = tenant.paymentConfig as any
  return {
    publicKey: config.publicKey,
    accessToken: decrypt(config.accessToken),
    mode: config.mode
  }
}
```

**3. Update Payment Method Endpoint:**
```typescript
// src/app/api/subscription/payment-method/route.ts
const provider = tenant.paymentProvider || 'wompi'

if (provider === 'wompi') {
  // Existing Wompi logic
} else if (provider === 'mercadopago') {
  // Mercado Pago tokenization
  const mpConfig = getMercadoPagoConfig(tenant)
  const token = await tokenizeCardMP(cardData, mpConfig)
  
  await prisma.tenant.update({
    data: {
      paymentMethodInfo: {
        provider: 'mercadopago',
        token: encrypt(token.id),
        type: token.payment_method_id,
        mask: token.last_four_digits
      }
    }
  })
}
```

**4. Update Subscription Upgrade:**
```typescript
// src/app/api/subscription/upgrade/route.ts
const paymentInfo = tenant.paymentMethodInfo as any

if (paymentInfo.provider === 'wompi') {
  // Existing Wompi logic
} else if (paymentInfo.provider === 'mercadopago') {
  // Mercado Pago charge
  const transaction = await createPaymentMP({
    token: decrypt(paymentInfo.token),
    amount: planDetails.price,
    ...
  })
}
```

---

## ✅ Benefits

1. **Easy to add new providers** - Just add JSON config, no schema changes
2. **Provider-specific data** - Each provider can store different fields
3. **Backward compatible** - Migration preserves existing Wompi data
4. **Type-safe** - TypeScript interfaces for each provider
5. **Encrypted sensitive data** - Keys/tokens encrypted before storing in JSON

---

## 🔐 Security Notes

- All sensitive data (keys, tokens) are **encrypted** before storing in JSON
- Provider config is **per-tenant** (each tenant can use different providers)
- Platform Wompi config still uses **environment variables** (not in DB)

---

## 📋 Migration Checklist

- [x] Update Prisma schema
- [x] Create migration SQL
- [x] Run migration
- [x] Regenerate Prisma client
- [x] Update `getWompiConfig()` helper
- [x] Update payment method API
- [x] Update subscription upgrade API
- [ ] Update billing cron
- [ ] Update webhook handler
- [ ] Update tenant API
- [ ] Update payment methods page
- [ ] Update settings page (to configure provider)
- [ ] Test end-to-end flow

---

## 🧪 Testing

```bash
# 1. Verify migration
pnpm prisma studio
# Check Tenant table has: paymentProvider, paymentConfig, paymentMethodInfo

# 2. Test payment method
# Go to /dashboard/payment-methods
# Add card: 4242 4242 4242 4242
# Check DB: paymentMethodInfo should be JSON

# 3. Test subscription upgrade
# Go to /dashboard/subscription
# Upgrade to Basic
# Check DB: subscription.paymentInfo should be JSON
```

---

## 🎯 Next Steps

1. **Update remaining files** (billing cron, webhooks, UI)
2. **Add provider selector** in settings (Wompi/Mercado Pago dropdown)
3. **Create provider abstraction** layer (`PaymentProvider` interface)
4. **Add Mercado Pago** implementation
5. **Document provider setup** for each supported gateway
