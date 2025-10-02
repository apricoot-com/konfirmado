import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const paymentsSchema = z.object({
  wompiPublicKey: z.string().optional().or(z.literal('')),
  wompiPrivateKey: z.string().optional().or(z.literal('')),
  wompiIntegritySecret: z.string().optional().or(z.literal('')),
  wompiEventsSecret: z.string().optional().or(z.literal('')),
  wompiMode: z.enum(['test', 'production']),
})

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = paymentsSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const data: any = {
      wompiMode: validated.data.wompiMode,
    }
    
    // Only update public key if provided
    if (validated.data.wompiPublicKey) {
      data.wompiPublicKey = validated.data.wompiPublicKey
    }
    
    // Encrypt and update secret fields only if provided
    if (validated.data.wompiPrivateKey) {
      data.wompiPrivateKey = encrypt(validated.data.wompiPrivateKey)
    }
    
    if (validated.data.wompiIntegritySecret) {
      data.wompiIntegritySecret = encrypt(validated.data.wompiIntegritySecret)
    }
    
    if (validated.data.wompiEventsSecret) {
      data.wompiEventsSecret = encrypt(validated.data.wompiEventsSecret)
    }
    
    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data,
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_updated',
      entityType: 'tenant',
      entityId: tenant.id,
      metadata: { action: 'payments_updated', mode: validated.data.wompiMode },
      req,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update payments error:', error)
    return NextResponse.json({ error: 'Failed to update payments configuration' }, { status: 500 })
  }
}
