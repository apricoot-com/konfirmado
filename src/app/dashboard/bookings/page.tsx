import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Calendar, User, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExportBookingsButton } from '@/components/bookings/export-bookings-button'

export default async function BookingsPage() {
  const { tenant } = await requireAuth()
  
  const bookings = await prisma.booking.findMany({
    where: { tenantId: tenant.id },
    include: {
      service: true,
      professional: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const statusConfig = {
    pending: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      label: 'Pendiente',
    },
    paid: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Confirmada',
    },
    cancelled: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: 'Cancelada',
    },
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600 mt-2">Gestiona todas las reservas de tus clientes</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold text-gray-900">{bookings.length}</span>
          </div>
          
          {bookings.length > 0 && (
            <ExportBookingsButton tenantId={tenant.id} />
          )}
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Pendientes</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'pending').length}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Confirmadas</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'paid').length}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Canceladas</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {bookings.filter(b => b.status === 'cancelled').length}
            </div>
          </div>
        </div>
      )}
      
      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">Las reservas aparecerán aquí cuando los clientes completen el proceso de agendamiento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status as keyof typeof statusConfig]
            const StatusIcon = status.icon
            
            return (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* Date & Time */}
                  <div className="col-span-2">
                    <div className="font-medium text-gray-900">
                      {format(new Date(booking.startTime), 'dd MMM', { locale: es })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(booking.startTime), 'HH:mm', { locale: es })}
                    </div>
                  </div>

                  {/* Service & Professional */}
                  <div className="col-span-3">
                    <div className="font-medium text-gray-900">{booking.service.name}</div>
                    <div className="text-sm text-gray-600">{booking.professional.name}</div>
                  </div>

                  {/* Client */}
                  <div className="col-span-3">
                    <div className="text-sm text-gray-900">{booking.userName}</div>
                    <div className="text-xs text-gray-600">{booking.userEmail}</div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <div className="font-medium text-gray-900">
                      {booking.payment ? formatPrice(booking.payment.amount) : '-'}
                    </div>
                    {booking.payment && (
                      <div className="text-xs text-gray-500">
                        {booking.payment.reference}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex justify-end">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  {/* Header: Status and Date */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {format(new Date(booking.startTime), 'dd MMM yyyy', { locale: es })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(booking.startTime), 'HH:mm', { locale: es })} - {format(new Date(booking.endTime), 'HH:mm', { locale: es })}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>

                  {/* Service and Professional */}
                  <div className="space-y-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-900">{booking.service.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({booking.service.durationMinutes} min)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-900">{booking.professional.name}</span>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-700">Cliente:</div>
                    <div className="text-sm text-gray-900">{booking.userName}</div>
                    <div className="text-sm text-gray-600">{booking.userEmail}</div>
                    <div className="text-sm text-gray-600">{booking.userPhone}</div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {booking.payment ? formatPrice(booking.payment.amount) : '-'}
                      </span>
                    </div>
                    {booking.payment && (
                      <div className="text-xs text-gray-500">
                        Ref: {booking.payment.reference}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
