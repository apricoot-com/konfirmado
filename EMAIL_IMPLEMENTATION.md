# 📧 Email Implementation Guide

## **Quick Start**

### **1. Install Resend**
```bash
pnpm add resend
```

### **2. Get API Key**
1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month)
3. Create API key
4. Add to `.env`:
```bash
RESEND_API_KEY=re_...
```

### **3. Verify Domain (Production)**
For production, verify your domain in Resend dashboard:
- Add DNS records (SPF, DKIM)
- Update `from` address in `src/lib/email.ts`

### **4. Run Migration**
```bash
pnpm prisma db push
pnpm prisma generate
```

### **5. Enable Password Reset**

Update `/src/app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/utils'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }
    
    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `reset:${email}`,
      },
    })
    
    // Create reset token
    const token = generateToken(32)
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })
    
    // Send reset email
    await sendPasswordResetEmail(email, token)
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    )
  }
}
```

---

## **Usage Examples**

### **Send Booking Confirmation**

Update `/src/app/api/webhooks/wompi/route.ts`:

```typescript
import { sendBookingConfirmationEmail } from '@/lib/email'

// After payment approved
if (paymentStatus === 'approved') {
  // ... existing code ...
  
  // Send confirmation email
  await sendBookingConfirmationEmail({
    email: booking.userEmail,
    name: booking.userName,
    serviceName: booking.service.name,
    professionalName: booking.professional.name,
    date: format(new Date(booking.startTime), "EEEE, dd 'de' MMMM", { locale: es }),
    time: `${format(new Date(booking.startTime), 'HH:mm')} - ${format(new Date(booking.endTime), 'HH:mm')}`,
    amount: payment.amount,
    confirmationMessage: booking.service.confirmationMessage || undefined,
  })
}
```

### **Send Calendar Invitation**

Update `/src/app/api/professionals/[id]/invite/route.ts`:

```typescript
import { sendCalendarInvitationEmail } from '@/lib/email'

// After generating connection token
await sendCalendarInvitationEmail({
  email: professional.email, // You'll need to add email field to Professional model
  name: professional.name,
  connectionUrl,
  expiresAt: tokenExpiresAt,
})
```

---

## **Email Templates Included**

✅ **Password Reset** - Secure token-based reset
✅ **Booking Confirmation** - With service details and custom message
✅ **Calendar Invitation** - For professionals to connect Google Calendar
✅ **Payment Reminder** - For pending payments

---

## **Alternative Providers**

### **SendGrid**
```bash
pnpm add @sendgrid/mail
```
- Free tier: 100 emails/day
- More complex setup
- Good for high volume

### **Postmark**
```bash
pnpm add postmark
```
- Free tier: 100 emails/month
- Excellent deliverability
- Focus on transactional emails

### **AWS SES**
```bash
pnpm add @aws-sdk/client-ses
```
- Very cheap ($0.10 per 1,000 emails)
- Requires AWS account
- More complex setup

---

## **Best Practices**

### **1. Email Verification**
Add email verification on signup:
```typescript
// After user registration
const token = generateToken(32)
await prisma.verificationToken.create({
  data: {
    identifier: `verify:${email}`,
    token,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
})

await sendEmail({
  to: email,
  subject: 'Verifica tu email - Konfirmado',
  html: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}">Verificar email</a>`,
})
```

### **2. Rate Limiting**
Prevent abuse:
```typescript
// Check recent emails sent
const recentEmails = await prisma.auditLog.count({
  where: {
    action: 'email_sent',
    entityId: email,
    createdAt: {
      gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    },
  },
})

if (recentEmails >= 3) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  )
}
```

### **3. Email Queue (Production)**
For high volume, use a queue:
```bash
pnpm add bullmq ioredis
```

### **4. Unsubscribe Links**
Add to all marketing emails (not transactional):
```html
<a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${email}">
  Unsubscribe
</a>
```

### **5. Track Email Opens (Optional)**
Add tracking pixel:
```html
<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track?id=${emailId}" width="1" height="1" />
```

---

## **Testing**

### **Development**
Use Resend's test mode or [Mailtrap](https://mailtrap.io):
```bash
# .env.local
RESEND_API_KEY=re_test_...
```

### **Preview Emails**
Use [React Email](https://react.email) for better templates:
```bash
pnpm add react-email @react-email/components
```

---

## **Cost Estimate**

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for MVP

**Resend Pro ($20/month):**
- 50,000 emails/month
- 10,000 emails/day
- Custom domains
- Analytics

**For 1,000 bookings/month:**
- 1,000 confirmation emails
- ~100 password resets
- ~50 calendar invitations
- **Total: ~1,200 emails/month** → Free tier is enough!

---

## **Next Steps**

1. ✅ Install Resend
2. ✅ Add API key to `.env`
3. ✅ Run migration (`pnpm prisma db push`)
4. ✅ Enable forgot-password route
5. ✅ Add booking confirmation emails
6. ✅ Add calendar invitation emails
7. ⏳ Create reset-password page
8. ⏳ Add email verification on signup
9. ⏳ Test in production

---

**🎉 Email system is ready to use!**
