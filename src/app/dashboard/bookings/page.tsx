import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Calendar, User, Clock, DollarSign, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExportBookingsButton } from '@/components/bookings/export-bookings-button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, CardAction } from '@/components/ui/card'

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
        
        {bookings.length > 0 && (
          <ExportBookingsButton tenantId={tenant.id} />
        )}
      </div>

      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Pendientes</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Confirmadas</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'paid').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Canceladas</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'cancelled').length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">Las reservas aparecerán aquí cuando los clientes completen el proceso de agendamiento</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status as keyof typeof statusConfig]
            const StatusIcon = status.icon
            
            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        {format(new Date(booking.startTime), 'dd MMM yyyy', { locale: es })}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(booking.startTime), 'HH:mm', { locale: es })} - {format(new Date(booking.endTime), 'HH:mm', { locale: es })}
                        </span>
                      </CardDescription>
                    </div>
                    <CardAction>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </CardAction>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Service and Professional */}
                  <div className="space-y-3 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{booking.service.name}</div>
                        <div className="text-xs text-gray-500">
                          {booking.service.durationMinutes} min
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{booking.professional.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Client Info */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Cliente</div>
                    <div className="text-sm font-medium text-gray-900">{booking.userName}</div>
                    <div className="text-xs text-gray-600">{booking.userEmail}</div>
                    {booking.userPhone && (
                      <div className="text-xs text-gray-600">{booking.userPhone}</div>
                    )}
                  </div>
                  
                  {/* Payment Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Pago:</span>
                      <span className="font-medium text-gray-900">
                        {booking.payment ? formatPrice(booking.payment.amount) : 'Pendiente'}
                      </span>
                    </div>
                    {booking.payment && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Referencia:</span>
                        <span className="text-gray-600 font-mono">{booking.payment.reference}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t">
                  <Link
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalles
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
