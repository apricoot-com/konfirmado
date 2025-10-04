'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ui/image-upload'
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { BusinessHoursConfig } from './business-hours-config'
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
  businessHours?: any
  timezone?: string
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
  
  const defaultBusinessHours = {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '18:00' },
    friday: { start: '09:00', end: '18:00' },
    saturday: null,
    sunday: null,
  }

  const [formData, setFormData] = useState({
    name: professional?.name || '',
    email: (professional as any)?.email || '',
    description: professional?.description || '',
    photoUrl: professional?.photoUrl || '',
    serviceIds: professional?.services.map(s => s.service.id) || [],
    businessHours: professional?.businessHours || defaultBusinessHours,
    timezone: professional?.timezone || 'America/Bogota',
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="doctor@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Se enviará un correo con el link de conexión de calendario
            </p>
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

          <ImageUpload
            label="Foto del profesional"
            value={formData.photoUrl}
            onChange={(url) => setFormData(prev => ({ ...prev, photoUrl: url }))}
            disabled={isLoading}
            aspectRatio="square"
            maxSizeMB={3}
          />

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

          {/* Business Hours Configuration */}
          <BusinessHoursConfig
            businessHours={formData.businessHours}
            onChange={(hours) => setFormData(prev => ({ ...prev, businessHours: hours }))}
          />

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
