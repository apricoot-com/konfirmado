import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { BookingLinkForm } from '@/components/booking-links/booking-link-form'

export default async function NewBookingLinkPage() {
  const { tenant } = await requireAuth()
  
  // Get services and professionals for selection
  const [services, professionals] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.professional.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Link de Agendamiento</h1>
        <p className="text-gray-600 mt-2">Crea un nuevo link para recibir reservas</p>
      </div>
      
      <BookingLinkForm services={services} professionals={professionals} />
    </div>
  )
}
