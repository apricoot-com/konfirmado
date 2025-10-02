import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { ServiceForm } from '@/components/services/service-form'

export default async function NewServicePage() {
  const { tenant } = await requireAuth()
  
  // Get all professionals for assignment
  const professionals = await prisma.professional.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { name: 'asc' },
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Servicio</h1>
        <p className="text-gray-600 mt-2">Crea un nuevo servicio para ofrecer a tus clientes</p>
      </div>
      
      <ServiceForm professionals={professionals} />
    </div>
  )
}
