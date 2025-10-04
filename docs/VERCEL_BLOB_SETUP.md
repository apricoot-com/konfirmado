# Vercel Blob Storage Setup

This guide explains how to set up Vercel Blob Storage for image uploads in Konfirmado.

## 🎯 What is Vercel Blob?

Vercel Blob is a simple, fast, and reliable file storage solution that:
- ✅ Integrates seamlessly with Vercel deployments
- ✅ Provides CDN-backed URLs for fast global access
- ✅ Handles file uploads without additional infrastructure
- ✅ Includes a generous free tier

## 📦 What's Included

Konfirmado uses Vercel Blob for:
- **Tenant logos** - Brand identity
- **Service images** - Visual representation of services
- **Professional photos** - Profile pictures

## 🚀 Setup Instructions

### Step 1: Deploy to Vercel

First, deploy your Konfirmado instance to Vercel:

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

### Step 2: Enable Vercel Blob Storage

1. Go to your project dashboard on [vercel.com](https://vercel.com)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Blob** from the options
5. Click **Create**
6. Click **Connect** to link it to your project

### Step 3: Environment Variable (Automatic)

Vercel automatically adds the required environment variable:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

**No manual configuration needed!** ✅

### Step 4: Redeploy (if needed)

If your app was already deployed, trigger a new deployment to pick up the environment variable:

```bash
vercel --prod
```

## 💰 Pricing

### Free Tier (Hobby Plan)
- **Storage:** 500 MB
- **Bandwidth:** 5 GB/month
- **Perfect for:** MVP, small businesses, testing

### Pro Plan
- **Storage:** $0.15/GB/month
- **Bandwidth:** $0.30/GB
- **Perfect for:** Production, scaling businesses

### Estimate for Konfirmado

**Typical usage:**
- Tenant logo: ~100 KB
- Service image: ~200 KB
- Professional photo: ~150 KB

**Example calculation:**
- 10 tenants × 100 KB = 1 MB
- 50 services × 200 KB = 10 MB
- 30 professionals × 150 KB = 4.5 MB
- **Total:** ~15.5 MB storage

**Free tier can handle:**
- ~5,000 tenant logos
- ~2,500 service images
- ~3,300 professional photos

## 🔧 How It Works

### Upload Flow

```
User selects image
    ↓
Frontend validates (type, size)
    ↓
POST /api/upload (authenticated)
    ↓
Server validates again
    ↓
Upload to Vercel Blob
    ↓
Return public CDN URL
    ↓
Save URL to database
```

### File Naming Convention

Files are stored with this pattern:
```
{userId}/{timestamp}-{random}.{extension}
```

Example:
```
clx1234567890/1696789012345-abc123def.jpg
```

This ensures:
- ✅ Unique filenames (no collisions)
- ✅ User-scoped organization
- ✅ Easy cleanup per user

### Security

- ✅ **Authentication required** - Only logged-in users can upload
- ✅ **File type validation** - Only images allowed (JPEG, PNG, WebP, SVG)
- ✅ **Size limits** - Max 5MB per file
- ✅ **Public URLs** - Files are publicly accessible (safe for logos/images)

## 📝 API Reference

### Upload Endpoint

**POST** `/api/upload`

**Headers:**
```
Content-Type: multipart/form-data
Cookie: next-auth.session-token=...
```

**Body:**
```
file: <File>
```

**Response (Success):**
```json
{
  "url": "https://xxxxx.public.blob.vercel-storage.com/...",
  "filename": "clx123.../1696789012345-abc123def.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

**Response (Error):**
```json
{
  "error": "File too large. Maximum size is 5MB"
}
```

### Delete Endpoint

**DELETE** `/api/upload?url={encodedUrl}`

**Headers:**
```
Cookie: next-auth.session-token=...
```

**Response:**
```json
{
  "success": true
}
```

## 🎨 Using the ImageUpload Component

The `<ImageUpload />` component provides a user-friendly interface:

```tsx
import { ImageUpload } from '@/components/ui/image-upload'

function MyForm() {
  const [imageUrl, setImageUrl] = useState('')
  
  return (
    <ImageUpload
      label="Logo"
      value={imageUrl}
      onChange={setImageUrl}
      aspectRatio="square"  // or "video" or "auto"
      maxSizeMB={5}
    />
  )
}
```

**Props:**
- `label` - Display label
- `value` - Current image URL
- `onChange` - Callback when URL changes
- `disabled` - Disable uploads
- `aspectRatio` - Preview aspect ratio
- `maxSizeMB` - Max file size in MB

## 🔄 Migration from URL-based

The system still supports URL-based images! Users can:
1. **Upload files** - New preferred method
2. **Paste URLs** - Still works for external images

This provides flexibility during migration.

## 🐛 Troubleshooting

### "Unauthorized" error
**Cause:** User not logged in
**Solution:** Ensure NextAuth session is active

### "File too large" error
**Cause:** File exceeds 5MB limit
**Solution:** Compress image before upload

### "Invalid file type" error
**Cause:** Non-image file uploaded
**Solution:** Only upload JPEG, PNG, WebP, or SVG

### Upload works locally but not in production
**Cause:** `BLOB_READ_WRITE_TOKEN` not set
**Solution:** 
1. Check Vercel dashboard → Storage
2. Ensure Blob is connected
3. Redeploy to pick up environment variable

### Images not loading
**Cause:** CORS or network issue
**Solution:** Vercel Blob URLs are public and CORS-enabled by default

## 📊 Monitoring Usage

Check your Vercel Blob usage:
1. Go to Vercel dashboard
2. Navigate to **Storage** tab
3. Click on your Blob store
4. View **Usage** metrics

## 🔐 Best Practices

1. **Validate on both client and server** - Defense in depth
2. **Use appropriate aspect ratios** - Better UX
3. **Compress images before upload** - Save bandwidth
4. **Delete old images** - Clean up when updating
5. **Monitor usage** - Stay within free tier or budget

## 🚨 Limitations

- **Max file size:** 5MB (configurable in code)
- **Allowed types:** Images only (JPEG, PNG, WebP, SVG)
- **Free tier:** 500MB storage, 5GB bandwidth/month
- **No image processing:** Upload as-is (consider compression)

## 🔮 Future Enhancements

Potential improvements:
- [ ] Image compression on upload
- [ ] Multiple image upload
- [ ] Image cropping/editing
- [ ] Automatic thumbnail generation
- [ ] Image optimization (WebP conversion)

## 📚 Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing)
- [@vercel/blob NPM Package](https://www.npmjs.com/package/@vercel/blob)

---

**Setup complete! Your users can now upload images directly to Vercel Blob.** 🎉
