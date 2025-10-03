import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional().or(z.literal('')),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().int().min(0),
  chargeType: z.enum(['partial', 'total']),
  partialPercentage: z.number().int().min(1).max(100).default(25),
  confirmationMessage: z.string().max(1000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  professionalIds: z.array(z.string().cuid()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth()
    const { id } = await params
    
    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
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
    
    const validated = serviceSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { professionalIds, ...serviceData } = validated.data
    
    // Update service
    const service = await prisma.service.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        ...serviceData,
        professionals: professionalIds
          ? {
              deleteMany: {},
              create: professionalIds.map((professionalId) => ({
                professionalId,
              })),
            }
          : undefined,
      },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'service_updated',
      entityType: 'service',
      entityId: service.id,
      metadata: { name: service.name },
      req,
    })
    
    return NextResponse.json(service)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update service error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
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
    const service = await prisma.service.update({
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
      action: 'service_updated',
      entityType: 'service',
      entityId: service.id,
      metadata: { name: service.name, action: 'deactivated' },
      req,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
