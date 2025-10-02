'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { BookingState } from '../booking-wizard'

interface AvailabilityStepProps {
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  primaryColor: string
}

export function AvailabilityStep({
  bookingState,
  updateBookingState,
  onNext,
  onBack,
  primaryColor,
}: AvailabilityStepProps) {
  // TODO: Implement calendar integration in Phase 1
  // For now, show placeholder
  
  const handleSlotSelect = () => {
    // Mock slot selection
    updateBookingState({
      selectedSlot: {
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      },
      holdId: 'mock-hold-id',
    })
    onNext()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona fecha y hora</h2>
        <p className="text-gray-600">Elige el horario que mejor te convenga</p>
      </div>

      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Calendario de Disponibilidad
        </h3>
        <p className="text-gray-600 mb-6">
          La integración con Google Calendar se implementará en la Fase 1
        </p>
        <Button
          onClick={handleSlotSelect}
          style={{ backgroundColor: primaryColor }}
          className="hover:opacity-90"
        >
          Continuar con horario de prueba
        </Button>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>
      </div>
    </div>
  )
}
