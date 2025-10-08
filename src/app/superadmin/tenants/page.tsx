import { requireSuperAdmin } from '@/lib/superadmin'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; plan?: string }>
}

export default async function SuperAdminTenantsPage({ searchParams }: PageProps) {
  await requireSuperAdmin()
  
  const params = await searchParams
  const search = params.search || ''
  const statusFilter = params.status || ''
  const planFilter = params.plan || ''
  
  // Build where clause
  const where: any = {}
  
  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }
  
  if (statusFilter) {
    where.subscriptionStatus = statusFilter
  }
  
  if (planFilter) {
    where.subscriptionPlan = planFilter
  }
  
  // Get tenants with stats
  const tenants = await prisma.tenant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          bookings: true,
          services: true,
          professionals: true,
        },
      },
      users: {
        take: 1,
        select: { email: true },
      },
    },
  })
  
  // Get revenue per tenant
  const tenantsWithRevenue = await Promise.all(
    tenants.map(async (tenant) => {
      const revenue = await prisma.payment.aggregate({
        where: {
          tenantId: tenant.id,
          status: 'approved',
        },
        _sum: { amount: true },
      })
      
      return {
        ...tenant,
        revenue: revenue._sum.amount || 0,
      }
    })
  )
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Todos los Tenants</h1>
              <p className="text-sm text-gray-600 mt-1">{tenants.length} tenants encontrados</p>
            </div>
            <Link
              href="/superadmin/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ← Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <form className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  placeholder="Buscar por nombre..."
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              name="status"
              defaultValue={statusFilter}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="cancelled">Cancelado</option>
            </select>
            
            <select
              name="plan"
              defaultValue={planFilter}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los planes</option>
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Filtrar
            </button>
            
            {(search || statusFilter || planFilter) && (
              <Link
                href="/superadmin/tenants"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpiar
              </Link>
            )}
          </form>
        </div>
        
        {/* Tenants Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    Servicios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Profesionales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reservas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ingresos
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
                {tenantsWithRevenue.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-xs text-gray-500">{tenant.users[0]?.email}</div>
                      </div>
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
                      {tenant._count.services}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant._count.professionals}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tenant._count.bookings}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(tenant.revenue)}
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
          
          {tenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron tenants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
