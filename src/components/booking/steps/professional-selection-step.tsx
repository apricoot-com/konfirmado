'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
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

interface ProfessionalSelectionStepProps {
  services: Service[]
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  primaryColor: string
}

export function ProfessionalSelectionStep({
  services,
  bookingState,
  updateBookingState,
  onNext,
  onBack,
  primaryColor,
}: ProfessionalSelectionStepProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(
    bookingState.professionalId
  )

  // Get professionals for selected service
  const selectedService = services.find(s => s.id === bookingState.serviceId)
  const availableProfessionals = selectedService?.professionals.map(sp => sp.professional) || []

  const handleContinue = () => {
    if (selectedProfessional) {
      updateBookingState({
        professionalId: selectedProfessional,
      })
      onNext()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Service context */}
      {selectedService && (
        <div className="flex-shrink-0 mb-4 text-sm text-gray-500 text-center">
          Servicio: <span className="font-medium text-gray-700">{selectedService.name}</span>
        </div>
      )}

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 mb-4">
        {availableProfessionals.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay profesionales disponibles
            </h3>
            <p className="text-gray-600">
              Por favor, selecciona otro servicio o intenta más tarde.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 pb-20">
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
                <div className="flex items-start gap-4">
                  {professional.photoUrl ? (
                    <img
                      src={professional.photoUrl}
                      alt={professional.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {professional.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {professional.name}
                    </h3>
                    {professional.description && (
                      <p className="text-sm text-gray-600">{professional.description}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="flex-shrink-0 flex justify-between pt-6 border-t bg-white sticky bottom-0 z-20 -mx-4 px-4 pb-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!selectedProfessional}
          style={selectedProfessional ? { backgroundColor: primaryColor } : {}}
          className="hover:opacity-90 disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
