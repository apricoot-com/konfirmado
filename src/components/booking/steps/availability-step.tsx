'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'
import type { BookingState } from '../booking-wizard'

interface AvailabilityStepProps {
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  primaryColor: string
  currentStep: number
  totalSteps: number
}

interface TimeSlot {
  start: string
  end: string
}

export function AvailabilityStep({
  bookingState,
  updateBookingState,
  onNext,
  onBack,
  primaryColor,
  currentStep,
  totalSteps,
}: AvailabilityStepProps) {
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(
    bookingState.selectedSlot
  )
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    if (typeof window !== 'undefined') {
      let sid = sessionStorage.getItem('booking-session-id')
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('booking-session-id', sid)
      }
      return sid
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  useEffect(() => {
    loadAvailability()
  }, [currentDate])

  const loadAvailability = async () => {
    if (!bookingState.serviceId || !bookingState.professionalId) {
      setError('Información incompleta')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const startDate = currentDate
      const endDate = addDays(startDate, 7) // One week at a time

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: bookingState.professionalId,
          serviceId: bookingState.serviceId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cargar disponibilidad')
        setIsLoading(false)
        return
      }

      setSlots(data.slots || [])
    } catch (err) {
      setError('Error al cargar disponibilidad')
    } finally {
      setIsLoading(false)
    }
  }
  
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7))
  }
  
  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7))
  }

  const handleSlotSelect = async (slot: TimeSlot) => {
    setSelectedSlot(slot)
    
    // Create hold for this slot
    if (bookingState.serviceId && bookingState.professionalId) {
      try {
        const response = await fetch('/api/holds/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionalId: bookingState.professionalId,
            serviceId: bookingState.serviceId,
            startTime: slot.start,
            endTime: slot.end,
            sessionId,
          }),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          console.log('✓ Slot held:', data.holdId, 'expires in', data.expiresInSeconds, 'seconds')
          
          // Update booking state with hold ID
          updateBookingState({
            holdId: data.holdId,
          })
        } else {
          // Slot is already held or booked
          setError(data.error || 'Este horario ya no está disponible')
          setSelectedSlot(null)
          // Reload availability to get updated slots
          loadAvailability()
        }
      } catch (error) {
        console.error('Failed to create hold:', error)
        // Don't block the user, they can still try to book
      }
    }
  }

  const handleContinue = () => {
    if (selectedSlot) {
      updateBookingState({
        selectedSlot,
      })
      onNext()
    }
  }

  // Group slots by date (using Colombia timezone)
  const timezone = 'America/Bogota'
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = formatInTimeZone(new Date(slot.start), timezone, 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)
  
  // Sort dates to ensure correct order
  const sortedDates = Object.keys(slotsByDate).sort()

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-4">
        {/* Selected slot indicator */}
        {selectedSlot && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <p className="text-sm text-green-800 text-center">
              <span className="font-semibold">Seleccionado:</span>{' '}
              {formatInTimeZone(new Date(selectedSlot.start), timezone, "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
            </p>
          </div>
        )}
        
        {/* Week navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            disabled={isLoading || currentDate <= startOfDay(new Date())}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Semana anterior
          </Button>
          
          <span className="text-sm font-medium text-gray-700">
            {format(currentDate, "dd 'de' MMMM", { locale: es })} - {format(addDays(currentDate, 6), "dd 'de' MMMM", { locale: es })}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            disabled={isLoading}
          >
            Semana siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 mb-4">
        {isLoading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Cargando disponibilidad...</p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAvailability} variant="outline">
              Reintentar
            </Button>
          </Card>
        ) : Object.keys(slotsByDate).length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay disponibilidad
            </h3>
            <p className="text-gray-600">
              No hay horarios disponibles en esta semana. Intenta con otra semana.
            </p>
          </Card>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {sortedDates.map((date) => {
              const dateSlots = slotsByDate[date]
              // Parse date string correctly (YYYY-MM-DD) to avoid timezone issues
              const [year, month, day] = date.split('-').map(Number)
              const dateObj = new Date(year, month - 1, day)
              
              return (
                <div key={date}>
                  <h3 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2 z-10 border-b">
                    {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
                  </h3>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {dateSlots.map((slot, idx) => {
                      const isSelected =
                        selectedSlot?.start === slot.start &&
                        selectedSlot?.end === slot.end

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSlotSelect(slot)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'ring-2 ring-offset-2 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: primaryColor }
                              : {}
                          }
                        >
                          {formatInTimeZone(new Date(slot.start), timezone, 'HH:mm')}
                        </button>
                      )
                    })}
                  </div>
                </div>
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
            disabled={!selectedSlot}
            style={selectedSlot ? { backgroundColor: primaryColor } : {}}
            className="hover:opacity-90 disabled:opacity-50"
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
