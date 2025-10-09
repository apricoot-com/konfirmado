import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Link2, Calendar, User, Copy, ExternalLink } from 'lucide-react'
import { CopyLinkButton } from '@/components/booking-links/copy-link-button'
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preselección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {links.map((link) => {
                const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/${link.publicId}`
                const isExpired = link.expiresAt && link.expiresAt < new Date()
                
                return (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{link.name}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          /book/{link.publicId.slice(0, 8)}...
                        </code>
                        <CopyLinkButton url={bookingUrl} />
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {link.serviceId && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span>Servicio</span>
                          </div>
                        )}
                        {link.professionalId && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            <span>Profesional</span>
                          </div>
                        )}
                        {!link.serviceId && !link.professionalId && (
                          <span className="text-xs text-gray-400">Ninguna</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {link._count.bookings}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
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
                      {link.expiresAt && !isExpired && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expira: {format(link.expiresAt, 'dd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <a
                          href={bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                          title="Abrir link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/dashboard/links/${link.id}/edit`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Editar"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
