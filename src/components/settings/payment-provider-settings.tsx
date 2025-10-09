'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Copy, Check } from 'lucide-react'
import type { Tenant } from '@prisma/client'
import Image from 'next/image'

interface PaymentProviderSettingsProps {
  tenant: Tenant
}

type Provider = 'wompi' | 'payu'

export function PaymentProviderSettings({ tenant }: PaymentProviderSettingsProps) {
  const paymentConfig = (tenant.paymentConfig as any) || {}
  const currentProvider = (tenant.paymentProvider as Provider) || 'wompi'
  
  const [selectedProvider, setSelectedProvider] = useState<Provider>(currentProvider)
  const [formData, setFormData] = useState({
    // Wompi
    wompiPublicKey: paymentConfig.publicKey || '',
    wompiPrivateKey: '',
    wompiEventsSecret: '',
    wompiIntegritySecret: '',
    // PayU
    payuMerchantId: paymentConfig.merchantId || '',
    payuApiKey: '',
    payuApiLogin: '',
    payuAccountId: paymentConfig.accountId || '',
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'https://tudominio.com'}/api/webhooks/payments`

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopiedWebhook(true)
      setTimeout(() => setCopiedWebhook(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const payload: any = {
        provider: selectedProvider,
      }

      if (selectedProvider === 'wompi') {
        payload.credentials = {
          publicKey: formData.wompiPublicKey,
          privateKey: formData.wompiPrivateKey,
          eventsSecret: formData.wompiEventsSecret,
          integritySecret: formData.wompiIntegritySecret,
        }
      } else if (selectedProvider === 'payu') {
        payload.credentials = {
          merchantId: formData.payuMerchantId,
          apiKey: formData.payuApiKey,
          apiLogin: formData.payuApiLogin,
          accountId: formData.payuAccountId,
        }
      }

      const response = await fetch('/api/tenant/payment-provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar la configuración')
      } else {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedor de Pagos</CardTitle>
        <CardDescription>
          Configura cómo recibirás pagos de tus clientes
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

          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>Selecciona tu proveedor de pagos</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wompi */}
              <button
                type="button"
                onClick={() => setSelectedProvider('wompi')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedProvider === 'wompi'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-2xl font-bold text-purple-600">W</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Wompi</p>
                    <p className="text-xs text-gray-600">Colombia</p>
                  </div>
                </div>
              </button>

              {/* PayU */}
              <button
                type="button"
                onClick={() => setSelectedProvider('payu')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedProvider === 'payu'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-2xl font-bold text-green-600">P</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">PayU</p>
                    <p className="text-xs text-gray-600">LATAM</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Wompi Configuration */}
          {selectedProvider === 'wompi' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900">Credenciales de Wompi</h3>
              
              <div className="space-y-2">
                <Label htmlFor="wompiPublicKey">Public Key *</Label>
                <Input
                  id="wompiPublicKey"
                  name="wompiPublicKey"
                  type="text"
                  placeholder="pub_prod_..."
                  value={formData.wompiPublicKey}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wompiPrivateKey">Private Key *</Label>
                <Input
                  id="wompiPrivateKey"
                  name="wompiPrivateKey"
                  type="password"
                  placeholder="prv_prod_..."
                  value={formData.wompiPrivateKey}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wompiEventsSecret">Events Secret *</Label>
                <Input
                  id="wompiEventsSecret"
                  name="wompiEventsSecret"
                  type="password"
                  placeholder="prod_events_..."
                  value={formData.wompiEventsSecret}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wompiIntegritySecret">Integrity Secret *</Label>
                <Input
                  id="wompiIntegritySecret"
                  name="wompiIntegritySecret"
                  type="password"
                  placeholder="prod_integrity_..."
                  value={formData.wompiIntegritySecret}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">📍 Dónde encontrar las credenciales</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Ingresa a <a href="https://comercios.wompi.co" target="_blank" className="underline">comercios.wompi.co</a></li>
                  <li>Ve a Configuración → Credenciales API</li>
                  <li>Copia las 4 llaves y pégalas aquí</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium mb-2">⚠️ Importante: Configura el Webhook</p>
                <p className="text-sm text-yellow-800 mb-2">
                  En Wompi, configura la URL de eventos (webhook) para recibir notificaciones de pago:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded border border-yellow-300 p-2">
                    <code className="text-xs font-mono text-yellow-900 break-all">
                      {webhookUrl}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="flex items-center gap-1 px-4 py-3 text-sm bg-white border border-yellow-300 text-yellow-900 rounded hover:bg-yellow-100 transition-colors"
                    title="Copiar URL"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Ve a Configuración → Eventos → URL de eventos en tu panel de Wompi
                </p>
              </div>
            </div>
          )}

          {/* PayU Configuration */}
          {selectedProvider === 'payu' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900">Credenciales de PayU</h3>
              
              <div className="space-y-2">
                <Label htmlFor="payuMerchantId">Merchant ID *</Label>
                <Input
                  id="payuMerchantId"
                  name="payuMerchantId"
                  type="text"
                  placeholder="508029"
                  value={formData.payuMerchantId}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payuApiKey">API Key *</Label>
                <Input
                  id="payuApiKey"
                  name="payuApiKey"
                  type="password"
                  placeholder="4Vj8eK4rloUd..."
                  value={formData.payuApiKey}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payuApiLogin">API Login *</Label>
                <Input
                  id="payuApiLogin"
                  name="payuApiLogin"
                  type="password"
                  placeholder="pRRXKOl8ikMmt9u"
                  value={formData.payuApiLogin}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payuAccountId">Account ID *</Label>
                <Input
                  id="payuAccountId"
                  name="payuAccountId"
                  type="text"
                  placeholder="512321"
                  value={formData.payuAccountId}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 font-medium mb-2">📍 Dónde encontrar las credenciales</p>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Ingresa a <a href="https://merchants.payulatam.com" target="_blank" className="underline">merchants.payulatam.com</a></li>
                  <li>Ve a Configuración → Configuración técnica</li>
                  <li>Copia Merchant ID, API Key, API Login y Account ID</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium mb-2">⚠️ Importante: Configura el Webhook</p>
                <p className="text-sm text-yellow-800 mb-2">
                  En PayU, configura la URL de confirmación para recibir notificaciones de pago:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white rounded border border-yellow-300 p-2">
                    <code className="text-xs font-mono text-yellow-900 break-all">
                      {webhookUrl}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="flex items-center gap-1 px-4 py-3 text-sm bg-white border border-yellow-300 text-yellow-900 rounded hover:bg-yellow-100 transition-colors"
                    title="Copiar URL"
                  >
                    {copiedWebhook ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Ve a Configuración → Configuración técnica → URL de confirmación en tu panel de PayU
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
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
  )
}
