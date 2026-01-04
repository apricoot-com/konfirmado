import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ProfessionalForm } from '@/components/professionals/professional-form'
import { InviteButton } from '@/components/professionals/invite-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function EditProfessionalPage({
  params,
}: {
  params: { id: string }
}) {
  const { tenant } = await requireAuth()
  
  // Get professional
  const professional = await prisma.professional.findFirst({
    where: {
      id: params.id,
      tenantId: tenant.id,
    },
    include: {
      services: {
        include: {
          service: true,
        },
      },
    },
  })
  
  if (!professional) {
    notFound()
  }
  
  // Get all services for selection
  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { name: 'asc' },
  })
  
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Profesional</h1>
        <p className="text-gray-600 mt-2">Actualiza la información del profesional</p>
      </div>
      
      {/* Calendar Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Conexión de Calendario</CardTitle>
          <CardDescription>
            Estado de la conexión con Google Calendar del profesional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.bg}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">Estado: {status.label}</p>
              <p className="text-sm text-gray-600">
                Proveedor: {professional.calendarProvider}
              </p>
            </div>
          </div>
          
          {(professional.calendarStatus === 'pending' || professional.calendarStatus === 'error') && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                {professional.calendarStatus === 'pending'
                  ? 'Genera un link de conexión para que el profesional conecte su calendario de Google.'
                  : 'El profesional necesita reconectar su calendario. Genera un nuevo link de conexión.'}
              </p>
              <InviteButton professionalId={professional.id} status={professional.calendarStatus} />
            </div>
          )}
          
          {professional.calendarStatus === 'connected' && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-green-700">
                ✓ El calendario está conectado correctamente. El profesional puede recibir reservas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ProfessionalForm professional={professional} services={services} />
    </div>
  )
}
