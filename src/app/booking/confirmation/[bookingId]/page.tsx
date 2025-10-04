import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CheckCircle, Clock, User, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatPrice } from '@/lib/utils'

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const resolvedParams = await params
  
  const booking = await prisma.booking.findUnique({
    where: { id: resolvedParams.bookingId },
    include: {
      service: true,
      professional: true,
      payment: true,
      tenant: true,
      link: true,
    },
  })
  
  if (!booking) {
    notFound()
  }
  
  const isPaid = booking.status === 'paid' || booking.status === 'confirmed'
  const isPending = booking.status === 'pending'
  
  // After 5 seconds, redirect to merchant return URL
  const redirectUrl = booking.tenant.returnUrl
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div
            className={`p-8 text-center ${
              isPaid ? 'bg-green-50' : isPending ? 'bg-yellow-50' : 'bg-red-50'
            }`}
          >
            {isPaid ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  ¡Reserva Confirmada!
                </h1>
                <p className="text-gray-600">
                  Tu pago ha sido procesado exitosamente
                </p>
              </>
            ) : isPending ? (
              <>
                <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Procesando Pago
                </h1>
                <p className="text-gray-600">
                  Estamos confirmando tu pago. Esto puede tomar unos momentos.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Pago No Completado
                </h1>
                <p className="text-gray-600">
                  Hubo un problema con tu pago. Por favor intenta nuevamente.
                </p>
              </>
            )}
          </div>
          
          {/* Booking Details */}
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detalles de tu reserva
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">{booking.service.name}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.startTime), 'HH:mm', { locale: es })} - {format(new Date(booking.endTime), 'HH:mm', { locale: es })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">{booking.professional.name}</div>
                    {booking.professional.description && (
                      <div className="text-sm text-gray-600">{booking.professional.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Duración</div>
                    <div className="text-sm text-gray-600">{booking.service.durationMinutes} minutos</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Info */}
            {booking.payment && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Información de pago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Referencia:</span>
                    <span className="font-mono text-gray-900">{booking.payment.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto pagado:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(booking.payment.amount)}
                    </span>
                  </div>
                  {booking.service.chargeType === 'partial' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo pendiente:</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(booking.service.price - booking.payment.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Contact Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tus datos</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="text-gray-900">{booking.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{booking.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-gray-900">{booking.userPhone}</span>
                </div>
              </div>
            </div>
            
            {/* Custom Confirmation Message */}
            {isPaid && booking.service.confirmationMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Mensaje importante</h3>
                <p className="text-sm text-green-800 whitespace-pre-wrap">
                  {booking.service.confirmationMessage}
                </p>
              </div>
            )}
            
            {/* Next Steps */}
            {isPaid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Próximos pasos</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Recibirás un correo de confirmación en {booking.userEmail}</li>
                  <li>• Te contactaremos si necesitamos información adicional</li>
                  <li>• Recuerda llegar 5 minutos antes de tu cita</li>
                </ul>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6">
              {isPaid ? (
                // Success - Return to merchant button
                <div className="flex flex-col gap-3">
                  {redirectUrl && !redirectUrl.includes('example.com') && (
                    <a
                      href={`${redirectUrl}?status=ok&ref=${booking.id}`}
                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Continuar
                    </a>
                  )}
                  <div className="flex gap-3">
                    <a
                      href={`/booking/reschedule/${booking.id}?token=${booking.rescheduleToken}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Reagendar
                    </a>
                    <a
                      href={`/booking/cancel/${booking.id}?token=${booking.cancellationToken}`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Cancelar
                    </a>
                  </div>
                </div>
              ) : !isPending && booking.payment ? (
                // Failed - Retry or return
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`/book/${booking.link.publicId}?retry=${booking.id}`}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Reintentar Pago
                  </a>
                  <a
                    href={redirectUrl || '/'}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Volver al inicio
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Redirect notice */}
          {isPaid && redirectUrl && !redirectUrl.includes('example.com') && (
            <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
              Serás redirigido en unos segundos...
              <meta httpEquiv="refresh" content={`5;url=${redirectUrl}?status=ok&ref=${booking.id}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
