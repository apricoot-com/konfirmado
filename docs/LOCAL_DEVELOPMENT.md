# 🛠️ Local Development Guide

Guide for developing Konfirmado locally with full feature support.

## 🎯 Overview

Konfirmado uses Vercel Blob for file uploads. For local development, you have 3 options:

---

## ✅ Option 1: Vercel Dev (Recommended)

Use Vercel's development server to access production environment variables and Blob storage.

### Setup

1. **Install Vercel CLI:**
   ```bash
   pnpm i -g vercel
   ```

2. **Link your project:**
   ```bash
   vercel link
   ```

3. **Pull environment variables:**
   ```bash
   vercel env pull .env.local
   ```

4. **Run with Vercel Dev:**
   ```bash
   vercel dev
   ```

### Pros
- ✅ Access to real Vercel Blob storage
- ✅ Same environment as production
- ✅ All environment variables synced
- ✅ Hot reload works

### Cons
- ⚠️ Requires internet connection
- ⚠️ Slightly slower than `next dev`

### When to use
- Testing file uploads
- Testing with production-like environment
- Debugging deployment issues

---

## 🔄 Option 2: Mock Blob Storage (Fast Development)

Use URL-based images during development, switch to Blob in production.

### Setup

1. **Don't set `BLOB_READ_WRITE_TOKEN`** in `.env.local`

2. **The component automatically falls back to URL input**

3. **Run normally:**
   ```bash
   pnpm dev
   ```

### How it works

The `ImageUpload` component will:
- Show "Upload" button (disabled if no Blob token)
- Show "Use URL" option (always available)
- Users paste image URLs from:
  - Imgur
  - Cloudinary
  - Google Drive
  - Any public URL

### Pros
- ✅ Fast development
- ✅ No external dependencies
- ✅ Works offline
- ✅ No Vercel account needed

### Cons
- ❌ Can't test actual file uploads
- ❌ Different UX than production

### When to use
- UI development
- Quick iterations
- Working on non-upload features

---

## 🧪 Option 3: Local Blob Emulator (Advanced)

Create a local file upload endpoint that mimics Vercel Blob.

### Setup

1. **Create local upload handler:**

Create `/src/app/api/upload-local/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    // Validate
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Save to public/uploads
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const filename = `${Date.now()}-${file.name}`
    const filepath = join(process.cwd(), 'public', 'uploads', filename)
    
    await writeFile(filepath, buffer)
    
    const url = `/uploads/${filename}`
    
    return NextResponse.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

2. **Create uploads directory:**
   ```bash
   mkdir -p public/uploads
   echo "*" > public/uploads/.gitignore
   ```

3. **Update ImageUpload component to use local endpoint in dev:**

```typescript
const uploadEndpoint = process.env.NODE_ENV === 'development' 
  ? '/api/upload-local' 
  : '/api/upload'

const response = await fetch(uploadEndpoint, {
  method: 'POST',
  body: formData,
})
```

### Pros
- ✅ Test file uploads locally
- ✅ Fast development
- ✅ Works offline
- ✅ No Vercel account needed

### Cons
- ❌ Different storage mechanism than production
- ❌ Files stored locally (not CDN)
- ❌ Need to gitignore uploads folder

### When to use
- Testing upload flow
- Offline development
- CI/CD testing

---

## 📋 Recommended Workflow

### For Most Development
```bash
# Fast iteration
pnpm dev

# Use URL-based images
# Paste URLs from Imgur, etc.
```

### When Testing Uploads
```bash
# Use Vercel Dev
vercel dev

# Real Blob storage
# Test actual upload flow
```

### Before Deployment
```bash
# Test with Vercel Dev
vercel dev

# Verify uploads work
# Check all features
```

---

## 🔧 Environment Variables for Local Dev

### Minimal `.env.local` (Fast Dev)

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/konfirmado_dev"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Encryption
ENCRYPTION_KEY="dev-key-32-characters-long!!"

# Google Calendar
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Callbacks
CALLBACK_SECRET="dev-callback-secret"

# Optional: Skip for fast dev
# RESEND_API_KEY="re_..."
# BLOB_READ_WRITE_TOKEN="vercel_blob_..."
```

### Full `.env.local` (Production-like)

Pull from Vercel:
```bash
vercel env pull .env.local
```

---

## 🧪 Testing Checklist

### Without Blob (URL-based)
- [ ] Can paste image URLs
- [ ] Images display correctly
- [ ] Form submission works
- [ ] URLs saved to database

### With Blob (Vercel Dev)
- [ ] Upload button works
- [ ] File validation works
- [ ] Upload progress shows
- [ ] Image appears after upload
- [ ] URL saved to database
- [ ] Can delete uploaded image

---

## 🐛 Troubleshooting

### "Unauthorized" on upload
**Cause:** Not logged in
**Solution:** Login first, then try upload

### Upload button disabled
**Cause:** No `BLOB_READ_WRITE_TOKEN`
**Solution:** 
- Use `vercel dev`, OR
- Use URL input instead

### "vercel dev" not working
**Cause:** Project not linked
**Solution:**
```bash
vercel link
vercel env pull .env.local
vercel dev
```

### Uploads work in dev but not production
**Cause:** Blob not connected in Vercel
**Solution:**
1. Vercel Dashboard → Storage
2. Create Blob store
3. Connect to project
4. Redeploy

---

## 💡 Pro Tips

1. **Use `vercel dev` only when needed** - It's slower than `next dev`
2. **Keep `.env.local` minimal** - Only add what you need
3. **Use URL input for quick testing** - Faster than uploading
4. **Test uploads before deploying** - Use `vercel dev`
5. **Don't commit uploads folder** - Already gitignored

---

## 📚 Related Docs

- [Vercel Blob Setup](./VERCEL_BLOB_SETUP.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Environment Variables](../README.md#environment-variables)

---

**Happy coding! 🚀**
