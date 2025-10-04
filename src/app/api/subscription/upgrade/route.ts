import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { createAcceptanceToken, createTokenTransaction, getPlatformWompiConfig } from '@/lib/wompi'
import { decrypt } from '@/lib/encryption'
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions'
import { generateToken } from '@/lib/utils'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const upgradeSchema = z.object({
  plan: z.enum(['basic', 'pro', 'enterprise']),
})

export async function POST(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = upgradeSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { plan } = validated.data
    const planDetails = SUBSCRIPTION_PLANS[plan]
    
    if (!planDetails) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    // Enterprise requires manual contact
    if (plan === 'enterprise') {
      return NextResponse.json(
        { error: 'Please contact sales for Enterprise plan' },
        { status: 400 }
      )
    }
    
    // Check if payment method exists
    const paymentMethodInfo = tenant.paymentMethodInfo as any
    if (!paymentMethodInfo || !paymentMethodInfo.token) {
      return NextResponse.json(
        { error: 'Payment method required. Please add a card first.' },
        { status: 400 }
      )
    }
    
    // Get PLATFORM Wompi config (subscriptions go to platform account)
    const platformWompiConfig = getPlatformWompiConfig()
    
    if (!platformWompiConfig) {
      return NextResponse.json(
        { error: 'Platform payment system not configured. Please contact support.' },
        { status: 500 }
      )
    }
    
    // Get acceptance token
    const acceptanceToken = await createAcceptanceToken(platformWompiConfig.publicKey)
    
    // Generate reference
    const reference = `SUB-${Date.now()}-${generateToken(8)}`
    
    // Create transaction with stored token using PLATFORM credentials
    const transaction = await createTokenTransaction({
      token: decrypt(paymentMethodInfo.token),
      acceptanceToken,
      amountInCents: planDetails.price * 100, // Convert to cents
      currency: 'COP',
      customerEmail: user.email || 'noemail@konfirmado.com',
      reference,
      privateKey: platformWompiConfig.privateKey,
      integritySecret: platformWompiConfig.integritySecret,
    })
    
    // Calculate subscription period (1 month from now)
    const now = new Date()
    const periodStart = new Date(now)
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    
    // Create subscription record
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan,
        amount: planDetails.price,
        status: transaction.data.status === 'APPROVED' ? 'active' : 'pending',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        paymentInfo: {
          provider: 'wompi',
          reference,
          status: transaction.data.status,
          transactionId: transaction.data.id,
        },
      },
    })
    
    // Update tenant subscription if approved
    if (transaction.data.status === 'APPROVED') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: 'active',
          subscriptionEndsAt: periodEnd,
          trialEndsAt: null, // Clear trial
        },
      })
      
      // Audit log
      await logAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: 'subscription_upgraded',
        entityType: 'tenant',
        entityId: tenant.id,
        metadata: {
          plan,
          amount: planDetails.price,
          reference,
        },
        req,
      })
    }
    
    return NextResponse.json({
      success: transaction.data.status === 'APPROVED',
      status: transaction.data.status,
      reference,
      message: transaction.data.status === 'APPROVED'
        ? 'Subscription upgraded successfully'
        : 'Payment is being processed',
    })
  } catch (error: any) {
    console.error('Upgrade subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}
