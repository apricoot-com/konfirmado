import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const professionalSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  photoUrl: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.string().cuid()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth()
    const { id } = await params
    
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    })
    
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
    }
    
    return NextResponse.json(professional)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get professional error:', error)
    return NextResponse.json({ error: 'Failed to fetch professional' }, { status: 500 })
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
    
    const validated = professionalSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { serviceIds, name, email, description, photoUrl, businessHours, timezone } = validated.data as any
    
    // Update professional
    const professional = await prisma.professional.update({
      where: {
        id,
        tenantId: tenant.id,
      },
      data: {
        name,
        email,
        description,
        photoUrl,
        businessHours,
        timezone,
        services: serviceIds
          ? {
              deleteMany: {},
              create: serviceIds.map((serviceId) => ({
                serviceId,
              })),
            }
          : undefined,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'professional_updated',
      entityType: 'professional',
      entityId: professional.id,
      metadata: { name: professional.name },
      req,
    })
    
    return NextResponse.json(professional)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update professional error:', error)
    return NextResponse.json({ error: 'Failed to update professional' }, { status: 500 })
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
    const professional = await prisma.professional.update({
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
      action: 'professional_updated',
      entityType: 'professional',
      entityId: professional.id,
      metadata: { name: professional.name, action: 'deactivated' },
      req,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Delete professional error:', error)
    return NextResponse.json({ error: 'Failed to delete professional' }, { status: 500 })
  }
}
