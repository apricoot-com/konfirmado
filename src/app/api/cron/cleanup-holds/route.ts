import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cleanup expired holds
 * This endpoint should be called periodically (e.g., every 5 minutes) by a cron job
 * 
 * In production, configure Vercel Cron or similar:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-holds",
 *     "schedule": "*/5 * * * *"
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Delete all expired holds
    const result = await prisma.slotHold.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    
    console.log(`✓ Cleaned up ${result.count} expired holds`)
    
    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup holds error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup holds' },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggers
export async function POST(req: NextRequest) {
  return GET(req)
}
