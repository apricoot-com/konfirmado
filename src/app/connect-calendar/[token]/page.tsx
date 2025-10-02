import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getAuthUrl } from '@/lib/google-calendar'
import { Calendar, CheckCircle } from 'lucide-react'

export default async function ConnectCalendarPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const resolvedParams = await params
  
  // Find professional by connection token
  const professional = await prisma.professional.findUnique({
    where: { connectionToken: resolvedParams.token },
    include: { tenant: true },
  })
  
  if (!professional) {
    notFound()
  }
  
  // Check if token is expired
  if (professional.tokenExpiresAt && professional.tokenExpiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expirado</h1>
          <p className="text-gray-600">
            Este link de conexión ha expirado. Por favor contacta al administrador para obtener uno nuevo.
          </p>
        </div>
      </div>
    )
  }
  
  // Check if already connected
  if (professional.calendarStatus === 'connected' && professional.refreshToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Calendario Conectado</h1>
          <p className="text-gray-600 mb-6">
            Tu calendario de Google ya está conectado correctamente.
          </p>
          <p className="text-sm text-gray-500">
            Puedes cerrar esta ventana.
          </p>
        </div>
      </div>
    )
  }
  
  // Generate Google OAuth URL
  const authUrl = getAuthUrl(resolvedParams.token)
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          {professional.tenant.logoUrl ? (
            <img
              src={professional.tenant.logoUrl}
              alt={professional.tenant.name}
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {professional.tenant.name}
            </h2>
          )}
          <Calendar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Conecta tu Calendario
          </h1>
          <p className="text-gray-600">
            Hola {professional.name}, necesitamos acceso a tu calendario de Google para gestionar tu disponibilidad.
          </p>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">¿Qué vamos a hacer?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Leer tu disponibilidad (eventos ocupados)</li>
            <li>• Mostrar horarios disponibles a los clientes</li>
            <li>• NO crearemos ni modificaremos eventos</li>
            <li>• Solo acceso de lectura a tu calendario</li>
          </ul>
        </div>
        
        {/* Connect Button */}
        <a
          href={authUrl}
          className="block w-full bg-blue-600 text-white text-center font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Conectar con Google Calendar
        </a>
        
        <p className="text-xs text-gray-500 text-center mt-4">
          Al conectar, aceptas que {professional.tenant.name} acceda a tu información de disponibilidad de Google Calendar.
        </p>
      </div>
    </div>
  )
}
