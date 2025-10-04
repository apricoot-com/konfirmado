import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { generateToken } from '@/lib/utils'
import { canAddProfessional, isSubscriptionActive } from '@/lib/subscriptions'
import { z } from 'zod'

const professionalSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  serviceIds: z.array(z.string().cuid()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    const professionals = await prisma.professional.findMany({
      where: { tenantId: tenant.id },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json(professionals)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Get professionals error:', error)
    return NextResponse.json({ error: 'Failed to fetch professionals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    
    // Check subscription status
    if (!isSubscriptionActive(tenant)) {
      return NextResponse.json(
        { error: 'Subscription expired. Please renew to continue.' },
        { status: 403 }
      )
    }
    
    // Check professional limit
    const currentCount = await prisma.professional.count({
      where: { tenantId: tenant.id, isActive: true },
    })
    
    const { allowed, limit } = canAddProfessional(currentCount, tenant.subscriptionPlan)
    
    if (!allowed) {
      return NextResponse.json(
        { 
          error: `Professional limit reached. Your ${tenant.subscriptionPlan} plan allows ${limit} professional(s). Upgrade to add more.`,
          limit,
          current: currentCount,
        },
        { status: 403 }
      )
    }
    
    const body = await req.json()
    const validated = professionalSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { serviceIds, name, description, photoUrl } = validated.data
    
    // Generate connection token for calendar OAuth
    const connectionToken = generateToken(32)
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    // Create professional with service associations
    const professional = await prisma.professional.create({
      data: {
        name,
        description: description || null,
        photoUrl: photoUrl || null,
        tenantId: tenant.id,
        connectionToken,
        tokenExpiresAt,
        services: serviceIds
          ? {
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
      action: 'professional_created',
      entityType: 'professional',
      entityId: professional.id,
      metadata: { name: professional.name },
      req,
    })
    
    return NextResponse.json(professional, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Create professional error:', error)
    return NextResponse.json({ error: 'Failed to create professional' }, { status: 500 })
  }
}
