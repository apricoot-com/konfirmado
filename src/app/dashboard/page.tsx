import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Users, Briefcase, Link2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const { user, tenant } = await requireAuth()
  
  // Get quick stats
  const [bookingsCount, servicesCount, professionalsCount, linksCount] = await Promise.all([
    prisma.booking.count({ where: { tenantId: tenant.id } }),
    prisma.service.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.professional.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.bookingLink.count({ where: { tenantId: tenant.id, isActive: true } }),
  ])
  
  // Check setup status
  const hasServices = servicesCount > 0
  const hasProfessionals = professionalsCount > 0
  const hasLinks = linksCount > 0
  const hasWompi = !!tenant.wompiPublicKey && !!tenant.wompiPrivateKey
  
  const setupComplete = hasServices && hasProfessionals && hasLinks && hasWompi
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido, {user.email}</p>
      </div>
      
      {/* Setup Checklist */}
      {!setupComplete && (
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
