import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyWebhookSignature, getWompiConfig } from '@/lib/wompi'
import { logAudit } from '@/lib/audit'
import { createCalendarEvent } from '@/lib/google-calendar'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const checksum = req.headers.get('x-event-checksum')
    
    if (!checksum) {
      return NextResponse.json({ error: 'Missing checksum' }, { status: 400 })
    }
    // only in dev env
    if (process.env.NODE_ENV === 'development') {
      console.log('Wompi webhook received:', body)
    }
    // Extract event data
    const { event, data, sent_at } = body
    const timestamp = Math.floor(new Date(sent_at).getTime() / 1000)
    
    if (event !== 'transaction.updated') {
      // Acknowledge other events but don't process
    }
    
    const transaction = data.transaction
    const reference = transaction.reference
    
    // Check if this is a subscription payment (reference starts with SUB-)
    if (reference.startsWith('SUB-')) {
      // Handle subscription payment
      const subscription = await prisma.subscription.findFirst({
        where: {
          paymentInfo: {
            path: ['reference'],
            equals: reference,
          },
        },
        include: { tenant: true },
      })
      
      if (!subscription) {
        console.log('Subscription not found for reference:', reference)
        return NextResponse.json({ received: true }) // Acknowledge anyway
      }
      
      // Update subscription payment status
      const currentPaymentInfo = subscription.paymentInfo as any
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentInfo: {
            ...currentPaymentInfo,
            status: transaction.status,
          },
          status: transaction.status === 'APPROVED' ? 'active' : 'failed',
        },
      })
      
      // If approved, update tenant subscription
      if (transaction.status === 'APPROVED') {
        await prisma.tenant.update({
          where: { id: subscription.tenantId },
          data: {
            subscriptionPlan: subscription.plan,
            subscriptionStatus: 'active',
            subscriptionEndsAt: subscription.currentPeriodEnd,
            trialEndsAt: null, // Clear trial
          },
        })
        
        console.log(`✓ Subscription activated for tenant ${subscription.tenantId}: ${subscription.plan}`)
      }
      
      return NextResponse.json({ received: true })
    }
    
    // Handle regular booking payment
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
    
    // Get Wompi config to verify signature
    const wompiConfig = getWompiConfig(payment.booking.tenant)
    
    if (!wompiConfig) {
      console.error('Wompi config not found for tenant:', payment.tenantId)
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 })
    }
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      timestamp,
      checksum,
      wompiConfig.eventsSecret
    )
    
    if (!isValid) {
      console.error('Invalid webhook signature for reference:', reference)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Update payment and booking status based on transaction status
    const transactionStatus = transaction.status
    let paymentStatus = 'pending'
    let bookingStatus = 'pending'
    
    switch (transactionStatus) {
      case 'APPROVED':
        paymentStatus = 'approved'
        bookingStatus = 'paid'
        break
      case 'DECLINED':
      case 'VOIDED':
        paymentStatus = 'declined'
        bookingStatus = 'cancelled'
        break
      case 'ERROR':
        paymentStatus = 'error'
        bookingStatus = 'cancelled'
        break
      default:
        paymentStatus = 'pending'
        bookingStatus = 'pending'
    }
    
    // Update payment and booking
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
    
    // If approved, trigger callback to merchant and create calendar event
    if (transactionStatus === 'APPROVED') {
      await sendMerchantCallback(payment.booking, payment)
      await createBookingCalendarEvent(payment.booking)
    }
    
    // Audit log
    await logAudit({
      tenantId: payment.tenantId,
      userId: undefined,
      action: 'booking_created',
      entityType: 'payment',
      entityId: payment.id,
      metadata: {
        reference,
        status: paymentStatus,
        transactionId: transaction.id,
        webhook: 'wompi',
      },
      req,
    })
    
    // Send confirmation email if payment was approved
    if (paymentStatus === 'approved' && bookingStatus === 'paid') {
      await sendBookingConfirmationEmail({
        email: payment.booking.userEmail,
        name: payment.booking.userName,
        serviceName: payment.booking.service.name,
        professionalName: payment.booking.professional.name,
        date: format(new Date(payment.booking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }),
        time: format(new Date(payment.booking.startTime), 'HH:mm', { locale: es }),
        amount: payment.amount,
        confirmationMessage: payment.booking.service.confirmationMessage,
      }).catch(error => {
        console.error('Failed to send confirmation email:', error)
        // Don't fail the webhook if email fails
      })
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Wompi webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Send callback to merchant with booking details
 */
async function sendMerchantCallback(booking: any, payment: any) {
  try {
    const tenant = booking.tenant
    const callbackUrl = tenant.callbackUrl
    
    if (!callbackUrl || callbackUrl.includes('example.com')) {
      console.log('Skipping callback - no valid URL configured')
      return
    }
    
    // Calculate charge amount
    const chargeAmount = booking.service.chargeType === 'partial'
      ? Math.floor(booking.service.price * (booking.service.partialPercentage / 100))
      : booking.service.price
    
    // Build callback payload
    const payload = {
      tenant_id: tenant.id,
      booking_id: booking.id,
      servicio: {
        id: booking.service.id,
        nombre: booking.service.name,
        duracion_min: booking.service.durationMinutes,
        pago: booking.service.chargeType,
        precio: booking.service.price,
        monto_cobrado: chargeAmount,
      },
      profesional: {
        id: booking.professional.id,
        nombre: booking.professional.name,
      },
      cita: {
        inicio: booking.startTime.toISOString(),
        fin: booking.endTime.toISOString(),
        timezone: 'America/Bogota',
      },
      usuario: {
        nombre: booking.userName,
        email: booking.userEmail,
        telefono: booking.userPhone,
        acepto_terminos: booking.acceptedTerms,
      },
      pago: {
        proveedor: 'wompi',
        estado: 'aprobado',
        referencia: payment.reference,
        monto: payment.amount,
        moneda: payment.currency,
      },
      seguridad: {
        timestamp: new Date().toISOString(),
        firma_hmac: generateCallbackSignature(booking.id, tenant.id),
      },
    }
    
    // Send callback with retries
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Konfirmado-Signature': payload.seguridad.firma_hmac,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000), // 10s timeout
        })
        
        if (response.ok) {
          // Update booking to confirmed
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'confirmed' },
          })
          
          console.log('Callback sent successfully:', booking.id)
          return
        }
        
        if (response.status >= 500) {
          // Retry on 5xx errors
          attempts++
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts)) // Backoff
            continue
          }
        }
        
        console.error('Callback failed:', response.status, await response.text())
        return
      } catch (error) {
        attempts++
        console.error(`Callback attempt ${attempts} failed:`, error)
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }
    
    console.error('Callback failed after all retries:', booking.id)
  } catch (error) {
    console.error('Send merchant callback error:', error)
  }
}

/**
 * Generate HMAC signature for callback
 */
function generateCallbackSignature(bookingId: string, tenantId: string): string {
  const secret = process.env.CALLBACK_SECRET || 'default-secret-change-me'
  const data = `${bookingId}:${tenantId}`
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

/**
 * Create calendar event for confirmed booking
 */
async function createBookingCalendarEvent(booking: any) {
  try {
    // Check if professional has calendar connected
    if (!booking.professional.refreshToken || !booking.professional.calendarId) {
      console.log('Professional calendar not connected, skipping event creation')
      console.log('Professional data:', {
        id: booking.professional.id,
        name: booking.professional.name,
        hasRefreshToken: !!booking.professional.refreshToken,
        hasCalendarId: !!booking.professional.calendarId,
        calendarStatus: booking.professional.calendarStatus,
      })
      return
    }
    
    console.log(`Creating calendar event for professional ${booking.professional.name}`)
    
    // Build event description
    const description = `
Servicio: ${booking.service.name}
Cliente: ${booking.userName}
Email: ${booking.userEmail}
Teléfono: ${booking.userPhone}

${booking.service.description || ''}
    `.trim()
    
    // Create calendar event
    const event = await createCalendarEvent(
      booking.professional.refreshToken,
      booking.professional.calendarId,
      {
        summary: `${booking.service.name} - ${booking.userName}`,
        description,
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        attendees: [
          {
            email: booking.userEmail,
            displayName: booking.userName,
          },
        ],
      }
    )
    
    // Save event ID to booking
    if (event.id) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { calendarEventId: event.id },
      })
      
      console.log(`✓ Calendar event created: ${event.id} for booking ${booking.id}`)
    }
  } catch (error) {
    console.error('Failed to create calendar event:', error)
    // Don't fail the webhook if calendar creation fails
  }
}
