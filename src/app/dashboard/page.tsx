import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { Calendar, Users, Briefcase, Link2, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const { tenant } = await requireAuth()
  
  // Get stats
  const [bookingsCount, servicesCount, professionalsCount, linksCount] = await Promise.all([
    prisma.booking.count({
      where: { tenantId: tenant.id },
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
  
  const stats = [
    {
      title: 'Reservas Totales',
      value: bookingsCount,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Servicios Activos',
      value: servicesCount,
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      title: 'Profesionales',
      value: professionalsCount,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Links Activos',
      value: linksCount,
      icon: Link2,
      color: 'bg-orange-500',
    },
  ]
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido a {tenant.name}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Primeros Pasos</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Configura tu marca</h3>
              <p className="text-sm text-gray-600">Personaliza logo, colores y URLs en Configuración</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Crea servicios</h3>
              <p className="text-sm text-gray-600">Define los servicios que ofreces con precios y duración</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Agrega profesionales</h3>
              <p className="text-sm text-gray-600">Invita a tus profesionales a conectar sus calendarios</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              4
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Genera links de agendamiento</h3>
              <p className="text-sm text-gray-600">Crea links únicos para compartir con tus clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
