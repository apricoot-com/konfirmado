import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { generateToken } from '@/lib/utils'
import { sendCalendarInvitationEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, tenant } = await requireAuth()
    const { id } = await params
    
    // Get professional
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    })
    
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
    }
    
    // Generate new connection token
    const connectionToken = generateToken(32)
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    // Update professional with new token
    await prisma.professional.update({
      where: { id },
      data: {
        connectionToken,
        tokenExpiresAt,
      },
    })
    
    // Generate connection URL
    const connectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/${connectionToken}`
    
    // Send email if professional has email configured
    let emailSent = false
    if (professional.email && process.env.RESEND_API_KEY) {
      try {
        await sendCalendarInvitationEmail({
          email: professional.email,
          name: professional.name,
          connectionUrl,
          expiresAt: tokenExpiresAt,
        })
        emailSent = true
        console.log(`✓ Calendar invitation email sent to ${professional.email}`)
      } catch (error) {
        console.error('Failed to send invitation email:', error)
        // Don't fail the request if email fails
      }
    }
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'calendar_connected',
      entityType: 'professional',
      entityId: professional.id,
      metadata: { 
        name: professional.name, 
        action: 'invitation_sent',
        emailSent,
      },
      req,
    })
    
    return NextResponse.json({
      success: true,
      connectionUrl,
      expiresAt: tokenExpiresAt,
      emailSent,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Send invitation error:', error)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
