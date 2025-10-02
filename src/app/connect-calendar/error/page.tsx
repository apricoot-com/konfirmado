import { XCircle } from 'lucide-react'

const errorMessages: Record<string, string> = {
  access_denied: 'Cancelaste la conexión con Google Calendar.',
  missing_params: 'Faltan parámetros requeridos.',
  invalid_token: 'El link de conexión no es válido.',
  expired_token: 'El link de conexión ha expirado. Solicita uno nuevo.',
  no_refresh_token: 'No se pudo obtener acceso permanente. Intenta nuevamente.',
  no_calendar: 'No se encontró un calendario de Google.',
  server_error: 'Ocurrió un error en el servidor. Intenta nuevamente.',
}

export default async function CalendarErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const resolvedParams = await searchParams
  const reason = resolvedParams.reason || 'unknown'
  const message = errorMessages[reason] || 'Ocurrió un error desconocido.'
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Error al Conectar
        </h1>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            Por favor contacta al administrador para obtener un nuevo link de conexión.
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-6">
          Código de error: {reason}
        </p>
      </div>
    </div>
  )
}
