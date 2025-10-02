import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
  durationMinutes: z.number().int().min(15).max(480),
  price: z.number().int().min(0),
  chargeType: z.enum(['partial', 'total']),
  professionalIds: z.array(z.string().cuid()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(services)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = serviceSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { professionalIds, ...serviceData } = validated.data
    
    // Create service with professional associations
    const service = await prisma.service.create({
      data: {
        ...serviceData,
        tenantId: tenant.id,
        professionals: professionalIds
          ? {
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
      action: 'service_created',
      entityType: 'service',
      entityId: service.id,
      metadata: { name: service.name },
      req,
    })
    
    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
