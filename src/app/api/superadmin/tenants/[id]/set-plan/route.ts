import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const setPlanSchema = z.object({
  plan: z.enum(['unlimited', 'trial', 'basic', 'pro', 'enterprise']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    
    const { id } = await params
    const body = await req.json()
    
    const validated = setPlanSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }
    
    const { plan } = validated.data
    
    // Calculate dates based on plan
    const now = new Date()
    const updateData: any = {
      subscriptionPlan: plan,
      subscriptionStatus: 'active',
    }
    
    if (plan === 'unlimited') {
      // Unlimited: set far future date, clear trial
      updateData.subscriptionEndsAt = new Date('2099-12-31')
      updateData.trialEndsAt = null
    } else if (plan === 'trial') {
      // Trial: set 30 days trial, clear subscription end
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 30)
      updateData.trialEndsAt = trialEnd
      updateData.subscriptionEndsAt = null
    } else {
      // Paid plans: set 30 days subscription, clear trial
      const subscriptionEnd = new Date(now)
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1)
      updateData.subscriptionEndsAt = subscriptionEnd
      updateData.trialEndsAt = null
    }
    
    // Update tenant plan
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    })
    
    console.log(`✓ Superadmin set ${tenant.name} to ${plan} plan`)
    
    return NextResponse.json({
      success: true,
      message: `Plan updated to ${plan}`,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.subscriptionPlan,
        status: tenant.subscriptionStatus,
      },
    })
  } catch (error) {
    console.error('Set plan error:', error)
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}
