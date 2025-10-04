import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateCalendarEvent } from '@/lib/google-calendar'
import { sendEmail } from '@/lib/email'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import crypto from 'crypto'
import { z } from 'zod'

const rescheduleSchema = z.object({
  token: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    const validated = rescheduleSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { token, startTime, endTime } = validated.data
    
    // Find booking with token
    const booking = await prisma.booking.findFirst({
      where: {
        id,
        rescheduleToken: token,
      },
      include: {
        service: true,
        professional: true,
        tenant: true,
      },
    })
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid reschedule link' },
        { status: 404 }
      )
    }
    
    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot reschedule cancelled booking' },
        { status: 400 }
      )
    }
    
    // Check if new time is in the past
    if (new Date(startTime) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule to past date' },
        { status: 400 }
      )
    }
    
    // Store old times for webhook
    const oldStartTime = booking.startTime
    const oldEndTime = booking.endTime
    
    // Update Google Calendar event if exists
    if (booking.calendarEventId && booking.professional.refreshToken && booking.professional.calendarId) {
      try {
        await updateCalendarEvent(
          booking.professional.refreshToken,
          booking.professional.calendarId,
          booking.calendarEventId,
          {
            start: new Date(startTime),
            end: new Date(endTime),
            // Keep existing summary and description
          }
        )
        console.log(`✓ Calendar event updated: ${booking.calendarEventId}`)
      } catch (error) {
        console.error('Failed to update calendar event:', error)
        // Don't fail the reschedule if calendar update fails
      }
    }
    
    // Update booking times
    await prisma.booking.update({
      where: { id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    })
    
    console.log(`✓ Booking rescheduled: ${id}`)
    
    // Send reschedule confirmation email
    if (process.env.RESEND_API_KEY) {
      try {
        await sendRescheduleEmail({
          email: booking.userEmail,
          name: booking.userName,
          serviceName: booking.service.name,
          professionalName: booking.professional.name,
          oldDate: format(new Date(oldStartTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }),
          oldTime: format(new Date(oldStartTime), 'HH:mm', { locale: es }),
          newDate: format(new Date(startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es }),
          newTime: format(new Date(startTime), 'HH:mm', { locale: es }),
        })
        console.log(`✓ Reschedule email sent to ${booking.userEmail}`)
      } catch (error) {
        console.error('Failed to send reschedule email:', error)
        // Don't fail the reschedule if email fails
      }
    }
    
    // Send webhook notification to tenant
    await sendRescheduleWebhook(booking, oldStartTime, oldEndTime, startTime, endTime)
    
    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: {
        id: booking.id,
        serviceName: booking.service.name,
        startTime,
        endTime,
      },
    })
  } catch (error) {
    console.error('Reschedule booking error:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
      { status: 500 }
    )
  }
}

/**
 * Send reschedule confirmation email
 */
async function sendRescheduleEmail(params: {
  email: string
  name: string
  serviceName: string
  professionalName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}) {
  const { email, name, serviceName, professionalName, oldDate, oldTime, newDate, newTime } = params
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .old-time { text-decoration: line-through; color: #999; }
          .new-time { color: #0070f3; font-weight: bold; }
          .info-box { 
            background-color: #e0f2fe; 
            border-left: 4px solid #0070f3; 
            padding: 15px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Reserva Reagendada</h1>
          </div>
          <div class="content">
            <p>Hola ${name},</p>
            <p>Tu reserva ha sido reagendada exitosamente.</p>
            
            <div class="info-box">
              <strong>Detalles de la reserva:</strong>
            </div>
            
            <div class="detail">
              <span class="label">Servicio:</span> ${serviceName}
            </div>
            <div class="detail">
              <span class="label">Profesional:</span> ${professionalName}
            </div>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 8px;">
              <div class="detail">
                <span class="label">Fecha anterior:</span> 
                <span class="old-time">${oldDate} a las ${oldTime}</span>
              </div>
              <div class="detail">
                <span class="label">Nueva fecha:</span> 
                <span class="new-time">${newDate} a las ${newTime}</span>
              </div>
            </div>
            
            <p style="margin-top: 20px;"><strong>Próximos pasos:</strong></p>
            <ul>
              <li>Recibirás un recordatorio antes de tu cita</li>
              <li>Recuerda llegar 5 minutos antes</li>
            </ul>
          </div>
          <div class="footer">
            <p>Gracias por usar Konfirmado</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Reserva reagendada - ${serviceName}`,
    html,
  })
}

/**
 * Send reschedule webhook to tenant
 */
async function sendRescheduleWebhook(
  booking: any,
  oldStartTime: Date,
  oldEndTime: Date,
  newStartTime: string,
  newEndTime: string
) {
  try {
    const tenant = booking.tenant
    const callbackUrl = tenant.callbackUrl
    
    if (!callbackUrl || callbackUrl.includes('example.com')) {
      console.log('Skipping reschedule webhook - no valid URL configured')
      return
    }
    
    // Build webhook payload (consistent with other events)
    const payload = {
      event: 'booking.rescheduled',
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
      cita_anterior: {
        inicio: oldStartTime.toISOString(),
        fin: oldEndTime.toISOString(),
        timezone: 'America/Bogota',
      },
      cita_nueva: {
        inicio: newStartTime,
        fin: newEndTime,
        timezone: 'America/Bogota',
      },
      usuario: {
        nombre: booking.userName,
        email: booking.userEmail,
        telefono: booking.userPhone,
        acepto_terminos: booking.acceptedTerms,
      },
      reagendamiento: {
        fecha: new Date().toISOString(),
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
          console.log(`✓ Reschedule webhook sent to ${callbackUrl}`)
          
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
        console.error(`Reschedule webhook attempt ${attempts} failed:`, error.message)
        
        if (attempts >= maxAttempts) {
          // Log failed callback
          await prisma.callbackLog.create({
            data: {
              bookingId: booking.id,
              url: callbackUrl,
              payload: payload as any,
              statusCode: 0,
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
    console.error('Failed to send reschedule webhook:', error)
    // Don't fail the reschedule if webhook fails
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
