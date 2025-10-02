import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ServiceForm } from '@/components/services/service-form'
import { notFound } from 'next/navigation'

export default async function EditServicePage({
  params,
}: {
  params: { id: string }
}) {
  const { tenant } = await requireAuth()
  
  // Get service
  const service = await prisma.service.findFirst({
    where: {
      id: params.id,
      tenantId: tenant.id,
    },
    include: {
      professionals: {
        include: {
          professional: true,
        },
      },
    },
  })
  
  if (!service) {
    notFound()
  }
  
  // Get all professionals for assignment
  const professionals = await prisma.professional.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { name: 'asc' },
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Servicio</h1>
        <p className="text-gray-600 mt-2">Actualiza la información del servicio</p>
      </div>
      
      <ServiceForm service={service} professionals={professionals} />
    </div>
  )
}
