# 🧪 Testing Production Build Locally

## **Method 1: Test Production Build (Recommended)**

This simulates exactly what Vercel will run:

```bash
# 1. Build for production
pnpm run build

# 2. Start production server
pnpm run start
```

Then open: http://localhost:3000

**This is the EXACT build that Vercel uses!**

---

## **Method 2: Check TypeScript Errors**

To catch type errors before deploying:

```bash
# Check all TypeScript errors
pnpm tsc --noEmit

# Or with watch mode
pnpm tsc --noEmit --watch
```

---

## **Method 3: Lint Check**

```bash
# Run ESLint
pnpm run lint
```

---

## **Common Issues & Fixes**

### **Issue: "implicitly has 'any' type"**
**Fix:** Add explicit type annotations:
```typescript
// ❌ Bad
services.map(service => ...)

// ✅ Good
services.map((service: any) => ...)
```

### **Issue: "Property does not exist on type"**
**Fix:** Check Prisma schema and regenerate client:
```bash
pnpm prisma generate
```

### **Issue: "useSearchParams() should be wrapped in suspense"**
**Fix:** Wrap component in Suspense:
```typescript
import { Suspense } from 'react'

function MyComponent() {
  const searchParams = useSearchParams()
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyComponent />
    </Suspense>
  )
}
```

---

## **Vercel Deployment Checklist**

Before deploying to Vercel:

- [ ] ✅ `pnpm run build` succeeds locally
- [ ] ✅ `pnpm run start` works without errors
- [ ] ✅ All environment variables set in Vercel
- [ ] ✅ Database connection string is correct
- [ ] ✅ Google OAuth credentials configured
- [ ] ✅ Wompi keys configured (if using payments)

---

## **Environment Variables for Vercel**

Make sure these are set in Vercel dashboard:

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/calendar/callback

# Wompi (optional)
WOMPI_PUBLIC_KEY=...
WOMPI_PRIVATE_KEY=...
WOMPI_INTEGRITY_SECRET=...
WOMPI_EVENTS_SECRET=...

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=...

# Cron (optional)
CRON_SECRET=...
```

---

## **Quick Test Commands**

```bash
# Full production test
pnpm run build && pnpm run start

# Type check only (fast)
pnpm tsc --noEmit

# Lint only
pnpm run lint

# Clean and rebuild
rm -rf .next && pnpm run build
```

---

## **Debugging Build Failures**

### **1. Check Build Logs**
```bash
pnpm run build 2>&1 | tee build.log
```

### **2. Enable Verbose Logging**
```bash
NODE_OPTIONS='--max-old-space-size=4096' pnpm run build
```

### **3. Check Prisma Client**
```bash
pnpm prisma generate
pnpm prisma validate
```

### **4. Clear Cache**
```bash
rm -rf .next node_modules/.cache
pnpm run build
```

---

## **Performance Tips**

### **Reduce Bundle Size**
Check what's making your bundle large:
```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true pnpm run build
```

### **Optimize Images**
- Use Next.js Image component
- Compress images before uploading
- Use WebP format

### **Code Splitting**
- Use dynamic imports for heavy components
- Lazy load routes with `next/dynamic`

---

## **Vercel-Specific Settings**

### **Build Command**
```
pnpm run build
```

### **Output Directory**
```
.next
```

### **Install Command**
```
pnpm install
```

### **Node Version**
```
20.x
```

---

## **Troubleshooting Vercel Deployment**

### **Build succeeds locally but fails on Vercel**
1. Check Node version matches
2. Verify all dependencies are in `package.json`
3. Check for environment-specific code
4. Ensure DATABASE_URL is accessible from Vercel

### **Database connection issues**
1. Whitelist Vercel IPs in database
2. Use connection pooling (PgBouncer)
3. Check SSL settings

### **Memory issues**
1. Increase memory limit in Vercel settings
2. Optimize large dependencies
3. Use edge runtime where possible

---

**🎯 Your build is now fixed and ready to deploy!**
