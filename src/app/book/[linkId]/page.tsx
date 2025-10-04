import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { BookingWizard } from '@/components/booking/booking-wizard'

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ linkId: string }>
  searchParams: Promise<{ service?: string; professional?: string; retry?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  // Check if this is a retry (failed payment)
  let retryBooking = null
  if (resolvedSearchParams.retry) {
    retryBooking = await prisma.booking.findUnique({
      where: { id: resolvedSearchParams.retry },
      include: {
        service: true,
        professional: true,
      },
    })
  }
  
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
  
  // Filter to only show active professionals with connected calendars
  const servicesWithProfessionals = services.map((service: any) => ({
    ...service,
    professionals: service.professionals.filter(
      (sp: any) => sp.professional.isActive && sp.professional.calendarStatus === 'connected'
    ),
  })).filter((service: any) => service.professionals.length > 0)

  // Determine preselected service and professional
  const preselectedServiceId = retryBooking?.serviceId || resolvedSearchParams.service || link.serviceId || undefined
  const preselectedProfessionalId = retryBooking?.professionalId || resolvedSearchParams.professional || link.professionalId || undefined

  return (
    <BookingWizard
      linkId={resolvedParams.linkId}
      tenant={link.tenant}
      services={servicesWithProfessionals}
      professionals={professionals}
      preselectedServiceId={preselectedServiceId}
      preselectedProfessionalId={preselectedProfessionalId}
      retryBooking={retryBooking}
    />
  )
}
