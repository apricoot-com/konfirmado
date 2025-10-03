import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    const paymentMethodInfo = tenant.paymentMethodInfo as any
    
    console.log('Tenant data being returned:', {
      id: tenant.id,
      paymentMethodMask: paymentMethodInfo?.mask,
      paymentMethodType: paymentMethodInfo?.type,
    })
    
    // Return safe tenant data (no sensitive keys)
    const response = {
      id: tenant.id,
      name: tenant.name,
      subscriptionPlan: tenant.subscriptionPlan,
      subscriptionStatus: tenant.subscriptionStatus,
      paymentMethodMask: paymentMethodInfo?.mask,
      paymentMethodType: paymentMethodInfo?.type,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant data' },
      { status: 500 }
    )
  }
}
