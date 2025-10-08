import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    
    const { id } = await params
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        paymentConfig: true,
        createdAt: true,
      },
    })
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(tenant)
  } catch (error) {
    console.error('Get tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    )
  }
}
