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
})

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    const links = await prisma.bookingLink.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(links)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get booking links error:', error)
    return NextResponse.json({ error: 'Failed to fetch booking links' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = bookingLinkSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { serviceId, professionalId, expiresAt, name } = validated.data
    
    // Create booking link
    const link = await prisma.bookingLink.create({
      data: {
        name: name || 'Link de agendamiento',
        tenantId: tenant.id,
        serviceId: serviceId || null,
        professionalId: professionalId || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_created',
      entityType: 'booking_link',
      entityId: link.id,
      metadata: { name: link.name },
      req,
    })
    
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Create booking link error:', error)
    return NextResponse.json({ error: 'Failed to create booking link' }, { status: 500 })
  }
}
