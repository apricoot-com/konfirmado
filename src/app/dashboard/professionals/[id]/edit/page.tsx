import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ProfessionalForm } from '@/components/professionals/professional-form'
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
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Editar Profesional</h1>
        <p className="text-gray-600 mt-2">Actualiza la información del profesional</p>
      </div>
      
      <ProfessionalForm professional={professional} services={services} />
    </div>
  )
}
