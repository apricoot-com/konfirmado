import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Calendar, User, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profesional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{booking.userName}</div>
                          <div className="text-sm text-gray-500">{booking.userEmail}</div>
                          <div className="text-sm text-gray-500">{booking.userPhone}</div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{booking.service.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {booking.service.durationMinutes} min
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">{booking.professional.name}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {format(new Date(booking.startTime), 'dd MMM yyyy', { locale: es })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(booking.startTime), 'HH:mm', { locale: es })} - {format(new Date(booking.endTime), 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {booking.payment ? formatPrice(booking.payment.amount) : '-'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                        {booking.payment && (
                          <div className="text-xs text-gray-500 mt-1">
                            Ref: {booking.payment.reference}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
