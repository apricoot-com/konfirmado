import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ProfessionalForm } from '@/components/professionals/professional-form'

export default async function NewProfessionalPage() {
  const { tenant } = await requireAuth()
  
  // Get all services for selection
  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { name: 'asc' },
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Profesional</h1>
        <p className="text-gray-600 mt-2">Agrega un nuevo profesional a tu equipo</p>
      </div>
      
      <ProfessionalForm services={services} />
    </div>
  )
}
