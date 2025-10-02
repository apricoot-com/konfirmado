'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Copy, Check } from 'lucide-react'
import type { Tenant } from '@prisma/client'

interface IntegrationSettingsProps {
  tenant: Tenant
}

export function IntegrationSettings({ tenant }: IntegrationSettingsProps) {
  const [formData, setFormData] = useState({
    callbackUrl: tenant.callbackUrl,
    returnUrl: tenant.returnUrl,
    privacyPolicyUrl: tenant.privacyPolicyUrl || '',
    termsUrl: tenant.termsUrl || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/tenant/integration', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar la configuración')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const examplePayload = {
    tenant_id: tenant.id,
    booking_id: "bk_789",
    servicio: {
      id: "srv_001",
      nombre: "Consulta general",
      duracion_min: 30,
      pago: "parcial",
      precio: 120000,
      monto_cobrado: 30000
    },
    profesional: {
      id: "pro_045",
      nombre: "Dr. López"
    },
    cita: {
      inicio: "2025-10-10T15:00:00Z",
      fin: "2025-10-10T15:30:00Z",
      timezone: "America/Bogota"
    },
    usuario: {
      nombre: "Juan Pérez",
      email: "juan@mail.com",
      telefono: "+573001112233",
      acepto_terminos: true
    },
    pago: {
      proveedor: "wompi",
      estado: "aprobado",
      referencia: "wmp_ABC123",
      monto: 30000,
      moneda: "COP"
    },
    seguridad: {
      timestamp: "2025-10-10T15:05:12Z",
      firma_hmac: "c7a9f..."
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>URLs de Integración</CardTitle>
          <CardDescription>
            Configura las URLs donde recibirás notificaciones y redirigirás a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span>Configuración actualizada exitosamente</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="callbackUrl">URL de Callback</Label>
              <Input
                id="callbackUrl"
                name="callbackUrl"
                type="url"
                placeholder="https://tuempresa.com/api/bookings/callback"
                value={formData.callbackUrl}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Recibirás un POST request con los datos de la reserva confirmada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnUrl">URL de Retorno</Label>
              <Input
                id="returnUrl"
                name="returnUrl"
                type="url"
                placeholder="https://tuempresa.com/gracias"
                value={formData.returnUrl}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Tus clientes serán redirigidos aquí después de completar el pago
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacyPolicyUrl">URL de Política de Privacidad (Opcional)</Label>
              <Input
                id="privacyPolicyUrl"
                name="privacyPolicyUrl"
                type="url"
                placeholder="https://tuempresa.com/privacidad"
                value={formData.privacyPolicyUrl}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Si se proporciona, se mostrará un enlace en el formulario de reserva
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="termsUrl">URL de Términos y Condiciones (Opcional)</Label>
              <Input
                id="termsUrl"
                name="termsUrl"
                type="url"
                placeholder="https://tuempresa.com/terminos"
                value={formData.termsUrl}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Si se proporciona, se mostrará un enlace en el formulario de reserva
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentación del Callback</CardTitle>
          <CardDescription>
            Ejemplo del payload JSON que recibirás en tu callback URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Payload de ejemplo</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(JSON.stringify(examplePayload, null, 2), 'payload')}
              >
                {copiedField === 'payload' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <Textarea
              value={JSON.stringify(examplePayload, null, 2)}
              readOnly
              className="font-mono text-xs h-96"
            />
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Verificación de seguridad</h4>
            <p className="text-sm text-gray-600">
              Cada callback incluye un campo <code className="bg-gray-100 px-1 py-0.5 rounded">firma_hmac</code> que
              debes verificar usando tu secret key. Esto garantiza que el callback proviene de Konfirmado.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Tu Callback Secret:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-xs font-mono">
                  {process.env.NEXT_PUBLIC_APP_URL ? 'ks_' + tenant.id.slice(0, 16) : 'Configura CALLBACK_SECRET en .env'}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('ks_' + tenant.id, 'secret')}
                >
                  {copiedField === 'secret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Respuesta esperada</h4>
            <p className="text-sm text-gray-600">
              Tu endpoint debe responder con status <code className="bg-gray-100 px-1 py-0.5 rounded">200 OK</code> para
              confirmar que recibiste el callback. Si respondes con 5xx, reintentaremos con backoff exponencial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
