import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Edit, Trash2, Briefcase } from 'lucide-react'

export default async function ServicesPage() {
  const { tenant } = await requireAuth()
  
  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
    include: {
      professionals: {
        include: {
          professional: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-600 mt-2">Gestiona los servicios que ofreces</p>
        </div>
        
        <Link
          href="/dashboard/services/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </Link>
      </div>
      
      {services.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay servicios</h3>
          <p className="text-gray-600 mb-6">Comienza creando tu primer servicio</p>
          <Link
            href="/dashboard/services/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Servicio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      service.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium text-gray-900">{service.durationMinutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-medium text-gray-900">{formatPrice(service.price)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tipo de cobro:</span>
                    <span className="font-medium text-gray-900">
                      {service.chargeType === 'partial' ? `Parcial (${service.partialPercentage}%)` : 'Total'}
                    </span>
                  </div>
                  
                  {service.chargeType === 'partial' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Anticipo:</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(Math.floor(service.price * ((service.partialPercentage || 25) / 100)))}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Profesionales:</span>
                    <span className="font-medium text-gray-900">
                      {service.professionals.length}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/services/${service.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                  
                  <button
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
