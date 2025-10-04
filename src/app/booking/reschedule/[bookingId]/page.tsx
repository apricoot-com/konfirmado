'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfDay } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { es } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ bookingId: string }>
  searchParams: Promise<{ token?: string }>
}

interface TimeSlot {
  start: string
  end: string
}

export default function RescheduleBookingPage({ params, searchParams }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const token = resolvedSearchParams.token
  const timezone = 'America/Bogota'
  
  useEffect(() => {
    if (!token) {
      setError('Invalid reschedule link')
      setIsLoading(false)
      return
    }
    
    fetchBooking()
  }, [token])
  
  useEffect(() => {
    if (booking) {
      fetchAvailability()
    }
  }, [booking, currentDate])
  
  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.bookingId}?token=${token}`)
      const data = await response.json()
      
      if (response.ok) {
        setBooking(data.booking)
      } else {
        setError(data.error || 'Booking not found')
      }
    } catch (error) {
      setError('Failed to load booking')
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchAvailability = async () => {
    if (!booking) return
    
    setLoadingSlots(true)
    try {
      const startDate = currentDate.toISOString()
      const endDate = addDays(currentDate, 7).toISOString()
      
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: booking.professional.id,
          serviceId: booking.service.id,
          startDate,
          endDate,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSlots(data.slots || [])
      } else {
        setError(data.error || 'Failed to load availability')
      }
    } catch (error) {
      setError('Failed to load availability')
    } finally {
      setLoadingSlots(false)
    }
  }
  
  const handleReschedule = async () => {
    if (!selectedSlot) return
    
    setIsRescheduling(true)
    setError('')
    
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.bookingId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to reschedule booking')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsRescheduling(false)
    }
  }
  
  const goToPreviousWeek = () => {
    setCurrentDate(prev => addDays(prev, -7))
  }
  
  const goToNextWeek = () => {
    setCurrentDate(prev => addDays(prev, 7))
  }
  
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    const date = formatInTimeZone(new Date(slot.start), timezone, 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  if (!token || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Error</CardTitle>
            <CardDescription className="text-center">
              {error || 'Invalid reschedule link'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">¡Reserva Reagendada!</CardTitle>
            <CardDescription className="text-center">
              Tu reserva ha sido reagendada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-gray-600">
              <p>Recibirás un correo de confirmación con los nuevos detalles.</p>
              {selectedSlot && (
                <p className="mt-4 font-semibold text-gray-900">
                  Nueva fecha: {formatInTimeZone(new Date(selectedSlot.start), timezone, "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Reagendar Reserva</CardTitle>
                <CardDescription>Selecciona una nueva fecha y hora</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Current booking info */}
            {booking && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Reserva actual:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Servicio:</span>
                    <p className="font-medium">{booking.service.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fecha actual:</span>
                    <p className="font-medium">
                      {formatInTimeZone(new Date(booking.startTime), timezone, "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Selected slot */}
            {selectedSlot && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Nueva fecha seleccionada:</span>{' '}
                  {formatInTimeZone(new Date(selectedSlot.start), timezone, "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            )}
            
            {/* Week navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousWeek}
                disabled={loadingSlots || currentDate <= startOfDay(new Date())}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Semana anterior
              </Button>
              
              <span className="text-sm font-medium text-gray-700">
                {format(currentDate, "dd 'de' MMMM", { locale: es })} - {format(addDays(currentDate, 6), "dd 'de' MMMM", { locale: es })}
              </span>
              
              <Button
                variant="outline"
                onClick={goToNextWeek}
                disabled={loadingSlots}
              >
                Semana siguiente
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            {/* Available slots */}
            {loadingSlots ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : slots.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay horarios disponibles
                </h3>
                <p className="text-gray-600">
                  Intenta con otra semana
                </p>
              </Card>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date}>
                    <h3 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2 z-10 border-b">
                      {formatInTimeZone(new Date(date), timezone, "EEEE, dd 'de' MMMM", { locale: es })}
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {dateSlots.map((slot, idx) => {
                        const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {formatInTimeZone(new Date(slot.start), timezone, 'HH:mm')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isRescheduling}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleReschedule}
                disabled={!selectedSlot || isRescheduling}
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reagendando...
                  </>
                ) : (
                  'Confirmar Reagendamiento'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
