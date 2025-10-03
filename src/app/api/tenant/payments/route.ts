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
  wompiMode: z.enum(['test', 'production']).optional(),
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
    
    // Get existing payment config or create new one
    const existingConfig = (tenant.paymentConfig as any) || {}
    
    // Build new payment config (merge with existing)
    const paymentConfig: any = {
      provider: 'wompi',
      publicKey: validated.data.wompiPublicKey || existingConfig.publicKey,
      privateKey: validated.data.wompiPrivateKey 
        ? encrypt(validated.data.wompiPrivateKey)
        : existingConfig.privateKey,
      integritySecret: validated.data.wompiIntegritySecret
        ? encrypt(validated.data.wompiIntegritySecret)
        : existingConfig.integritySecret,
      eventsSecret: validated.data.wompiEventsSecret
        ? encrypt(validated.data.wompiEventsSecret)
        : existingConfig.eventsSecret,
      mode: validated.data.wompiMode || existingConfig.mode || 'test',
    }
    
    // Update tenant with new JSON structure
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        paymentProvider: 'wompi',
        paymentConfig,
      },
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
