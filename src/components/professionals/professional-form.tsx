'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
}

interface Professional {
  id: string
  name: string
  description: string | null
  photoUrl: string | null
  services: Array<{
    service: Service
  }>
}

interface ProfessionalFormProps {
  professional?: Professional
  services: Service[]
}

export function ProfessionalForm({ professional, services }: ProfessionalFormProps) {
  const router = useRouter()
  const isEditing = !!professional
  
  const [formData, setFormData] = useState({
    name: professional?.name || '',
    description: professional?.description || '',
    photoUrl: professional?.photoUrl || '',
    serviceIds: professional?.services.map(s => s.service.id) || [],
  })
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/professionals/${professional.id}`
        : '/api/professionals'
      
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al guardar el profesional')
      } else {
        router.push('/dashboard/professionals')
        router.refresh()
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
        <CardTitle>{isEditing ? 'Editar' : 'Nuevo'} Profesional</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Dr. Juan Pérez"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Especialidad, experiencia, etc."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">URL de la foto</Label>
            <Input
              id="photoUrl"
              name="photoUrl"
              type="url"
              placeholder="https://ejemplo.com/foto.jpg"
              value={formData.photoUrl}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formData.photoUrl && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <img
                  src={formData.photoUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Servicios que ofrece</Label>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay servicios disponibles.{' '}
                <Link href="/dashboard/services/new" className="text-blue-600 hover:text-blue-700">
                  Crear servicio
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {service.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/professionals">
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
                isEditing ? 'Actualizar' : 'Crear profesional'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
