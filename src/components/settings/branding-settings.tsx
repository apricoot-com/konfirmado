'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { Tenant } from '@prisma/client'

interface BrandingSettingsProps {
  tenant: Tenant
}

export function BrandingSettings({ tenant }: BrandingSettingsProps) {
  const [formData, setFormData] = useState({
    name: tenant.name,
    logoUrl: tenant.logoUrl || '',
    primaryColor: tenant.primaryColor,
    secondaryColor: tenant.secondaryColor,
    subdomain: tenant.subdomain || '',
    privacyPolicyUrl: tenant.privacyPolicyUrl || '',
    termsUrl: tenant.termsUrl || '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      const response = await fetch('/api/tenant/branding', {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidad de Marca</CardTitle>
        <CardDescription>
          Personaliza la apariencia de tu pasarela de agendamiento
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
            <Label htmlFor="name">Nombre de la empresa</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <ImageUpload
            label="Logo"
            value={formData.logoUrl}
            onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
            disabled={isLoading}
            aspectRatio="auto"
            maxSizeMB={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color primario</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-20 h-10"
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#3B82F6"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  name="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-20 h-10"
                  disabled={isLoading}
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#10B981"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdominio (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="subdomain"
                name="subdomain"
                type="text"
                placeholder="miempresa"
                value={formData.subdomain}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="text-sm text-gray-500">.konfirmado.com</span>
            </div>
            <p className="text-xs text-gray-500">
              Solo letras minúsculas, números y guiones
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Políticas y Términos</h3>
            
            <div className="space-y-4">
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
                  Se mostrará en el formulario de reserva si se proporciona
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
                  Se mostrará en el formulario de reserva si se proporciona
                </p>
              </div>
            </div>
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
  )
}
