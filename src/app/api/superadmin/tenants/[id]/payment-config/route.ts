import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const paymentConfigSchema = z.object({
  publicKey: z.string().min(1, 'Public key is required'),
  privateKey: z.string().min(1, 'Private key is required'),
  eventsSecret: z.string().min(1, 'Events secret is required'),
  integritySecret: z.string().min(1, 'Integrity secret is required'),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    
    const { id } = await params
    const body = await req.json()
    
    const validated = paymentConfigSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { publicKey, privateKey, eventsSecret, integritySecret } = validated.data
    
    // Encrypt sensitive data
    const encryptedPrivateKey = encrypt(privateKey)
    const encryptedEventsSecret = encrypt(eventsSecret)
    const encryptedIntegritySecret = encrypt(integritySecret)
    
    // Update tenant payment config
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        paymentProvider: 'wompi',
        paymentConfig: {
          publicKey,
          privateKey: encryptedPrivateKey,
          eventsSecret: encryptedEventsSecret,
          integritySecret: encryptedIntegritySecret,
        },
      },
    })
    
    console.log(`✓ Payment config updated for tenant ${tenant.name} by superadmin`)
    
    return NextResponse.json({
      success: true,
      message: 'Payment configuration updated successfully',
    })
  } catch (error) {
    console.error('Update payment config error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment configuration' },
      { status: 500 }
    )
  }
}
