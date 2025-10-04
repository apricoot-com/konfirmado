'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
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

interface ServiceSelectionStepProps {
  services: Service[]
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  primaryColor: string
}

export function ServiceSelectionStep({
  services,
  bookingState,
  updateBookingState,
  onNext,
  primaryColor,
}: ServiceSelectionStepProps) {
  const [selectedService, setSelectedService] = useState<string | null>(
    bookingState.serviceId
  )

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId)
  }

  const handleContinue = () => {
    if (selectedService) {
      updateBookingState({
        serviceId: selectedService,
        // Reset professional if not available for this service
        professionalId: null,
      })
      onNext()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 mb-4">
        <div className="grid gap-4 pb-20">
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.durationMinutes} min
                </div>
                <div className="text-lg font-bold" style={{ color: primaryColor }}>
                  {formatPrice(service.price)}
                </div>
              </div>
              {service.chargeType === 'partial' && (
                <p className="text-xs text-gray-500 mt-2">
                  Anticipo requerido para confirmar
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Footer - Sticky */}
      <div className="flex-shrink-0 flex justify-end pt-6 border-t bg-white sticky bottom-0 z-20 -mx-4 px-4 pb-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedService}
          style={selectedService ? { backgroundColor: primaryColor } : {}}
          className="hover:opacity-90 disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
