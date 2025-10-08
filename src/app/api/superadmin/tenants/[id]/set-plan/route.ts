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
    
    // Update tenant plan
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: 'active',
        // For unlimited plan, set far future date
        subscriptionEndsAt: plan === 'unlimited' 
          ? new Date('2099-12-31')
          : undefined,
        // Clear trial for paid/unlimited plans
        trialEndsAt: plan !== 'trial' ? null : undefined,
      },
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
