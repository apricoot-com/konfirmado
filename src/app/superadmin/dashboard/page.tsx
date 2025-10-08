import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import { Building2, Users, CreditCard, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  await requireSuperAdmin()
  
  // Get overview stats
  const [
    totalTenants,
    activeSubs,
    trialTenants,
    totalBookings,
    totalRevenue,
    recentTenants,
  ] = await Promise.all([
    // Total tenants
    prisma.tenant.count(),
    
    // Active subscriptions (not trial, not cancelled)
    prisma.tenant.count({
      where: {
        subscriptionStatus: 'active',
        subscriptionPlan: { not: 'trial' },
      },
    }),
    
    // Trial tenants
    prisma.tenant.count({
      where: {
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    }),
    
    // Total bookings
    prisma.booking.count(),
    
    // Total revenue (sum of all approved payments)
    prisma.payment.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
    }),
    
    // Recent tenants
    prisma.tenant.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            bookings: true,
          },
        },
      },
    }),
  ])
  
  const revenue = totalRevenue._sum.amount || 0
  
  // Calculate MRR (Monthly Recurring Revenue)
  const subscriptions = await prisma.tenant.findMany({
    where: {
      subscriptionStatus: 'active',
      subscriptionPlan: { not: 'trial' },
    },
    select: { subscriptionPlan: true },
  })
  
  const PLAN_PRICES: Record<string, number> = {
    basic: 30000,
    pro: 50000,
    enterprise: 100000,
  }
  
  const mrr = subscriptions.reduce((sum, sub) => {
    return sum + (PLAN_PRICES[sub.subscriptionPlan] || 0)
  }, 0)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Superadmin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Vista general de la plataforma</p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tenants"
            value={totalTenants}
            icon={Building2}
            color="blue"
          />
          <StatCard
            title="Suscripciones Activas"
            value={activeSubs}
            icon={CreditCard}
            color="green"
          />
          <StatCard
            title="En Periodo de Prueba"
            value={trialTenants}
            icon={Users}
            color="yellow"
          />
          <StatCard
            title="MRR"
            value={formatPrice(mrr)}
            icon={TrendingUp}
            color="purple"
          />
        </div>
        
        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reservas Totales</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalBookings.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ingresos Totales</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatPrice(revenue)}</p>
          </div>
        </div>
        
        {/* Recent Tenants Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Tenants Recientes</h2>
              <Link
                href="/superadmin/tenants"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Ver todos →
              </Link>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuarios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reservas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Creado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.subscriptionPlan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        tenant.subscriptionPlan === 'basic' ? 'bg-blue-100 text-blue-800' :
                        tenant.subscriptionPlan === 'pro' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' :
                        tenant.subscriptionStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant._count.users}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/superadmin/tenants/${tenant.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
