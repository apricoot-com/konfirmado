# Google Calendar Integration Setup Guide

## 🎯 Overview

This guide will help you set up Google Calendar integration for Konfirmado. Professionals will be able to connect their Google Calendars to:
- **Show availability** (read free/busy times)
- **Create events** automatically when bookings are confirmed
- **Update/delete events** when bookings are rescheduled or cancelled

---

## 📋 Prerequisites

- Google Account (Gmail)
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Admin access to your Konfirmado deployment

---

## 🚀 Step-by-Step Setup

### **Step 1: Create a Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project details:
   - **Project name**: `Konfirmado` (or your preferred name)
   - **Organization**: Leave as default or select your organization
4. Click **"Create"**
5. Wait for the project to be created (takes ~30 seconds)

---

### **Step 2: Enable Google Calendar API**

1. In the Google Cloud Console, make sure your new project is selected
2. Go to **"APIs & Services"** → **"Library"**
3. Search for **"Google Calendar API"**
4. Click on **"Google Calendar API"**
5. Click **"Enable"**
6. Wait for the API to be enabled

---

### **Step 3: Configure OAuth Consent Screen**

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**

**App Information:**
- **App name**: `Konfirmado`
- **User support email**: Your email address
- **App logo**: (Optional) Upload your logo
- **Application home page**: `https://yourdomain.com`
- **Application privacy policy link**: `https://yourdomain.com/privacy`
- **Application terms of service link**: `https://yourdomain.com/terms`

**Developer contact information:**
- **Email addresses**: Your email address

4. Click **"Save and Continue"**

**Scopes:**
5. Click **"Add or Remove Scopes"**
6. Search and select these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.freebusy`
   - `https://www.googleapis.com/auth/calendar.events`
7. Click **"Update"**
8. Click **"Save and Continue"**

**Test users** (if app is in testing mode):
9. Click **"Add Users"**
10. Add email addresses of professionals who will test the integration
11. Click **"Save and Continue"**

12. Review and click **"Back to Dashboard"**

---

### **Step 4: Create OAuth 2.0 Credentials**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**

**Configure OAuth Client:**
- **Name**: `Konfirmado Web Client`

**Authorized JavaScript origins:**
- Add: `http://localhost:3000` (for development)
- Add: `https://yourdomain.com` (for production)

**Authorized redirect URIs:**
- Add: `http://localhost:3000/api/calendar/callback` (for development)
- Add: `https://yourdomain.com/api/calendar/callback` (for production)

4. Click **"Create"**
5. **IMPORTANT**: Copy the **Client ID** and **Client Secret**
   - You'll need these for your `.env` file

---

### **Step 5: Configure Environment Variables**

Add these to your `.env` file:

```bash
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your domain in production
```

**Example:**
```bash
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
NEXT_PUBLIC_APP_URL=https://konfirmado.com
```

---

### **Step 6: Publish Your App (Production Only)**

**For Development/Testing:**
- Your app can stay in "Testing" mode
- Only test users can connect their calendars
- No verification needed

**For Production:**
1. Go to **"OAuth consent screen"**
2. Click **"Publish App"**
3. Click **"Confirm"**
4. **Note**: If you request sensitive scopes (like calendar.events), Google may require verification
   - This can take 1-2 weeks
   - You'll need to provide:
     - Privacy policy URL
     - Terms of service URL
     - Video demo of your app
     - Explanation of why you need calendar access

**Verification Requirements:**
- Apps requesting calendar write access need verification
- Apps with <100 users can stay in testing mode
- Verification is free but requires documentation

---

## 🧪 Testing the Integration

### **1. Restart Your Development Server**

```bash
pnpm run dev
```

### **2. Connect a Professional's Calendar**

1. Log in to Konfirmado admin panel
2. Go to **"Professionals"**
3. Create or edit a professional
4. Click **"Connect Calendar"** (or similar button)
5. You'll be redirected to Google OAuth
6. Sign in with the professional's Google account
7. **Grant permissions**:
   - ✅ See and download calendars
   - ✅ See free/busy information
   - ✅ Create, edit, and delete events
8. Select which calendar to use (usually "Primary")
9. You'll be redirected back to Konfirmado
10. Professional's calendar is now connected! ✅

### **3. Test Booking Flow**

1. Create a booking link
2. Go through the booking wizard:
   - Select service
   - Select professional
   - Choose available time slot
   - Enter customer details
   - Complete payment
3. **Check the professional's Google Calendar**
   - Event should appear automatically
   - Title: `Service Name - Customer Name`
   - Description: Service details + customer info
   - Time: Correct start/end time
   - Attendee: Customer email

---

## 🔧 Troubleshooting

### **Error: "Access blocked: This app's request is invalid"**
**Solution**: Make sure you've added the correct redirect URI in Google Console

### **Error: "redirect_uri_mismatch"**
**Solution**: 
- Check that `NEXT_PUBLIC_APP_URL` matches your domain
- Verify redirect URI in Google Console matches exactly: `{NEXT_PUBLIC_APP_URL}/api/calendar/callback`

### **Error: "invalid_grant" or "Token has been expired or revoked"**
**Solution**: 
- Professional needs to reconnect their calendar
- Go to Professional settings → Reconnect Calendar

### **Calendar events not being created**
**Check:**
1. Professional's calendar is connected (status shows "Connected")
2. Booking payment was successful (status = "paid")
3. Check server logs for errors
4. Verify Google Calendar API is enabled

### **"This app hasn't been verified" warning**
**For Development:**
- Click "Advanced" → "Go to Konfirmado (unsafe)"
- This is normal for apps in testing mode

**For Production:**
- Submit app for verification (see Step 6)
- Or keep app in testing mode with <100 users

---

## 🔐 Security Best Practices

1. **Never commit credentials** to Git
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Rotate secrets** if compromised
   - Generate new OAuth client in Google Console
   - Update `.env` file
   - Professionals will need to reconnect

3. **Use HTTPS** in production
   - Google requires HTTPS for OAuth redirects
   - Update `NEXT_PUBLIC_APP_URL` to use `https://`

4. **Limit scopes** to what you need
   - We only request calendar read/write
   - Don't request additional permissions

---

## 📊 What Happens When a Booking is Confirmed

1. **User completes payment** → Wompi webhook received
2. **Payment approved** → Booking status = "paid"
3. **Calendar event created** automatically:
   - Title: `{Service Name} - {Customer Name}`
   - Description: Service details + customer contact info
   - Time: Booking start/end time
   - Attendee: Customer email (they get invite)
   - Reminders: Email (1 day before) + Popup (30 min before)
4. **Event ID saved** to booking record
5. **Professional sees appointment** in Google Calendar

---

## 🎯 Next Steps

After setup is complete:

1. ✅ **Test with a real booking**
2. ✅ **Verify events appear in Google Calendar**
3. ✅ **Check customer receives calendar invite**
4. ✅ **Test rescheduling** (future feature)
5. ✅ **Test cancellation** (future feature)

---

## 📞 Support

If you encounter issues:

1. Check server logs: `pnpm run dev` (look for errors)
2. Verify Google Cloud Console settings
3. Test with a different Google account
4. Check [Google Calendar API documentation](https://developers.google.com/calendar/api/guides/overview)

---

## ✅ Checklist

- [ ] Google Cloud Project created
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Environment variables set in `.env`
- [ ] Development server restarted
- [ ] Professional calendar connected
- [ ] Test booking completed
- [ ] Calendar event created successfully
- [ ] Production app published (if needed)

---

**🎉 You're all set! Professionals can now connect their Google Calendars and bookings will automatically create events.**
