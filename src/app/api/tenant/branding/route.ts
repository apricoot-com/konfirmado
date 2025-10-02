import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const brandingSchema = z.object({
  name: z.string().min(3).max(100),
  logoUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  subdomain: z.string().regex(/^[a-z0-9-]*$/).optional().or(z.literal('')),
  privacyPolicyUrl: z.string().url().optional().or(z.literal('')),
  termsUrl: z.string().url().optional().or(z.literal('')),
})

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = brandingSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { subdomain, ...data } = validated.data
    
    // Check if subdomain is already taken
    if (subdomain && subdomain !== tenant.subdomain) {
      const existing = await prisma.tenant.findUnique({
        where: { subdomain },
      })
      
      if (existing) {
        return NextResponse.json(
          { error: 'Subdomain already taken' },
          { status: 400 }
        )
      }
    }
    
    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...data,
        subdomain: subdomain || null,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: tenant.id,
      userId: user.id,
      action: 'link_updated',
      entityType: 'tenant',
      entityId: tenant.id,
      metadata: { action: 'branding_updated' },
      req,
    })
    
    return NextResponse.json(updatedTenant)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Update branding error:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
