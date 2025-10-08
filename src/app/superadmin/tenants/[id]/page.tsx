import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TenantDetailPage({ params }: PageProps) {
  await requireSuperAdmin()
  
  const { id } = await params
  
  // Get tenant with all related data
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: true,
      services: {
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      },
      professionals: {
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      },
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          professional: true,
          payment: true,
        },
      },
      _count: {
        select: {
          users: true,
          services: true,
          professionals: true,
          bookings: true,
        },
      },
    },
  })
  
  if (!tenant) {
    notFound()
  }
  
  // Get revenue
  const revenue = await prisma.payment.aggregate({
    where: {
      tenantId: id,
      status: 'approved',
    },
    _sum: { amount: true },
  })
  
  const totalRevenue = revenue._sum.amount || 0
  
  // Parse payment config
  const paymentConfig = tenant.paymentConfig as any
  const hasWompiConfigured = !!(paymentConfig?.publicKey && paymentConfig?.privateKey)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-600 mt-1">ID: {tenant.id}</p>
            </div>
            <Link
              href="/superadmin/tenants"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Volver a Tenants
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Usuarios"
            value={tenant._count.users}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Servicios"
            value={tenant._count.services}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title="Profesionales"
            value={tenant._count.professionals}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Reservas"
            value={tenant._count.bookings}
            icon={Calendar}
            color="yellow"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Información de Suscripción
                </h2>
                <Link
                  href={`/superadmin/tenants/${tenant.id}/change-plan`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Cambiar plan →
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    tenant.subscriptionPlan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    tenant.subscriptionPlan === 'basic' ? 'bg-blue-100 text-blue-800' :
                    tenant.subscriptionPlan === 'pro' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tenant.subscriptionPlan}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                    tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                    tenant.subscriptionStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tenant.subscriptionStatus}
                  </span>
                </div>
                
                {tenant.trialEndsAt && (
                  <div>
                    <p className="text-sm text-gray-600">Trial termina</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {format(new Date(tenant.trialEndsAt), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
                
                {tenant.subscriptionEndsAt && (
                  <div>
                    <p className="text-sm text-gray-600">Próxima facturación</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {format(new Date(tenant.subscriptionEndsAt), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Ingresos totales</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatPrice(totalRevenue)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {format(new Date(tenant.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Payment Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuración de Pagos (Wompi)
                </h2>
                <Link
                  href={`/superadmin/tenants/${tenant.id}/payment-config`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Editar →
                </Link>
              </div>
              
              {hasWompiConfigured ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Wompi configurado</p>
                      <p className="text-sm text-green-600 mt-1">El tenant puede recibir pagos</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-xs text-gray-600">Public Key</p>
                      <p className="text-sm font-mono text-gray-900 mt-1 truncate">
                        {paymentConfig.publicKey?.substring(0, 20)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Private Key</p>
                      <p className="text-sm font-mono text-gray-900 mt-1">
                        ••••••••••••••••
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Events Secret</p>
                      <p className="text-sm font-mono text-gray-900 mt-1">
                        {paymentConfig.eventsSecret ? '••••••••••••••••' : 'No configurado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Integrity Secret</p>
                      <p className="text-sm font-mono text-gray-900 mt-1">
                        {paymentConfig.integritySecret ? '••••••••••••••••' : 'No configurado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Wompi no configurado</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      El tenant no puede recibir pagos. Configura las credenciales de Wompi.
                    </p>
                    <Link
                      href={`/superadmin/tenants/${tenant.id}/payment-config`}
                      className="text-sm text-yellow-700 hover:text-yellow-800 underline mt-2 inline-block"
                    >
                      Configurar ahora
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Recent Bookings */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Reservas Recientes</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Servicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Profesional
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenant.bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.service.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.professional.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.userName}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {booking.payment ? formatPrice(booking.payment.amount) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {tenant.bookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No hay reservas</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Users & Quick Actions */}
          <div className="space-y-6">
            {/* Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Usuarios</h2>
              
              <div className="space-y-3">
                {tenant.users.map((user) => (
                  <div key={user.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      {user.emailVerified ? (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Verificado
                        </p>
                      ) : (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          Pendiente verificación
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Services & Professionals Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Servicios ({tenant.services.length})</p>
                  <div className="space-y-2">
                    {tenant.services.slice(0, 5).map((service) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 truncate">{service.name}</span>
                        <span className="text-gray-500 text-xs">
                          {service._count.bookings} reservas
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Profesionales ({tenant.professionals.length})</p>
                  <div className="space-y-2">
                    {tenant.professionals.slice(0, 5).map((prof) => (
                      <div key={prof.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 truncate">{prof.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          prof.calendarStatus === 'connected' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {prof.calendarStatus === 'connected' ? 'Conectado' : 'Sin conectar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'yellow' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
