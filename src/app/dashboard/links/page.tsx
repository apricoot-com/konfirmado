import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Link2, Calendar, User, Copy, ExternalLink, Edit } from 'lucide-react'
import { CopyLinkButton } from '@/components/booking-links/copy-link-button'
import { LinkCardActions } from '@/components/booking-links/link-card-actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function BookingLinksPage() {
  const { tenant } = await requireAuth()
  
  const links = await prisma.bookingLink.findMany({
    where: { tenantId: tenant.id },
    include: {
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Links de Agendamiento</h1>
          <p className="text-gray-600 mt-2">Gestiona tus links de reserva</p>
        </div>
        
        <Link
          href="/dashboard/links/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="inline sm:hidden">Nuevo</span>
          <span className="hidden sm:inline">Nuevo Link</span>
        </Link>
      </div>
      
      {links.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Link2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay links de agendamiento</h3>
          <p className="text-gray-600 mb-6">Crea tu primer link para comenzar a recibir reservas</p>
          <Link
            href="/dashboard/links/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Link
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {links.map((link) => {
            const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${link.publicId}`
            const isExpired = link.expiresAt && link.expiresAt < new Date()
            
            return (
              <div
                key={link.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 lg:items-center">
                  {/* Name */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{link.name}</span>
                    </div>
                  </div>

                  {/* Link */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate">
                        /book/{link.publicId.slice(0, 8)}...
                      </code>
                      <CopyLinkButton url={bookingUrl} />
                    </div>
                  </div>

                  {/* Preselection */}
                  <div className="col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {link.serviceId && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          <Calendar className="w-3 h-3" />
                          Servicio
                        </span>
                      )}
                      {link.professionalId && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          <User className="w-3 h-3" />
                          Prof.
                        </span>
                      )}
                      {!link.serviceId && !link.professionalId && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Bookings */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {link._count.bookings}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    {isExpired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expirado
                      </span>
                    ) : !link.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <a
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir
                    </a>
                    <Link
                      href={`/dashboard/links/${link.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden space-y-3">
                  {/* Header: Name and Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{link.name}</span>
                    </div>
                    {isExpired ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expirado
                      </span>
                    ) : !link.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Activo
                      </span>
                    )}
                  </div>

                  {/* Link */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <code className="text-xs text-gray-600 flex-1 truncate">
                      {bookingUrl}
                    </code>
                    <CopyLinkButton url={bookingUrl} />
                  </div>

                  {/* Preselection */}
                  {(link.serviceId || link.professionalId) && (
                    <div className="flex flex-wrap gap-2">
                      {link.serviceId && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <Calendar className="w-3 h-3" />
                          Servicio preseleccionado
                        </span>
                      )}
                      {link.professionalId && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          <User className="w-3 h-3" />
                          Profesional preseleccionado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats and Actions */}
                  <LinkCardActions
                    linkId={link.id}
                    linkName={link.name}
                    bookingUrl={bookingUrl}
                    bookingsCount={link._count.bookings}
                  />

                  {/* Expiration */}
                  {link.expiresAt && !isExpired && (
                    <div className="text-xs text-gray-500">
                      Expira: {format(link.expiresAt, 'dd MMM yyyy', { locale: es })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
