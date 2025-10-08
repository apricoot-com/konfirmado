import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPaymentProviderForTenant } from '@/lib/payment-providers/factory'

/**
 * Universal Payment Webhook Handler
 * Handles webhooks from all payment providers (Wompi, PayU, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Get signature from headers (different per provider)
    const wompiSignature = req.headers.get('x-event-checksum')
    const payuSignature = req.headers.get('x-signature') || body.signature
    
    const signature = wompiSignature || payuSignature
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Determine provider from payload
    let provider: 'wompi' | 'payu' = 'wompi'
    let reference: string
    
    if (body.event && body.data?.transaction) {
      // Wompi format
      provider = 'wompi'
      reference = body.data.transaction.reference
    } else if (body.reference_sale) {
      // PayU format
      provider = 'payu'
      reference = body.reference_sale
    } else {
      return NextResponse.json({ error: 'Unknown provider format' }, { status: 400 })
    }

    // Find payment by reference
    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: {
        booking: {
          include: {
            tenant: true,
            service: true,
            professional: true,
          },
        },
      },
    })

    if (!payment) {
      console.error('Payment not found for reference:', reference)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Get payment provider for tenant
    const paymentProvider = await getPaymentProviderForTenant(payment.tenantId)

    // Verify webhook signature
    const isValid = paymentProvider.verifyWebhook(body, signature)

    if (!isValid) {
      console.error('Invalid webhook signature for reference:', reference)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse webhook payload
    const webhookData = paymentProvider.parseWebhook(body)

    // Update payment and booking status
    let paymentStatus = 'pending'
    let bookingStatus = 'pending'

    switch (webhookData.status) {
      case 'approved':
        paymentStatus = 'approved'
        bookingStatus = 'paid'
        break
      case 'declined':
      case 'error':
        paymentStatus = 'declined'
        bookingStatus = 'cancelled'
        break
      default:
        paymentStatus = 'pending'
        bookingStatus = 'pending'
    }

    // Update database
    await prisma.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          rawWebhook: body,
        },
      })

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      })
    })

    // If approved, trigger callback and calendar event
    if (webhookData.status === 'approved') {
      // TODO: Implement callback and calendar event creation
      // await sendMerchantCallback(payment.booking, payment)
      // await createBookingCalendarEvent(payment.booking)
      console.log('✓ Payment approved, booking confirmed')
    }

    // Log webhook received
    console.log('Payment webhook processed:', {
      provider,
      reference,
      status: paymentStatus,
      transactionId: webhookData.transactionId,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
