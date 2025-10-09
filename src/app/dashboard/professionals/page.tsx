import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Edit, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react'
import { InviteButton } from '@/components/professionals/invite-button'

export default async function ProfessionalsPage() {
  const { tenant } = await requireAuth()
  
  const professionals = await prisma.professional.findMany({
    where: { tenantId: tenant.id },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profesionales</h1>
          <p className="text-gray-600 mt-2">Gestiona tu equipo de profesionales</p>
        </div>
        
        <Link
          href="/dashboard/professionals/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="inline sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Profesional</span>
        </Link>
      </div>
      
      {professionals.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay profesionales</h3>
          <p className="text-gray-600 mb-6">Comienza agregando tu primer profesional</p>
          <Link
            href="/dashboard/professionals/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Profesional
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((professional) => {
            const statusConfig = {
              pending: {
                icon: AlertCircle,
                color: 'text-yellow-600',
                bg: 'bg-yellow-100',
                label: 'Pendiente',
              },
              connected: {
                icon: CheckCircle,
                color: 'text-green-600',
                bg: 'bg-green-100',
                label: 'Conectado',
              },
              error: {
                icon: XCircle,
                color: 'text-red-600',
                bg: 'bg-red-100',
                label: 'Error',
              },
            }
            
            const status = statusConfig[professional.calendarStatus as keyof typeof statusConfig]
            const StatusIcon = status.icon
            
            return (
              <div
                key={professional.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {professional.photoUrl ? (
                      <img
                        src={professional.photoUrl}
                        alt={professional.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-600">
                          {professional.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{professional.name}</h3>
                      <div className={`flex items-center gap-1 mt-1 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{status.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  {professional.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {professional.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Servicios:</span>
                      <span className="font-medium text-gray-900">
                        {professional.services.length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Calendario:</span>
                      <span className="font-medium text-gray-900">
                        {professional.calendarProvider}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {(professional.calendarStatus === 'pending' || professional.calendarStatus === 'error') && (
                      <InviteButton professionalId={professional.id} status={professional.calendarStatus} />
                    )}
                    
                    <Link
                      href={`/dashboard/professionals/${professional.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
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
