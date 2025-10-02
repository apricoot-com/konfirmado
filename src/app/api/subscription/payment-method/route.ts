import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { tokenizeCard, getWompiConfig } from '@/lib/wompi'
import { encrypt } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const paymentMethodSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  cardHolder: z.string().min(2),
  expMonth: z.string().length(2),
  expYear: z.string().length(2),
  cvc: z.string().min(3).max(4),
})

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = paymentMethodSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { cardNumber, cardHolder, expMonth, expYear, cvc } = validated.data
    
    // Get Wompi config
    const wompiConfig = getWompiConfig(tenant)
    
    if (!wompiConfig) {
      return NextResponse.json(
        { error: 'Wompi not configured' },
        { status: 400 }
      )
    }
    
    // Tokenize card with Wompi
    const tokenData = await tokenizeCard({
      number: cardNumber,
      cvc,
      exp_month: expMonth,
      exp_year: expYear,
      card_holder: cardHolder,
      publicKey: wompiConfig.publicKey,
    })
    
    // Save encrypted token
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        paymentMethodToken: encrypt(tokenData.id),
        paymentMethodType: tokenData.type,
        paymentMethodMask: tokenData.mask,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'payment_method_added',
      entityType: 'tenant',
      entityId: tenant.id,
      metadata: {
        type: tokenData.type,
        mask: tokenData.mask,
      },
      req,
    })
    
    return NextResponse.json({
      success: true,
      mask: tokenData.mask,
    })
  } catch (error: any) {
    console.error('Payment method error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save payment method' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    
    // Remove payment method
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        paymentMethodToken: null,
        paymentMethodType: null,
        paymentMethodMask: null,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'payment_method_removed',
      entityType: 'tenant',
      entityId: tenant.id,
      metadata: {},
      req,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove payment method error:', error)
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    )
  }
}
