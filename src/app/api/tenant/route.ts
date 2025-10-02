import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    // Return safe tenant data (no sensitive keys)
    return NextResponse.json({
      id: tenant.id,
      name: tenant.name,
      subscriptionPlan: tenant.subscriptionPlan,
      subscriptionStatus: tenant.subscriptionStatus,
      paymentMethodMask: tenant.paymentMethodMask,
      paymentMethodType: tenant.paymentMethodType,
    })
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant data' },
      { status: 500 }
    )
  }
}
