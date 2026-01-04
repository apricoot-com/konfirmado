import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development'

// Create Mailhog transporter for development
// Mailhog runs on localhost:1025 (SMTP) and localhost:8025 (Web UI)
// Since the app runs outside Docker Compose, we use localhost
const mailhogTransporter = isDev ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  ignoreTLS: true,
  secure: false, // Mailhog doesn't use TLS
}) : null

// Lazy-load Resend only when needed (production with API key)
let resendInstance: Resend | null = null
function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured. Cannot send email in production.')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend (production) or Mailhog (development)
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const fromAddress = from || 'Konfirmado <noreply@konfirmado.com>'
  
  try {
    // Always use Mailhog in development (even if RESEND_API_KEY is set)
    if (isDev && mailhogTransporter) {
      console.log(`📧 [DEV] Sending email to ${to} via Mailhog`)
      const info = await mailhogTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      })
      console.log(`✓ Email sent to Mailhog. View at: http://localhost:8025`)
      return { id: info.messageId }
    }
    
    // Use Resend in production (only if API key is configured)
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Email send error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #0070f3; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Restablecer tu contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Konfirmado.</p>
          <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <a href="${resetUrl}" class="button">Restablecer contraseña</a>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #0070f3;">${resetUrl}</p>
          <p><strong>Este enlace expirará en 1 hora.</strong></p>
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
          <div class="footer">
            <p>Saludos,<br>El equipo de Konfirmado</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Restablecer tu contraseña - Konfirmado',
    html,
  })
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmationEmail(params: {
  email: string
  name: string
  serviceName: string
  professionalName: string
  date: string
  time: string
  amount: number
  confirmationMessage?: string
  bookingId?: string
  cancellationToken?: string
  rescheduleToken?: string
}) {
  const { email, name, serviceName, professionalName, date, time, amount, confirmationMessage, bookingId, cancellationToken, rescheduleToken } = params
  
  // Generate cancel and reschedule links if tokens provided
  const cancelUrl = bookingId && cancellationToken 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel/${bookingId}?token=${cancellationToken}`
    : null
  
  const rescheduleUrl = bookingId && rescheduleToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/reschedule/${bookingId}?token=${rescheduleToken}`
    : null
  
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
          .message-box { 
            background-color: #e8f5e9; 
            border-left: 4px solid #4caf50; 
            padding: 15px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✓ Reserva Confirmada</h1>
          </div>
          <div class="content">
            <p>Hola ${name},</p>
            <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>
            
            <div class="detail">
              <span class="label">Servicio:</span> ${serviceName}
            </div>
            <div class="detail">
              <span class="label">Profesional:</span> ${professionalName}
            </div>
            <div class="detail">
              <span class="label">Fecha:</span> ${date}
            </div>
            <div class="detail">
              <span class="label">Hora:</span> ${time}
            </div>
            <div class="detail">
              <span class="label">Monto pagado:</span> $${amount.toLocaleString('es-CO')} COP
            </div>
            
            ${confirmationMessage ? `
              <div class="message-box">
                <strong>Mensaje importante:</strong>
                <p style="margin: 10px 0 0 0;">${confirmationMessage.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
            
            <p style="margin-top: 20px;"><strong>Próximos pasos:</strong></p>
            <ul>
              <li>Recibirás un recordatorio antes de tu cita</li>
              <li>Te contactaremos si necesitamos información adicional</li>
              <li>Recuerda llegar 5 minutos antes</li>
            </ul>
            
            ${rescheduleUrl || cancelUrl ? `
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 15px;">
                  ¿Necesitas hacer cambios?
                </p>
                <div style="text-align: center;">
                  ${rescheduleUrl ? `
                    <a href="${rescheduleUrl}" 
                       style="display: inline-block; margin: 0 10px 10px 10px; padding: 10px 20px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; font-size: 14px;">
                      🔄 Reagendar cita
                    </a>
                  ` : ''}
                  ${cancelUrl ? `
                    <a href="${cancelUrl}" 
                       style="display: inline-block; margin: 0 10px 10px 10px; padding: 10px 20px; background-color: #fff; color: #dc2626; text-decoration: none; border: 1px solid #dc2626; border-radius: 5px; font-size: 14px;">
                      ✗ Cancelar reserva
                    </a>
                  ` : ''}
                </div>
                ${cancelUrl ? `
                  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 10px;">
                    No se realizarán reembolsos
                  </p>
                ` : ''}
              </div>
            ` : ''}
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
    subject: `Reserva confirmada - ${serviceName}`,
    html,
  })
}

/**
 * Send calendar connection invitation to professional
 */
export async function sendCalendarInvitationEmail(params: {
  email: string
  name: string
  connectionUrl: string
  expiresAt: Date
}) {
  const { email, name, connectionUrl, expiresAt } = params
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #0070f3; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .warning { 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Conecta tu calendario</h2>
          <p>Hola ${name},</p>
          <p>Has sido invitado a conectar tu Google Calendar con Konfirmado para gestionar tus citas.</p>
          <p>Haz clic en el siguiente botón para conectar tu calendario:</p>
          <a href="${connectionUrl}" class="button">Conectar Google Calendar</a>
          <div class="warning">
            <strong>⏰ Este enlace expirará el ${expiresAt.toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</strong>
          </div>
          <p><strong>¿Por qué conectar tu calendario?</strong></p>
          <ul>
            <li>Sincronización automática de disponibilidad</li>
            <li>Evita reservas en horarios ocupados</li>
            <li>Gestión centralizada de tus citas</li>
          </ul>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Saludos,<br>El equipo de Konfirmado</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Conecta tu calendario - Konfirmado',
    html,
  })
}

/**
 * Send booking cancellation confirmation email
 */
export async function sendCancellationEmail(params: {
  email: string
  name: string
  serviceName: string
  professionalName: string
  date: string
  time: string
}) {
  const { email, name, serviceName, professionalName, date, time } = params
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .detail { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .info-box { 
            background-color: #fef2f2; 
            border-left: 4px solid #dc2626; 
            padding: 15px; 
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✗ Reserva Cancelada</h1>
          </div>
          <div class="content">
            <p>Hola ${name},</p>
            <p>Tu reserva ha sido cancelada exitosamente.</p>
            
            <div class="info-box">
              <strong>Detalles de la reserva cancelada:</strong>
            </div>
            
            <div class="detail">
              <span class="label">Servicio:</span> ${serviceName}
            </div>
            <div class="detail">
              <span class="label">Profesional:</span> ${professionalName}
            </div>
            <div class="detail">
              <span class="label">Fecha:</span> ${date}
            </div>
            <div class="detail">
              <span class="label">Hora:</span> ${time}
            </div>
            
            <p style="margin-top: 20px;">Si cancelaste por error o necesitas reagendar, por favor contáctanos.</p>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              <strong>Nota:</strong> No se realizarán reembolsos según nuestra política de cancelación.
            </p>
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
    subject: `Reserva cancelada - ${serviceName}`,
    html,
  })
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(params: {
  email: string
  name: string
  serviceName: string
  amount: number
  dueDate: Date
}) {
  const { email, name, serviceName, amount, dueDate } = params
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Recordatorio de pago</h2>
          <p>Hola ${name},</p>
          <p>Te recordamos que tienes un pago pendiente:</p>
          <div class="alert">
            <p><strong>Servicio:</strong> ${serviceName}</p>
            <p><strong>Monto:</strong> $${amount.toLocaleString('es-CO')} COP</p>
            <p><strong>Fecha límite:</strong> ${dueDate.toLocaleDateString('es-CO')}</p>
          </div>
          <p>Por favor, completa tu pago antes de la fecha límite para mantener tu reserva.</p>
          <p>Saludos,<br>El equipo de Konfirmado</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Recordatorio de pago - Konfirmado',
    html,
  })
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`
  
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
          .button { 
            display: inline-block;
            padding: 12px 24px;
            background-color: #0070f3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verifica tu correo electrónico</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Gracias por registrarte en Konfirmado. Para completar tu registro, por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verificar correo electrónico</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #0070f3;">${verifyUrl}</p>
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
            <p>Si no creaste una cuenta en Konfirmado, puedes ignorar este correo.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konfirmado. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: 'Verifica tu correo electrónico - Konfirmado',
    html,
  })
}

/**
 * Send subscription renewal success email
 */
export async function sendSubscriptionRenewalEmail({
  email,
  tenantName,
  plan,
  amount,
  nextBillingDate,
}: {
  email: string
  tenantName: string
  plan: string
  amount: number
  nextBillingDate: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Suscripción Renovada</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Tu suscripción de <strong>${tenantName}</strong> ha sido renovada exitosamente.</p>
            
            <div class="details">
              <div class="detail-row">
                <span><strong>Plan:</strong></span>
                <span>${plan}</span>
              </div>
              <div class="detail-row">
                <span><strong>Monto cobrado:</strong></span>
                <span>$${amount.toLocaleString('es-CO')} COP</span>
              </div>
              <div class="detail-row">
                <span><strong>Próxima facturación:</strong></span>
                <span>${nextBillingDate}</span>
              </div>
            </div>
            
            <p>Tu servicio continuará sin interrupciones.</p>
            <p>Gracias por confiar en Konfirmado.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konfirmado. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Suscripción renovada - ${tenantName}`,
    html,
  })
}

/**
 * Send subscription payment failed email
 */
export async function sendSubscriptionFailedEmail({
  email,
  tenantName,
  plan,
  amount,
  reason,
}: {
  email: string
  tenantName: string
  plan: string
  amount: number
  reason: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Problema con tu Suscripción</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>No pudimos procesar el pago de tu suscripción de <strong>${tenantName}</strong>.</p>
            
            <div class="warning">
              <strong>⚠️ Acción requerida:</strong> Tu suscripción ha sido cancelada. Para continuar usando el servicio, actualiza tu método de pago.
            </div>
            
            <div class="details">
              <p><strong>Plan:</strong> ${plan}</p>
              <p><strong>Monto:</strong> $${amount.toLocaleString('es-CO')} COP</p>
              <p><strong>Razón:</strong> ${reason}</p>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard/subscription" class="button">
                Actualizar Método de Pago
              </a>
            </p>
            
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konfirmado. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `⚠️ Problema con tu suscripción - ${tenantName}`,
    html,
  })
}
