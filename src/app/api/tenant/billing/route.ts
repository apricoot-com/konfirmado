import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const billingSchema = z.object({
  businessName: z.string().min(1),
  personType: z.enum(['natural', 'juridica']),
  documentType: z.enum(['NIT', 'RUC', 'CUIT', 'DNI', 'CC', 'CE']),
  fiscalId: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().length(2),
  currency: z.string().length(3),
})

export async function PATCH(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    const body = await req.json()
    
    const validated = billingSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    // Update tenant with billing info
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        billingInfo: validated.data,
      },
    })
    
    console.log(`✓ Billing info updated for tenant ${tenant.name}`)
    
    return NextResponse.json({
      success: true,
      message: 'Información de facturación actualizada exitosamente',
    })
  } catch (error) {
    console.error('Update billing info error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la información de facturación' },
      { status: 500 }
    )
  }
}
