'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff, ExternalLink, Info } from 'lucide-react'
import type { Tenant } from '@prisma/client'

interface PaymentSettingsProps {
  tenant: Tenant
}

export function PaymentSettings({ tenant }: PaymentSettingsProps) {
  const [formData, setFormData] = useState({
    wompiPublicKey: tenant.wompiPublicKey || '',
    wompiPrivateKey: '',
    wompiIntegritySecret: '',
    wompiEventsSecret: '',
    wompiMode: tenant.wompiMode,
  })
  
  const [showSecrets, setShowSecrets] = useState({
    privateKey: false,
    integritySecret: false,
    eventsSecret: false,
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const toggleSecret = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/tenant/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar la configuración')
      } else {
        setSuccess(true)
        // Clear secret fields after successful save
        setFormData(prev => ({
          ...prev,
          wompiPrivateKey: '',
          wompiIntegritySecret: '',
          wompiEventsSecret: '',
        }))
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasPrivateKey = tenant.wompiPrivateKey && tenant.wompiPrivateKey.length > 0
  const hasIntegritySecret = tenant.wompiIntegritySecret && tenant.wompiIntegritySecret.length > 0
  const hasEventsSecret = tenant.wompiEventsSecret && tenant.wompiEventsSecret.length > 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Wompi</CardTitle>
          <CardDescription>
            Configura tus credenciales de Wompi para procesar pagos
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

            {/* Mode Selection */}
            <div className="space-y-2">
              <Label htmlFor="wompiMode">Modo</Label>
              <select
                id="wompiMode"
                name="wompiMode"
                value={formData.wompiMode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="test">Pruebas (Test)</option>
                <option value="production">Producción</option>
              </select>
              <p className="text-xs text-gray-500">
                Usa modo pruebas para desarrollo y modo producción para pagos reales
              </p>
            </div>

            {/* Public Key */}
            <div className="space-y-2">
              <Label htmlFor="wompiPublicKey">
                Llave Pública
                <span className="ml-1 text-green-600">(Pública)</span>
              </Label>
              <Input
                id="wompiPublicKey"
                name="wompiPublicKey"
                type="text"
                placeholder={formData.wompiMode === 'test' ? 'pub_test_...' : 'pub_prod_...'}
                value={formData.wompiPublicKey}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Esta llave es pública y se usa en el checkout. Puedes compartirla sin problemas.
              </p>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <Label htmlFor="wompiPrivateKey">
                Llave Privada
                <span className="ml-1 text-red-600">(Secreta)</span>
              </Label>
              <div className="relative">
                <Input
                  id="wompiPrivateKey"
                  name="wompiPrivateKey"
                  type={showSecrets.privateKey ? 'text' : 'password'}
                  placeholder={hasPrivateKey ? '••••••••••••••••' : (formData.wompiMode === 'test' ? 'prv_test_...' : 'prv_prod_...')}
                  value={formData.wompiPrivateKey}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('privateKey')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.privateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {hasPrivateKey && !formData.wompiPrivateKey && (
                <p className="text-xs text-green-600">✓ Configurada (deja vacío para mantener)</p>
              )}
              <p className="text-xs text-gray-500">
                Usada para operaciones del servidor. Nunca la compartas.
              </p>
            </div>

            {/* Integrity Secret */}
            <div className="space-y-2">
              <Label htmlFor="wompiIntegritySecret">
                Integrity Secret
                <span className="ml-1 text-red-600">(Secreta)</span>
              </Label>
              <div className="relative">
                <Input
                  id="wompiIntegritySecret"
                  name="wompiIntegritySecret"
                  type={showSecrets.integritySecret ? 'text' : 'password'}
                  placeholder={hasIntegritySecret ? '••••••••••••••••' : (formData.wompiMode === 'test' ? 'test_integrity_...' : 'prod_integrity_...')}
                  value={formData.wompiIntegritySecret}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('integritySecret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.integritySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {hasIntegritySecret && !formData.wompiIntegritySecret && (
                <p className="text-xs text-green-600">✓ Configurada (deja vacío para mantener)</p>
              )}
              <p className="text-xs text-gray-500">
                Usada para generar firmas de integridad en los pagos.
              </p>
            </div>

            {/* Events Secret */}
            <div className="space-y-2">
              <Label htmlFor="wompiEventsSecret">
                Events Secret
                <span className="ml-1 text-red-600">(Secreta)</span>
              </Label>
              <div className="relative">
                <Input
                  id="wompiEventsSecret"
                  name="wompiEventsSecret"
                  type={showSecrets.eventsSecret ? 'text' : 'password'}
                  placeholder={hasEventsSecret ? '••••••••••••••••' : 'test_events_...'}
                  value={formData.wompiEventsSecret}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('eventsSecret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets.eventsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {hasEventsSecret && !formData.wompiEventsSecret && (
                <p className="text-xs text-green-600">✓ Configurada (deja vacío para mantener)</p>
              )}
              <p className="text-xs text-gray-500">
                Usada para verificar la autenticidad de los webhooks.
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
                  'Guardar configuración'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            ¿Dónde encuentro estas credenciales?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-blue-900 mb-1">
                  1. Inicia sesión en Wompi
                </h4>
                <p className="text-sm text-blue-800">
                  Accede a tu cuenta en{' '}
                  <a
                    href="https://comercios.wompi.co/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    comercios.wompi.co
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-blue-900 mb-1">
                  2. Ve a Desarrolladores
                </h4>
                <p className="text-sm text-blue-800">
                  En el menú lateral, busca la sección <strong>"Desarrolladores"</strong> o <strong>"Developers"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-blue-900 mb-1">
                  3. Copia tus credenciales
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  Encontrarás 4 tipos de credenciales:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• <strong>Llave pública:</strong> pub_test_... o pub_prod_...</li>
                  <li>• <strong>Llave privada:</strong> prv_test_... o prv_prod_...</li>
                  <li>• <strong>Integrity secret:</strong> test_integrity_... o prod_integrity_...</li>
                  <li>• <strong>Events secret:</strong> Para verificar webhooks</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-sm text-yellow-900 mb-1">
                  ⚠️ Importante: Configura tu Webhook
                </h4>
                <p className="text-sm text-yellow-800 mb-2">
                  En Wompi, configura tu URL de eventos (webhook) como:
                </p>
                <code className="block bg-white px-3 py-2 rounded border border-yellow-300 text-xs font-mono text-yellow-900">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://tudominio.com'}/api/webhooks/wompi
                </code>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-sm mb-2">Documentación oficial:</h4>
            <div className="space-y-2">
              <a
                href="https://docs.wompi.co/en/docs/colombia/widget-checkout-web/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Widget & Checkout Web
              </a>
              <a
                href="https://docs.wompi.co/en/docs/colombia/eventos/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Eventos (Webhooks)
              </a>
              <a
                href="https://docs.wompi.co/en/docs/colombia/inicio-rapido/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Inicio Rápido
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
