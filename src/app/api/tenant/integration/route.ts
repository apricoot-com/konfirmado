import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const integrationSchema = z.object({
  callbackUrl: z.string().url().startsWith('https://'),
  returnUrl: z.string().url().startsWith('https://'),
  privacyPolicyUrl: z.string().url().optional().or(z.literal('')),
  termsUrl: z.string().url().optional().or(z.literal('')),
})

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = integrationSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: validated.data,
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_updated',
      entityType: 'tenant',
      entityId: tenant.id,
      metadata: { action: 'integration_updated' },
      req,
    })
    
    return NextResponse.json(updatedTenant)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update integration error:', error)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}
