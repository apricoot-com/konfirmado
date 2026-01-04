'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, User, CheckCircle2 } from 'lucide-react'
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
  currentStep: number
  totalSteps: number
}

export function ProfessionalSelectionStep({
  services,
  bookingState,
  updateBookingState,
  onNext,
  onBack,
  primaryColor,
  currentStep,
  totalSteps,
}: ProfessionalSelectionStepProps) {
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(
    bookingState.professionalId
  )

  // Get professionals for selected service
  const selectedService = services.find(s => s.id === bookingState.serviceId)
  const availableProfessionals = selectedService?.professionals.map(sp => sp.professional) || []

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const isSelected = (professionalId: string) => selectedProfessional === professionalId

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
          <div className="grid grid-cols-1 pt-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20 px-2 md:px-4">
            {availableProfessionals.map((professional) => {
              const selected = isSelected(professional.id)
              return (
                <Card
                  key={professional.id}
                  className={`relative p-4 md:p-5 cursor-pointer transition-all max-w-sm mx-auto w-full ${
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
                  onClick={() => setSelectedProfessional(professional.id)}
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

                  {/* Photo */}
                  <div className="flex flex-col items-center mb-4">
                    {professional.photoUrl ? (
                      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 ring-2 ring-gray-200">
                        <img
                          src={professional.photoUrl}
                          alt={professional.name}
                          className="w-full h-full object-cover"
                        />
                        {selected && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{ backgroundColor: hexToRgba(primaryColor, 0.1) }}
                          />
                        )}
                      </div>
                    ) : (
                      <div
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mb-3 ring-2 ring-gray-200"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {professional.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2 text-center">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 leading-tight">
                      {professional.name}
                    </h3>
                    
                    {professional.description && (
                      <p className="text-gray-600 text-sm line-clamp-3 min-h-[3rem]">
                        {professional.description}
                      </p>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer - Sticky */}
      <div className="flex-shrink-0 border-t bg-white sticky bottom-0 z-20 -mx-4 px-4">
        {/* Progress Bar */}
        <div className="pt-4 pb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-gray-600">
              Paso {currentStep} de {totalSteps}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between pb-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Atrás
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!selectedProfessional}
            style={selectedProfessional ? { backgroundColor: primaryColor } : {}}
            className="hover:opacity-90 disabled:opacity-50 transition-all"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
