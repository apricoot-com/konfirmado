# 🔐 Password Recovery System

## **Status: ✅ FULLY IMPLEMENTED & ENABLED**

The password recovery system is now fully functional!

---

## **How It Works**

### **1. User Flow:**

```
User clicks "Forgot Password" on login page
    ↓
Enters email address
    ↓
System generates reset token (valid 1 hour)
    ↓
✉️ Email sent with reset link
    ↓
User clicks link in email
    ↓
Enters new password
    ↓
Password updated ✓
```

---

## **2. Pages Available**

### **Forgot Password Page**
- **URL:** `/auth/forgot-password`
- **What it does:** User enters email, receives reset link
- **Security:** Returns success even if email doesn't exist (prevents enumeration)

### **Reset Password Page**
- **URL:** `/auth/reset-password?token=xxxxx`
- **What it does:** User enters new password
- **Validation:** Token must be valid and not expired (1 hour)

---

## **3. API Endpoints**

### **POST /api/auth/forgot-password**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent.",
  "resetToken": "xxx" // Only in development mode
}
```

### **POST /api/auth/reset-password**
```json
{
  "token": "reset_token_here",
  "password": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## **4. Email Template**

The system sends a professional email with:
- ✅ Reset link (expires in 1 hour)
- ✅ Security warning
- ✅ Branded design
- ✅ Spanish language

**Example email:**
```
Subject: Restablecer tu contraseña - Konfirmado

Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

[Restablecer contraseña] (button)

Este enlace expirará en 1 hora.

Si no solicitaste esto, ignora este correo.
```

---

## **5. Security Features**

✅ **Token expiration** - 1 hour validity
✅ **One-time use** - Token deleted after use
✅ **Email enumeration prevention** - Always returns success
✅ **Password hashing** - bcrypt with 12 rounds
✅ **Token cleanup** - Old tokens deleted before creating new ones
✅ **HTTPS only** - Reset links use secure protocol

---

## **6. Testing**

### **With RESEND_API_KEY configured:**

1. Go to http://localhost:3000/auth/login
2. Click "¿Olvidaste tu contraseña?"
3. Enter your email
4. Check your inbox for reset email
5. Click the link
6. Enter new password
7. Login with new password ✓

### **Without RESEND_API_KEY (Development):**

1. Go to http://localhost:3000/auth/forgot-password
2. Enter email
3. Copy the `resetToken` from the response (shown in dev mode)
4. Go to http://localhost:3000/auth/reset-password?token=PASTE_TOKEN_HERE
5. Enter new password
6. Login with new password ✓

---

## **7. Database**

Uses the **VerificationToken** model:

```prisma
model VerificationToken {
  identifier String   // "reset:user@example.com"
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}
```

**Token format:** `reset:email@example.com`

---

## **8. Configuration**

### **Required:**
- ✅ VerificationToken model in schema (already exists)
- ✅ RESEND_API_KEY in .env (for sending emails)
- ✅ NEXT_PUBLIC_APP_URL in .env (for reset links)

### **Optional:**
- Customize email template in `/src/lib/email.ts`
- Change token expiration (default: 1 hour)
- Customize password requirements (default: min 8 chars)

---

## **9. User Experience**

### **Login Page:**
```
┌─────────────────────────┐
│  Iniciar Sesión         │
│                         │
│  Email: [__________]    │
│  Password: [_______]    │
│                         │
│  [Iniciar sesión]       │
│                         │
│  ¿Olvidaste tu          │
│  contraseña?            │ ← Clickable link
└─────────────────────────┘
```

### **Forgot Password Page:**
```
┌─────────────────────────┐
│  Recuperar Contraseña   │
│                         │
│  Email: [__________]    │
│                         │
│  [Enviar enlace]        │
│                         │
│  ← Volver al login      │
└─────────────────────────┘
```

### **Success Message:**
```
┌─────────────────────────┐
│  ✓ Correo Enviado       │
│                         │
│  Si existe una cuenta   │
│  con este correo,       │
│  recibirás un enlace    │
│  para restablecer tu    │
│  contraseña.            │
│                         │
│  [Volver al login]      │
└─────────────────────────┘
```

### **Reset Password Page:**
```
┌─────────────────────────┐
│  Nueva Contraseña       │
│                         │
│  Password: [_______]    │
│  (mínimo 8 caracteres)  │
│                         │
│  [Restablecer]          │
└─────────────────────────┘
```

---

## **10. Error Handling**

| Error | Message | Action |
|-------|---------|--------|
| Invalid token | "Invalid or expired token" | Request new reset link |
| Expired token | "Token has expired" | Request new reset link |
| Weak password | "Password must be at least 8 characters" | Enter stronger password |
| Email not found | Success message (security) | No action needed |
| Email send fails | Logged, but request succeeds | Token still works via URL |

---

## **11. Monitoring**

Check console logs for:

```bash
# Success
✓ Password reset email sent to user@example.com

# Failures
Failed to send reset email: [error details]
Reset password error: [error details]
```

---

## **12. Production Checklist**

Before going live:

- [ ] ✅ RESEND_API_KEY configured
- [ ] ✅ Domain verified in Resend
- [ ] ✅ NEXT_PUBLIC_APP_URL set correctly
- [ ] ✅ Test full flow (request → email → reset)
- [ ] ✅ Check spam folder
- [ ] ✅ Verify token expiration works
- [ ] ✅ Test with non-existent email
- [ ] ✅ Test with expired token

---

## **13. Common Issues**

### **Email not arriving?**
1. Check RESEND_API_KEY is set
2. Verify domain in Resend
3. Check spam folder
4. Look for console errors

### **Token expired?**
- Tokens expire after 1 hour
- Request a new reset link

### **Link not working?**
- Ensure NEXT_PUBLIC_APP_URL is correct
- Check token is in URL: `?token=xxx`

---

## **🎯 Quick Test**

```bash
# 1. Start server
pnpm run dev

# 2. Open browser
http://localhost:3000/auth/login

# 3. Click "¿Olvidaste tu contraseña?"

# 4. Enter your email

# 5. Check email or console for token

# 6. Reset password

# 7. Login with new password ✓
```

**Password recovery is fully working!** 🔐✉️
