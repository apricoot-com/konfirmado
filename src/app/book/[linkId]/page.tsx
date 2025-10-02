import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { BookingWizard } from '@/components/booking/booking-wizard'

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>
  searchParams: Promise<{ service?: string; professional?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  // Get booking link
  const link = await prisma.bookingLink.findUnique({
    where: { publicId: resolvedParams.linkId },
    include: {
      tenant: true,
    },
  })

  if (!link) {
    notFound()
  }

  // Check if link is active
  if (!link.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Inactivo</h1>
          <p className="text-gray-600">
            Este link de agendamiento ya no está disponible.
          </p>
        </div>
      </div>
    )
  }

  // Check if link is expired
  if (link.expiresAt && link.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expirado</h1>
          <p className="text-gray-600">
            Este link de agendamiento ha expirado.
          </p>
        </div>
      </div>
    )
  }

  // Get available services and professionals
  const [services, professionals] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: link.tenantId, isActive: true },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.professional.findMany({
      where: {
        tenantId: link.tenantId,
        isActive: true,
        // For now, show all professionals (calendar integration pending)
        // calendarStatus: 'connected',
      },
      orderBy: { name: 'asc' },
    }),
  ])
  
  // Filter to only show active professionals
  // TODO: In Phase 1, filter by calendarStatus: 'connected'
  const servicesWithProfessionals = services.map(service => ({
    ...service,
    professionals: service.professionals.filter(
      sp => sp.professional.isActive
    ),
  })).filter(service => service.professionals.length > 0)

  // Determine preselected service and professional
  const preselectedServiceId = resolvedSearchParams.service || link.serviceId || undefined
  const preselectedProfessionalId = resolvedSearchParams.professional || link.professionalId || undefined

  return (
    <BookingWizard
      linkId={resolvedParams.linkId}
      tenant={link.tenant}
      services={servicesWithProfessionals}
      professionals={professionals}
      preselectedServiceId={preselectedServiceId}
      preselectedProfessionalId={preselectedProfessionalId}
    />
  )
}
