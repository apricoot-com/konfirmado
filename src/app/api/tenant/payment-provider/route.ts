import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const wompiCredentialsSchema = z.object({
  publicKey: z.string().min(1),
  privateKey: z.string().min(1),
  eventsSecret: z.string().min(1),
  integritySecret: z.string().min(1),
})

const payuCredentialsSchema = z.object({
  merchantId: z.string().min(1),
  apiKey: z.string().min(1),
  apiLogin: z.string().min(1),
  accountId: z.string().min(1),
})

const paymentProviderSchema = z.object({
  provider: z.enum(['wompi', 'payu']),
  credentials: z.union([wompiCredentialsSchema, payuCredentialsSchema]),
})

export async function PATCH(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = paymentProviderSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { provider, credentials } = validated.data
    
    // Encrypt sensitive credentials
    let encryptedConfig: any = {}
    
    if (provider === 'wompi') {
      const wompiCreds = credentials as z.infer<typeof wompiCredentialsSchema>
      encryptedConfig = {
        publicKey: wompiCreds.publicKey, // Public key doesn't need encryption
        privateKey: encrypt(wompiCreds.privateKey),
        eventsSecret: encrypt(wompiCreds.eventsSecret),
        integritySecret: encrypt(wompiCreds.integritySecret),
      }
    } else if (provider === 'payu') {
      const payuCreds = credentials as z.infer<typeof payuCredentialsSchema>
      encryptedConfig = {
        merchantId: payuCreds.merchantId, // Merchant ID is not sensitive
        apiKey: encrypt(payuCreds.apiKey),
        apiLogin: encrypt(payuCreds.apiLogin),
        accountId: payuCreds.accountId, // Account ID is not sensitive
      }
    }
    
    // Update tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        paymentProvider: provider,
        paymentConfig: encryptedConfig,
      },
    })
    
    console.log(`✓ Payment provider updated to ${provider} for tenant ${tenant.name}`)
    
    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
    })
  } catch (error) {
    console.error('Update payment provider error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la configuración' },
      { status: 500 }
    )
  }
}
