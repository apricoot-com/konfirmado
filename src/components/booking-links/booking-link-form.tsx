'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, Loader2, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
}

interface Professional {
  id: string
  name: string
}

interface BookingLink {
  id: string
  publicId: string
  name: string
  serviceId: string | null
  professionalId: string | null
  expiresAt: Date | null
  isActive: boolean
}

interface BookingLinkFormProps {
  link?: BookingLink
  services: Service[]
  professionals: Professional[]
}

export function BookingLinkForm({ link, services, professionals }: BookingLinkFormProps) {
  const router = useRouter()
  const isEditing = !!link
  
  const [formData, setFormData] = useState({
    name: link?.name || '',
    serviceId: link?.serviceId || '',
    professionalId: link?.professionalId || '',
    expiresAt: link?.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
    isActive: link?.isActive ?? true,
  })
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value
      
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
    }))
  }

  const handleCopy = async () => {
    if (link) {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/book/${link.publicId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/booking-links/${link.id}`
        : '/api/booking-links'
      
      const method = isEditing ? 'PATCH' : 'POST'
      
      const payload = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : '',
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al guardar el link')
      } else {
        router.push('/dashboard/links')
        router.refresh()
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const bookingUrl = link 
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/book/${link.publicId}`
    : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Editar' : 'Nuevo'} Link de Agendamiento</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Actualiza la configuración del link de reserva'
              : 'Crea un link único para compartir con tus clientes'
            }
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

            {isEditing && bookingUrl && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-900 mb-2 block">
                  URL del Link
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-blue-300 text-blue-900 overflow-x-auto">
                    {bookingUrl}
                  </code>
                  <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
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
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del link *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ej: Campaña Navidad 2024"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Nombre interno para identificar este link
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Preselección (Opcional)</h3>
              <p className="text-sm text-gray-600">
                Puedes preseleccionar un servicio y/o profesional. El usuario podrá cambiarlos si lo desea.
              </p>

              <div className="space-y-2">
                <Label htmlFor="serviceId">Servicio</Label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Sin preselección</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="professionalId">Profesional</Label>
                <select
                  id="professionalId"
                  name="professionalId"
                  value={formData.professionalId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Sin preselección</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Fecha de expiración (Opcional)</Label>
              <Input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={handleChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Deja vacío para que el link no expire
              </p>
            </div>

            {isEditing && (
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Link activo
                </Label>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <Link href="/dashboard/links">
                <Button type="button" variant="outline" disabled={isLoading}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </Link>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  isEditing ? 'Actualizar link' : 'Crear link'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
