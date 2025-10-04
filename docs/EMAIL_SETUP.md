# 📧 Email System Setup

## **Status: ✅ Implemented (Needs Resend API Key)**

The email system is fully implemented using **Resend**. You just need to configure your API key.

---

## **1. Get Resend API Key**

1. Go to https://resend.com
2. Sign up / Log in
3. Create API Key
4. Add to `.env`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## **2. Verify Domain (Important!)**

For production, you need to verify your domain in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `konfirmado.com`)
3. Add DNS records they provide
4. Wait for verification

**Until verified**, emails will show as from `onboarding@resend.dev`

---

## **3. Emails Currently Implemented**

### **✅ Booking Confirmation Email**
**Sent when:** Payment is approved (webhook)
**To:** Customer
**Includes:**
- Service name
- Professional name
- Date and time
- Amount paid
- Custom confirmation message (if configured)

### **✅ Calendar Invitation Email**
**Sent when:** Admin clicks "Send Invitation" for professional
**To:** Professional
**Includes:**
- Connection link to Google Calendar
- Expiration date (7 days)
- Instructions

### **✅ Password Reset Email**
**Sent when:** User requests password reset
**To:** Admin user
**Includes:**
- Reset link (expires in 1 hour)
- Security instructions

### **⏳ Payment Reminder Email**
**Status:** Template ready, not triggered yet
**Future use:** Remind customers of pending payments

---

## **4. How Emails Work**

### **Booking Confirmation Flow:**
```
Payment Approved (Wompi Webhook)
    ↓
Update booking status to 'paid'
    ↓
Create Google Calendar event
    ↓
Send merchant callback
    ↓
✉️ Send confirmation email to customer
```

### **Professional Invitation Flow:**
```
Admin clicks "Send Invitation"
    ↓
Generate connection token
    ↓
✉️ Send email with connection link
    ↓
Professional clicks link
    ↓
OAuth with Google Calendar
```

---

## **5. Email Templates**

All templates are in `/src/lib/email.ts` with:
- ✅ Responsive HTML design
- ✅ Spanish language
- ✅ Branded colors
- ✅ Clear CTAs

---

## **6. Testing Emails Locally**

### **Option 1: Use Resend Test Mode**
```bash
# Add to .env
RESEND_API_KEY=re_test_xxxxx
```

Resend test mode will show emails in their dashboard without actually sending.

### **Option 2: Use Your Personal Email**
Set your email as recipient and test:
```typescript
// Temporarily in webhook
await sendBookingConfirmationEmail({
  email: 'your-email@gmail.com', // Your test email
  // ... rest of params
})
```

---

## **7. Production Checklist**

Before going live:

- [ ] ✅ Resend API key configured
- [ ] ✅ Domain verified in Resend
- [ ] ✅ Update `from` email in `/src/lib/email.ts`:
  ```typescript
  from: 'Konfirmado <noreply@your-domain.com>'
  ```
- [ ] ✅ Test all email flows:
  - [ ] Booking confirmation
  - [ ] Professional invitation
  - [ ] Password reset
- [ ] ✅ Check spam folder if emails not arriving
- [ ] ✅ Monitor Resend dashboard for delivery issues

---

## **8. Current Email Behavior**

### **With RESEND_API_KEY:**
- ✅ Emails sent automatically
- ✅ Logged to console
- ✅ Errors caught (won't break booking flow)

### **Without RESEND_API_KEY:**
- ⚠️ Emails silently skipped
- ⚠️ Booking still works
- ⚠️ No error shown to user

**This is intentional** - email failures shouldn't break the booking process.

---

## **9. Monitoring**

Check these logs to verify emails are sending:

```bash
# Booking confirmation
✓ Calendar event created: evt_123 for booking bk_456
✓ Booking confirmation email sent to customer@email.com

# Professional invitation
✓ Calendar invitation email sent to doctor@email.com
```

---

## **10. Troubleshooting**

### **Emails not sending?**
1. Check `RESEND_API_KEY` is set
2. Check Resend dashboard for errors
3. Verify domain is verified
4. Check spam folder

### **Emails going to spam?**
1. Verify domain in Resend
2. Add SPF/DKIM records
3. Warm up domain gradually
4. Avoid spam trigger words

### **Rate limits?**
Resend free tier:
- 100 emails/day
- 3,000 emails/month

Upgrade if you need more.

---

## **11. Future Enhancements**

Not in MVP but easy to add:

- **Booking reminders** (24h before appointment)
- **Professional notifications** (new booking assigned)
- **Cancellation emails**
- **Rescheduling confirmations**
- **Receipt emails** (with payment details)
- **Monthly summaries** (for professionals)

---

## **🎯 Quick Start**

1. Add Resend API key to `.env`:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

2. Restart your dev server:
   ```bash
   pnpm run dev
   ```

3. Test:
   - Create a professional with email
   - Click "Send Invitation"
   - Check your inbox!

**That's it! Emails are now working!** 📧
