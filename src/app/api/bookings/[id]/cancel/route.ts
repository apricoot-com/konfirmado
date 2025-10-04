import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import { sendCancellationEmail } from '@/lib/email'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import crypto from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 400 }
      )
    }
    
    // Find booking with token
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        cancellationToken: token,
      },
      include: {
        service: true,
        professional: true,
        tenant: true,
      },
    })
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid cancellation link' },
        { status: 404 }
      )
    }
    
    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }
    
    // Check if booking is in the past
    if (new Date(booking.startTime) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel past bookings' },
        { status: 400 }
      )
    }
    
    // Delete Google Calendar event if exists
    if (booking.calendarEventId && booking.professional.refreshToken && booking.professional.calendarId) {
      try {
        await deleteCalendarEvent(
          booking.professional.refreshToken,
          booking.professional.calendarId,
          booking.calendarEventId
        )
        console.log(`✓ Calendar event deleted: ${booking.calendarEventId}`)
      } catch (error) {
        console.error('Failed to delete calendar event:', error)
        // Don't fail the cancellation if calendar deletion fails
      }
    }
    
    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
      },
    })
    
    console.log(`✓ Booking cancelled: ${id}`)
    
    // Send cancellation confirmation email
    if (process.env.RESEND_API_KEY) {
      try {
        await sendCancellationEmail({
          email: booking.userEmail,
          name: booking.userName,
          serviceName: booking.service.name,
          professionalName: booking.professional.name,
          date: format(new Date(booking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }),
          time: format(new Date(booking.startTime), 'HH:mm', { locale: es }),
        })
        console.log(`✓ Cancellation email sent to ${booking.userEmail}`)
      } catch (error) {
        console.error('Failed to send cancellation email:', error)
        // Don't fail the cancellation if email fails
      }
    }
    
    // Send webhook notification to tenant
    await sendCancellationWebhook(booking)
    
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking.id,
        serviceName: booking.service.name,
        startTime: booking.startTime,
      },
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}

/**
 * Send cancellation webhook to tenant
 */
async function sendCancellationWebhook(booking: any) {
  try {
    const tenant = booking.tenant
    const callbackUrl = tenant.callbackUrl
    
    if (!callbackUrl || callbackUrl.includes('example.com')) {
      console.log('Skipping cancellation webhook - no valid URL configured')
      return
    }
    
    // Build webhook payload (consistent with booking creation)
    const payload = {
      event: 'booking.cancelled',
      tenant_id: tenant.id,
      booking_id: booking.id,
      servicio: {
        id: booking.service.id,
        nombre: booking.service.name,
        duracion_min: booking.service.durationMinutes,
        pago: booking.service.chargeType,
        precio: booking.service.price,
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
      cancelacion: {
        fecha: new Date().toISOString(),
        motivo: 'user_requested',
      },
      seguridad: {
        timestamp: new Date().toISOString(),
        firma_hmac: generateCallbackSignature(booking.id, tenant.id),
      },
    }
    
    // Send webhook with retry logic
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
          console.log(`✓ Cancellation webhook sent to ${callbackUrl}`)
          
          // Log successful callback
          await prisma.callbackLog.create({
            data: {
              bookingId: booking.id,
              url: callbackUrl,
              payload: payload as any,
              statusCode: response.status,
              success: true,
            },
          })
          
          return
        } else {
          throw new Error(`Webhook returned ${response.status}`)
        }
      } catch (error: any) {
        attempts++
        console.error(`Cancellation webhook attempt ${attempts} failed:`, error.message)
        
        if (attempts >= maxAttempts) {
          // Log failed callback
          await prisma.callbackLog.create({
            data: {
              bookingId: booking.id,
              url: callbackUrl,
              payload: payload as any,
              statusCode: 0,
              error: error.message,
              success: false,
            },
          })
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
        }
      }
    }
  } catch (error) {
    console.error('Failed to send cancellation webhook:', error)
    // Don't fail the cancellation if webhook fails
  }
}

/**
 * Generate HMAC signature for callback
 */
function generateCallbackSignature(bookingId: string, tenantId: string): string {
  const secret = process.env.CALLBACK_SECRET || 'default-secret-change-in-production'
  const data = `${bookingId}:${tenantId}`
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}
