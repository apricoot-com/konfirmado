import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { BookingLinkForm } from '@/components/booking-links/booking-link-form'
import { notFound } from 'next/navigation'

export default async function EditBookingLinkPage({
  params,
}: {
  params: { id: string }
}) {
  const { tenant } = await requireAuth()
  
  // Get booking link
  const link = await prisma.bookingLink.findFirst({
    where: {
      id: params.id,
      tenantId: tenant.id,
    },
  })
  
  if (!link) {
    notFound()
  }
  
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
        <h1 className="text-3xl font-bold text-gray-900">Editar Link de Agendamiento</h1>
        <p className="text-gray-600 mt-2">Actualiza la configuración del link</p>
      </div>
      
      <BookingLinkForm link={link} services={services} professionals={professionals} />
    </div>
  )
}
