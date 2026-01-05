import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Users, Briefcase, Link2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { GettingStarted } from '@/components/dashboard/getting-started'
import { CopyLinkButton } from '@/components/booking-links/copy-link-button'

export default async function DashboardPage() {
  const { user, tenant } = await requireAuth()
  
  // Get quick stats
  const [bookingsCount, servicesCount, professionalsCount, linksCount, connectedProfessionals, recentLinks] = await Promise.all([
    prisma.booking.count({ where: { tenantId: tenant.id } }),
    prisma.service.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.professional.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.bookingLink.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.professional.count({ 
      where: { 
        tenantId: tenant.id, 
        calendarStatus: 'connected' 
      } 
    }),
    (async () => {
      const links = await prisma.bookingLink.findMany({
        where: { tenantId: tenant.id },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      
      // Fetch service and professional data for links that have them
      const serviceIds = links.filter(l => l.serviceId).map(l => l.serviceId!)
      const professionalIds = links.filter(l => l.professionalId).map(l => l.professionalId!)
      
      const [services, professionals] = await Promise.all([
        serviceIds.length > 0
          ? prisma.service.findMany({
              where: { id: { in: serviceIds } },
              select: { id: true, name: true },
            })
          : [],
        professionalIds.length > 0
          ? prisma.professional.findMany({
              where: { id: { in: professionalIds } },
              select: { id: true, name: true },
            })
          : [],
      ])
      
      // Map services and professionals by ID for quick lookup
      const servicesMap = new Map<string, { id: string; name: string }>(
        services.map(s => [s.id, s] as [string, { id: string; name: string }])
      )
      const professionalsMap = new Map<string, { id: string; name: string }>(
        professionals.map(p => [p.id, p] as [string, { id: string; name: string }])
      )
      
      // Add service and professional data to links
      return links.map(link => ({
        ...link,
        service: link.serviceId ? servicesMap.get(link.serviceId) || null : null,
        professional: link.professionalId ? professionalsMap.get(link.professionalId) || null : null,
      }))
    })(),
  ])
  
  // Check setup status
  const hasServices = servicesCount > 0
  const hasProfessionals = professionalsCount > 0
  const hasLinks = linksCount > 0
  const hasConnectedCalendar = connectedProfessionals > 0
  const paymentConfig = (tenant.paymentConfig as any) || {}
  const hasWompi = !!paymentConfig.publicKey && !!paymentConfig.privateKey
  const hasBranding = !!tenant.logoUrl
  
  const setupComplete = hasServices && hasProfessionals && hasLinks && hasWompi
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido, {user.email}</p>
      </div>
      
      {/* Getting Started Guide */}
      <GettingStarted
        stats={{
          hasServices,
          hasProfessionals,
          hasConnectedCalendar,
          hasPaymentConfig: hasWompi,
          hasBookingLinks: hasLinks,
          hasBranding,
        }}
      />
      
      {/* Old Setup Checklist - Keep as fallback */}
      {false && !setupComplete && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Completa la configuración inicial</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {hasServices ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm text-gray-700">
                {hasServices ? 'Servicios configurados' : 'Crea tu primer servicio'}
              </span>
              {!hasServices && (
                <Link href="/dashboard/services/new" className="text-sm text-blue-600 hover:text-blue-700 ml-auto">
                  Crear →
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasProfessionals ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm text-gray-700">
                {hasProfessionals ? 'Profesionales agregados' : 'Agrega profesionales'}
              </span>
              {!hasProfessionals && (
                <Link href="/dashboard/professionals/new" className="text-sm text-blue-600 hover:text-blue-700 ml-auto">
                  Crear →
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasWompi ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm text-gray-700">
                {hasWompi ? 'Wompi configurado' : 'Configura Wompi para pagos'}
              </span>
              {!hasWompi && (
                <Link href="/dashboard/settings" className="text-sm text-blue-600 hover:text-blue-700 ml-auto">
                  Configurar →
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasLinks ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              )}
              <span className="text-sm text-gray-700">
                {hasLinks ? 'Links de agendamiento creados' : 'Crea tu primer link'}
              </span>
              {!hasLinks && (
                <Link href="/dashboard/links/new" className="text-sm text-blue-600 hover:text-blue-700 ml-auto">
                  Crear →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/bookings" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Reservas</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{bookingsCount}</div>
          <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
            <span>Ver todas</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <Link href="/dashboard/services" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Servicios</span>
            <Briefcase className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{servicesCount}</div>
          <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
            <span>Gestionar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <Link href="/dashboard/professionals" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Profesionales</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{professionalsCount}</div>
          <div className="flex items-center gap-1 mt-2 text-sm text-purple-600">
            <span>Gestionar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
        
        <Link href="/dashboard/links" className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Links</span>
            <Link2 className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{linksCount}</div>
          <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
            <span>Gestionar</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
      
      {/* Recent Booking Links */}
      {recentLinks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Links de Agendamiento</h2>
            <Link
              href="/dashboard/links"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLinks.map((link) => {
              const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${link.publicId}`
              const isExpired = link.expiresAt && link.expiresAt < new Date()
              
              return (
                <div
                  key={link.id}
                  className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors overflow-hidden"
                >
                  {/* Desktop Layout */}
                  <div className="hidden md:flex items-center justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{link.name}</span>
                        {!link.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            Inactivo
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                            Expirado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono break-all">
                          {bookingUrl}
                        </code>
                        {(link.service || link.professional) && (
                          <div className="flex items-center gap-2">
                            {link.service && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {link.service.name}
                              </span>
                            )}
                            {link.professional && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users className="w-3 h-3" />
                                {link.professional.name}
                              </span>
                            )}
                          </div>
                        )}
                        <span className="text-xs text-gray-400">
                          {link._count.bookings} reserva{link._count.bookings !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <CopyLinkButton url={bookingUrl} />
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="md:hidden p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{link.name}</span>
                        </div>
                        {!link.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded inline-block mt-1">
                            Inactivo
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded inline-block mt-1">
                            Expirado
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {(link.service || link.professional) && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {link.service && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {link.service.name}
                              </span>
                            )}
                            {link.professional && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Users className="w-3 h-3" />
                                {link.professional.name}
                              </span>
                            )}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {link._count.bookings} reserva{link._count.bookings !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-2 mb-2">
                        <code className="text-xs text-gray-700 break-all block">
                          {bookingUrl}
                        </code>
                      </div>
                      
                      <CopyLinkButton url={bookingUrl} variant="button" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {linksCount > 5 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/dashboard/links"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
              >
                Ver todos los {linksCount} links
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/services/new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Briefcase className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Crear servicio</span>
          </Link>
          
          <Link
            href="/dashboard/professionals/new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Agregar profesional</span>
          </Link>
          
          <Link
            href="/dashboard/links/new"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Link2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Generar link</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
