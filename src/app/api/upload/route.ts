import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const isDev = process.env.NODE_ENV === 'development'
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN

/**
 * Upload file to Vercel Blob Storage (production) or local filesystem (development)
 * Requires authentication
 * Supports: images (logo, service images, professional photos)
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get file from form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed (JPEG, PNG, WebP, SVG)' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const filename = `${session.user.id}/${timestamp}-${randomString}.${extension}`

    // Use local filesystem in development (if no Blob token)
    if (isDev && !hasBlob) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Save to public/uploads
      const uploadDir = join(process.cwd(), 'public', 'uploads', session.user.id)
      await mkdir(uploadDir, { recursive: true })
      
      const filepath = join(uploadDir, `${timestamp}-${randomString}.${extension}`)
      await writeFile(filepath, buffer)
      
      const url = `/uploads/${session.user.id}/${timestamp}-${randomString}.${extension}`
      console.log(`✓ [DEV] File uploaded locally: ${url}`)
      
      return NextResponse.json({
        url,
        filename,
        size: file.size,
        type: file.type,
      })
    }

    // Upload to Vercel Blob (production or dev with token)
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    console.log(`✓ File uploaded to Blob: ${blob.url}`)

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

/**
 * Delete file from Vercel Blob Storage or local filesystem
 */
export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      )
    }

    // Delete from local filesystem in development
    if (isDev && !hasBlob && url.startsWith('/uploads/')) {
      const { unlink } = await import('fs/promises')
      const filepath = join(process.cwd(), 'public', url)
      
      try {
        await unlink(filepath)
        console.log(`✓ [DEV] File deleted locally: ${url}`)
      } catch (err) {
        // File might not exist, ignore error
        console.log(`⚠️ [DEV] File not found: ${url}`)
      }
      
      return NextResponse.json({ success: true })
    }

    // Delete from Vercel Blob
    const { del } = await import('@vercel/blob')
    await del(url)

    console.log(`✓ File deleted from Blob: ${url}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
