import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || 'Konfirmado <noreply@konfirmado.com>', // Use your verified domain
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
  
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
}) {
  const { email, name, serviceName, professionalName, date, time, amount, confirmationMessage } = params
  
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
              <span class="label">Monto pagado:</span> $${(amount / 100).toLocaleString('es-CO')} COP
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
            <p><strong>Monto:</strong> $${(amount / 100).toLocaleString('es-CO')} COP</p>
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
