'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { Clock, ChevronRight } from 'lucide-react'
import type { BookingState } from '../booking-wizard'

interface Service {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  durationMinutes: number
  price: number
  chargeType: string
  confirmationMessage?: string | null
  professionals: Array<{
    professional: Professional
  }>
}

interface Professional {
  id: string
  name: string
  description: string | null
  photoUrl: string | null
}

interface SelectionStepProps {
  services: Service[]
  professionals: Professional[]
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  primaryColor: string
}

export function SelectionStep({
  services,
  professionals,
  bookingState,
  updateBookingState,
  onNext,
  primaryColor,
}: SelectionStepProps) {
  const [selectedService, setSelectedService] = useState(bookingState.serviceId)
  const [selectedProfessional, setSelectedProfessional] = useState(bookingState.professionalId)

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
    // Reset professional if not available for this service
    const service = services.find(s => s.id === serviceId)
    if (service && selectedProfessional) {
      const isProfessionalAvailable = service.professionals.some(
        p => p.professional.id === selectedProfessional
      )
      if (!isProfessionalAvailable) {
        setSelectedProfessional(null)
      }
    }
  }

  const handleContinue = () => {
    if (selectedService && selectedProfessional) {
      updateBookingState({
        serviceId: selectedService,
        professionalId: selectedProfessional,
      })
      onNext()
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)
  const availableProfessionals = selectedServiceData
    ? selectedServiceData.professionals.map(p => p.professional)
    : professionals

  const canContinue = selectedService && selectedProfessional

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona un servicio</h2>
        <p className="text-gray-600">Elige el servicio que deseas agendar</p>
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className={`p-6 cursor-pointer transition-all ${
              selectedService === service.id
                ? 'ring-2 ring-offset-2'
                : 'hover:shadow-md'
            }`}
            style={
              selectedService === service.id
                ? { borderColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties
                : {}
            }
            onClick={() => handleServiceSelect(service.id)}
          >
            {service.imageUrl && (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {service.name}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {service.description}
            </p>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{service.durationMinutes} min</span>
              </div>
              
              <div className="font-semibold text-gray-900">
                {formatPrice(service.price)}
              </div>
            </div>
            
            {service.chargeType === 'partial' && (
              <p className="text-xs text-gray-500 mt-2">
                Anticipo: {formatPrice(Math.floor(service.price * 0.25))}
              </p>
            )}
          </Card>
        ))}
      </div>

      {selectedService && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona un profesional</h2>
            <p className="text-gray-600">Elige quién te atenderá</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableProfessionals.map((professional) => (
              <Card
                key={professional.id}
                className={`p-6 cursor-pointer transition-all ${
                  selectedProfessional === professional.id
                    ? 'ring-2 ring-offset-2'
                    : 'hover:shadow-md'
                }`}
                style={
                  selectedProfessional === professional.id
                    ? { borderColor: primaryColor, '--tw-ring-color': primaryColor } as React.CSSProperties
                    : {}
                }
                onClick={() => setSelectedProfessional(professional.id)}
              >
                <div className="flex flex-col items-center text-center">
                  {professional.photoUrl ? (
                    <img
                      src={professional.photoUrl}
                      alt={professional.name}
                      className="w-20 h-20 rounded-full object-cover mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                      <span className="text-2xl font-semibold text-gray-600">
                        {professional.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {professional.name}
                  </h3>
                  
                  {professional.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {professional.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {canContinue && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleContinue}
            size="lg"
            style={{ backgroundColor: primaryColor }}
            className="hover:opacity-90"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
