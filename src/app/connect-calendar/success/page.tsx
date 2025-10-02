import { CheckCircle } from 'lucide-react'

export default async function CalendarSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>
}) {
  const resolvedParams = await searchParams
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ¡Calendario Conectado!
        </h1>
        <p className="text-gray-600 mb-6">
          {resolvedParams.name ? `${resolvedParams.name}, tu` : 'Tu'} calendario de Google ha sido conectado exitosamente.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Ahora los clientes podrán ver tu disponibilidad en tiempo real y agendar citas contigo.
          </p>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Puedes cerrar esta ventana.
        </p>
      </div>
    </div>
  )
}
