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
import { formatPrice } from '@/lib/utils'

interface Professional {
  id: string
  name: string
}

interface Service {
  id: string
  name: string
  description: string
  imageUrl: string | null
  durationMinutes: number
  price: number
  chargeType: string
  partialPercentage: number
  confirmationMessage: string | null
  professionals: Array<{
    professional: Professional
  }>
}

interface ServiceFormProps {
  service?: Service
  professionals: Professional[]
}

export function ServiceForm({ service, professionals }: ServiceFormProps) {
  const router = useRouter()
  const isEditing = !!service
  
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    imageUrl: service?.imageUrl || '',
    durationMinutes: service?.durationMinutes || 30,
    price: service?.price || 0,
    chargeType: service?.chargeType || 'partial',
    partialPercentage: service?.partialPercentage || 25,
    confirmationMessage: service?.confirmationMessage || '',
    professionalIds: service?.professionals.map(p => p.professional.id) || [],
  })
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleProfessionalToggle = (professionalId: string) => {
    setFormData(prev => ({
      ...prev,
      professionalIds: prev.professionalIds.includes(professionalId)
        ? prev.professionalIds.filter(id => id !== professionalId)
        : [...prev.professionalIds, professionalId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/services/${service.id}`
        : '/api/services'
      
      const method = isEditing ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al guardar el servicio')
      } else {
        router.push('/dashboard/services')
        router.refresh()
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const chargeAmount = formData.chargeType === 'partial' 
    ? Math.floor(formData.price * (formData.partialPercentage / 100))
    : formData.price

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar' : 'Nuevo'} Servicio</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del servicio *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Consulta general"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duración (minutos) *</Label>
              <Input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min="15"
                max="480"
                step="15"
                placeholder="30"
                value={formData.durationMinutes}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe el servicio que ofreces..."
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmationMessage">Mensaje de confirmación</Label>
            <Textarea
              id="confirmationMessage"
              name="confirmationMessage"
              placeholder="Mensaje opcional que se mostrará al cliente después de confirmar el pago..."
              value={formData.confirmationMessage}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Este mensaje se mostrará al cliente después de completar el pago exitosamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL de la imagen</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={formData.imageUrl}
              onChange={handleChange}
              disabled={isLoading}
            />
            {formData.imageUrl && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Precio (COP) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1000"
                placeholder="120000"
                value={formData.price}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
              {formData.price > 0 && (
                <p className="text-sm text-gray-600">
                  {formatPrice(formData.price)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="chargeType">Tipo de cobro *</Label>
              <select
                id="chargeType"
                name="chargeType"
                value={formData.chargeType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="partial">Parcial (anticipo)</option>
                <option value="total">Total (100% por adelantado)</option>
              </select>
            </div>
          </div>

          {formData.chargeType === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="partialPercentage">Porcentaje de anticipo *</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    id="partialPercentage"
                    name="partialPercentage"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={formData.partialPercentage}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  {[25, 30, 50, 100].map((percentage) => (
                    <Button
                      key={percentage}
                      type="button"
                      variant={formData.partialPercentage === percentage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, partialPercentage: percentage }))}
                      disabled={isLoading}
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              </div>
              {formData.price > 0 && (
                <p className="text-sm text-gray-600">
                  Se cobrará: {formatPrice(chargeAmount)} ({formData.partialPercentage}% de anticipo)
                </p>
              )}
            </div>
          )}

          {formData.chargeType === 'total' && formData.price > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Se cobrará el monto total: {formatPrice(chargeAmount)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Profesionales que ofrecen este servicio</Label>
            {professionals.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay profesionales disponibles.{' '}
                <Link href="/dashboard/professionals/new" className="text-blue-600 hover:text-blue-700">
                  Crear profesional
                </Link>
              </p>
            ) : (
              <div className="space-y-2">
                {professionals.map((professional) => (
                  <label
                    key={professional.id}
                    className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.professionalIds.includes(professional.id)}
                      onChange={() => handleProfessionalToggle(professional.id)}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {professional.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Selecciona los profesionales que pueden ofrecer este servicio
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/dashboard/services">
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
                isEditing ? 'Actualizar servicio' : 'Crear servicio'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
