import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/utils'
import { generateCheckoutUrl, getWompiConfig } from '@/lib/wompi'
import { z } from 'zod'

const createBookingSchema = z.object({
  linkId: z.string(),
  serviceId: z.string().cuid(),
  professionalId: z.string().cuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  userName: z.string().min(2),
  userEmail: z.string().email(),
  userPhone: z.string(),
  acceptedTerms: z.boolean(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = createBookingSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const data = validated.data
    
    // Get booking link
    const link = await prisma.bookingLink.findUnique({
      where: { publicId: data.linkId },
      include: { tenant: true },
    })
    
    if (!link || !link.isActive) {
      return NextResponse.json({ error: 'Invalid booking link' }, { status: 400 })
    }
    
    // Check if link is expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Booking link expired' }, { status: 400 })
    }
    
    // Get service
    const service = await prisma.service.findFirst({
      where: {
        id: data.serviceId,
        tenantId: link.tenantId,
        isActive: true,
      },
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    // Get professional
    const professional = await prisma.professional.findFirst({
      where: {
        id: data.professionalId,
        tenantId: link.tenantId,
        isActive: true,
      },
    })
    
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
    }
    
    // Get Wompi config
    const wompiConfig = getWompiConfig(link.tenant)
    
    if (!wompiConfig) {
      return NextResponse.json(
        { error: 'Payment configuration not complete' },
        { status: 400 }
      )
    }
    
    // Calculate charge amount
    const chargeAmount = service.chargeType === 'partial'
      ? Math.floor(service.price * ((service.partialPercentage || 25) / 100))
      : service.price
    
    // Generate unique reference and cancellation token
    const reference = `BK-${Date.now()}-${generateToken(8)}`
    const cancellationToken = generateToken(32)
    
    // Create booking and payment in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          tenant: {
            connect: { id: link.tenantId },
          },
          link: {
            connect: { id: link.id },
          },
          service: {
            connect: { id: service.id },
          },
          professional: {
            connect: { id: professional.id },
          },
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone,
          acceptedTerms: data.acceptedTerms,
          status: 'pending',
          cancellationToken,
        },
      })
      
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          tenant: {
            connect: { id: link.tenantId },
          },
          booking: {
            connect: { id: booking.id },
          },
          provider: 'wompi',
          reference,
          amount: chargeAmount,
          currency: 'COP',
          status: 'pending',
        },
      })
      
      return { booking, payment }
    })
    
    // Generate Wompi checkout URL
    // Convert COP to cents (multiply by 100)
    const checkoutUrl = generateCheckoutUrl({
      reference,
      amountInCents: chargeAmount * 100,
      currency: 'COP',
      customerEmail: data.userEmail,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation/${result.booking.id}`,
      integritySecret: wompiConfig.integritySecret,
      publicKey: wompiConfig.publicKey,
    })
    
    return NextResponse.json({
      bookingId: result.booking.id,
      checkoutUrl,
    })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
