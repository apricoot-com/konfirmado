'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PaymentConfigPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tenantId = resolvedParams.id
  
  const [tenant, setTenant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    publicKey: '',
    privateKey: '',
    eventsSecret: '',
    integritySecret: '',
  })
  
  useEffect(() => {
    loadTenant()
  }, [tenantId])
  
  const loadTenant = async () => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`)
      if (!response.ok) throw new Error('Failed to load tenant')
      
      const data = await response.json()
      setTenant(data)
      
      // Pre-fill form if config exists
      if (data.paymentConfig) {
        setFormData({
          publicKey: data.paymentConfig.publicKey || '',
          privateKey: '', // Never pre-fill sensitive data
          eventsSecret: '', // Never pre-fill sensitive data
          integritySecret: '', // Never pre-fill sensitive data
        })
      }
    } catch (err) {
      setError('Error al cargar tenant')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/payment-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar configuración')
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/superadmin/tenants/${tenantId}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/superadmin/tenants/${tenantId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración de Pagos</h1>
              <p className="text-sm text-gray-600 mt-1">{tenant?.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Credenciales de Wompi</CardTitle>
            <CardDescription>
              Configura las credenciales de Wompi para que este tenant pueda recibir pagos.
              Obtén estas credenciales desde el dashboard de Wompi del cliente.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span>Configuración guardada exitosamente. Redirigiendo...</span>
                </div>
              )}
              
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Public Key */}
              <div className="space-y-2">
                <Label htmlFor="publicKey">
                  Public Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="publicKey"
                  type="text"
                  placeholder="pub_test_..."
                  value={formData.publicKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicKey: e.target.value }))}
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Llave pública de Wompi (comienza con pub_test_ o pub_prod_)
                </p>
              </div>
              
              {/* Private Key */}
              <div className="space-y-2">
                <Label htmlFor="privateKey">
                  Private Key <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="privateKey"
                  type="password"
                  placeholder="prv_test_..."
                  value={formData.privateKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Llave privada de Wompi (comienza con prv_test_ o prv_prod_)
                </p>
              </div>
              
              {/* Events Secret */}
              <div className="space-y-2">
                <Label htmlFor="eventsSecret">
                  Events Secret <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eventsSecret"
                  type="password"
                  placeholder="test_events_..."
                  value={formData.eventsSecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventsSecret: e.target.value }))}
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Secret para verificar webhooks de Wompi
                </p>
              </div>
              
              {/* Integrity Secret */}
              <div className="space-y-2">
                <Label htmlFor="integritySecret">
                  Integrity Secret <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="integritySecret"
                  type="password"
                  placeholder="test_integrity_..."
                  value={formData.integritySecret}
                  onChange={(e) => setFormData(prev => ({ ...prev, integritySecret: e.target.value }))}
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Secret para generar firmas de integridad en transacciones
                </p>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  ℹ️ Dónde encontrar estas credenciales
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Ingresa al dashboard de Wompi del cliente</li>
                  <li>Ve a Configuración → Credenciales API</li>
                  <li>Copia las llaves de producción o pruebas</li>
                  <li>Pega aquí y guarda</li>
                </ol>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Configuración'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/superadmin/tenants/${tenantId}`)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
