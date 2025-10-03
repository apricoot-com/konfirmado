import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAcceptanceToken, createTokenTransaction, getPlatformWompiConfig } from '@/lib/wompi'
import { decrypt } from '@/lib/encryption'
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions'
import { generateToken } from '@/lib/utils'

/**
 * Cron job to charge monthly subscriptions
 * Should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find tenants with active subscriptions that need renewal
    const now = new Date()
    const tenants = await prisma.tenant.findMany({
      where: {
        subscriptionStatus: 'active',
        subscriptionPlan: { not: 'trial' },
        subscriptionEndsAt: { lte: now },
        paymentMethodToken: { not: null },
      },
      include: {
        users: { take: 1 }, // Get first user for email
      },
    })
    
    console.log(`Found ${tenants.length} subscriptions to renew`)
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }
    
    // Get PLATFORM Wompi config (all subscription charges go to platform)
    const platformWompiConfig = getPlatformWompiConfig()
    
    if (!platformWompiConfig) {
      return NextResponse.json(
        { error: 'Platform payment system not configured' },
        { status: 500 }
      )
    }
    
    for (const tenant of tenants) {
      try {
        const planDetails = SUBSCRIPTION_PLANS[tenant.subscriptionPlan]
        
        if (!planDetails || planDetails.price === 0) {
          console.log(`Skipping ${tenant.id} - no price`)
          continue
        }
        
        const paymentMethodInfo = tenant.paymentMethodInfo as any
        if (!paymentMethodInfo || !paymentMethodInfo.token) {
          console.log(`Skipping ${tenant.id} - no payment method`)
          results.failed++
          results.errors.push(`${tenant.name}: No payment method`)
          continue
        }
        
        const user = tenant.users[0]
        if (!user) {
          console.log(`Skipping ${tenant.id} - no user`)
          continue
        }
        
        // Get acceptance token using PLATFORM credentials
        const acceptanceToken = await createAcceptanceToken(platformWompiConfig.publicKey)
        
        // Generate reference
        const reference = `SUB-${Date.now()}-${generateToken(8)}`
        
        // Create transaction using PLATFORM credentials (money goes to platform)
        const transaction = await createTokenTransaction({
          token: decrypt(paymentMethodInfo.token),
          acceptanceToken,
          amountInCents: planDetails.price * 100,
          currency: 'COP',
          customerEmail: user.email,
          reference,
          privateKey: platformWompiConfig.privateKey,
          integritySecret: platformWompiConfig.integritySecret,
        })
        
        // Calculate new period
        const periodStart = new Date()
        const periodEnd = new Date()
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        
        // Create subscription record
        await prisma.subscription.create({
          data: {
            tenantId: tenant.id,
            plan: tenant.subscriptionPlan,
            amount: planDetails.price,
            status: transaction.data.status === 'APPROVED' ? 'active' : 'failed',
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
        
        // Update tenant
        if (transaction.data.status === 'APPROVED') {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionEndsAt: periodEnd,
              subscriptionStatus: 'active',
            },
          })
          
          results.success++
          console.log(`✓ Renewed ${tenant.name} - ${reference}`)
        } else {
          // Payment failed - mark as cancelled
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionStatus: 'cancelled',
            },
          })
          
          results.failed++
          results.errors.push(`${tenant.name}: Payment ${transaction.data.status}`)
          console.log(`✗ Failed ${tenant.name} - ${transaction.data.status}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${tenant.name}: ${error.message}`)
        console.error(`Error renewing ${tenant.name}:`, error)
      }
    }
    
    return NextResponse.json({
      processed: tenants.length,
      success: results.success,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Billing cron error:', error)
    return NextResponse.json(
      { error: 'Billing cron failed' },
      { status: 500 }
    )
  }
}
