'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
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

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const isSelected = (serviceId: string) => selectedService === serviceId

  return (
    <div className="flex flex-col h-full">
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 mb-4">
        <div className="grid grid-cols-1 pt-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 px-2 md:px-4">
          {services.map((service) => {
            const selected = isSelected(service.id)
            return (
              <Card
                key={service.id}
                className={`relative p-2 md:p-5 cursor-pointer transition-all max-w-sm mx-auto w-full ${
                  selected
                    ? 'ring-2 ring-offset-2 shadow-lg scale-[1.02]'
                    : 'hover:shadow-lg hover:scale-[1.01]'
                }`}
                style={
                  selected
                    ? {
                        borderColor: primaryColor,
                        '--tw-ring-color': primaryColor,
                        backgroundColor: hexToRgba(primaryColor, 0.05),
                      } as React.CSSProperties
                    : {}
                }
                onClick={() => handleServiceSelect(service.id)}
              >

                {/* Checkmark Overlay */}
                {selected && (
                  <div className="absolute top-2 left-2 z-10">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Image */}
                {service.imageUrl && (
                  <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    {selected && (
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">
                    {service.name}
                  </h3>
                  
                  {service.description && (
                    <p className="text-gray-600 text-sm line-clamp-2 min-h-[2.5rem]">
                      {service.description}
                    </p>
                  )}

                  {/* Price and Duration */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{service.durationMinutes} min</span>
                    </div>
                    <div
                      className="text-xl md:text-2xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(service.price)}
                    </div>
                  </div>

                  {service.chargeType === 'partial' && (
                    <p className="text-xs text-gray-500 pt-1">
                      Anticipo requerido para confirmar
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Footer - Sticky */}
      <div className="flex-shrink-0 flex justify-end pt-6 border-t bg-white sticky bottom-0 z-20 -mx-4 px-4 pb-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedService}
          style={selectedService ? { backgroundColor: primaryColor } : {}}
          className="hover:opacity-90 disabled:opacity-50 transition-all"
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
