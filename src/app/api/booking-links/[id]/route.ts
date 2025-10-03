import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const bookingLinkSchema = z.object({
  name: z.string().min(3).max(100),
  serviceId: z.string().cuid().optional().or(z.literal('')),
  professionalId: z.string().cuid().optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth()
    const { id } = await params
    
    const link = await prisma.bookingLink.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    })
    
    if (!link) {
      return NextResponse.json({ error: 'Booking link not found' }, { status: 404 })
    }
    
    return NextResponse.json(link)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get booking link error:', error)
    return NextResponse.json({ error: 'Failed to fetch booking link' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, tenant } = await requireAuth()
    const { id } = await params
    const body = await req.json()
    
    const validated = bookingLinkSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { serviceId, professionalId, expiresAt, ...linkData } = validated.data
    
    // Update booking link
    const link = await prisma.bookingLink.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        ...linkData,
        serviceId: serviceId || null,
        professionalId: professionalId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_updated',
      entityType: 'booking_link',
      entityId: link.id,
      metadata: { name: link.name },
      req,
    })
    
    return NextResponse.json(link)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update booking link error:', error)
    return NextResponse.json({ error: 'Failed to update booking link' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, tenant } = await requireAuth()
    const { id } = await params
    
    // Soft delete by setting isActive to false
    const link = await prisma.bookingLink.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        isActive: false,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_deleted',
      entityType: 'booking_link',
      entityId: link.id,
      metadata: { name: link.name },
      req,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Delete booking link error:', error)
    return NextResponse.json({ error: 'Failed to delete booking link' }, { status: 500 })
  }
}
