'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Upload } from 'lucide-react'
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

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del logo</Label>
            <div className="flex gap-2">
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://ejemplo.com/logo.png"
                value={formData.logoUrl}
                onChange={handleChange}
                disabled={isLoading}
              />
              <Button type="button" variant="outline" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Subir
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Formato recomendado: PNG o SVG, máximo 2MB
            </p>
            {formData.logoUrl && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <img
                  src={formData.logoUrl}
                  alt="Logo preview"
                  className="h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

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
