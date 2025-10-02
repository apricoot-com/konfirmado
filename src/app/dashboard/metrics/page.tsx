import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Calendar, DollarSign, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function MetricsPage() {
  const { tenant } = await requireAuth()
  
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))
  
  // Get current month bookings
  const [
    currentMonthBookings,
    lastMonthBookings,
    totalBookings,
    confirmedBookings,
    totalRevenue,
    services,
    professionals,
    links,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
      },
    }),
    prisma.booking.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    }),
    prisma.booking.count({
      where: { tenantId: tenant.id },
    }),
    prisma.booking.count({
      where: { tenantId: tenant.id, status: 'confirmed' },
    }),
    prisma.payment.aggregate({
      where: {
        tenantId: tenant.id,
        status: 'approved',
      },
      _sum: { amount: true },
    }),
    prisma.service.count({
      where: { tenantId: tenant.id, isActive: true },
    }),
    prisma.professional.count({
      where: { tenantId: tenant.id, isActive: true },
    }),
    prisma.bookingLink.count({
      where: { tenantId: tenant.id, isActive: true },
    }),
  ])
  
  // Calculate growth
  const bookingGrowth = lastMonthBookings > 0
    ? ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100
    : 0
  
  // Get top services
  const topServices = await prisma.booking.groupBy({
    by: ['serviceId'],
    where: { tenantId: tenant.id },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5,
  })
  
  const servicesWithNames = await Promise.all(
    topServices.map(async (item) => {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
      })
      return {
        name: service?.name || 'Unknown',
        count: item._count.id,
      }
    })
  )
  
  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    where: { tenantId: tenant.id },
    include: {
      service: true,
      professional: true,
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Métricas</h1>
        <p className="text-gray-600 mt-2">Resumen de tu negocio</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Reservas este mes</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{currentMonthBookings}</div>
          {bookingGrowth !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${bookingGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${bookingGrowth < 0 ? 'rotate-180' : ''}`} />
              <span>{Math.abs(bookingGrowth).toFixed(1)}% vs mes anterior</span>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total reservas</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalBookings}</div>
          <div className="text-sm text-gray-500 mt-2">
            {confirmedBookings} confirmadas
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Ingresos totales</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatPrice(totalRevenue._sum.amount || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Pagos aprobados
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Recursos activos</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <div className="text-2xl font-bold text-gray-900">{services}</div>
              <div className="text-xs text-gray-500">Servicios</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{professionals}</div>
              <div className="text-xs text-gray-500">Profesionales</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{links}</div>
              <div className="text-xs text-gray-500">Links</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios más populares</h2>
          {servicesWithNames.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos suficientes</p>
          ) : (
            <div className="space-y-3">
              {servicesWithNames.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{service.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{service.count} reservas</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h2>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay reservas recientes</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {booking.userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.service.name} • {format(booking.createdAt, 'dd MMM', { locale: es })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
