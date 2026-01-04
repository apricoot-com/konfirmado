'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, CreditCard, Loader2 } from 'lucide-react'
import type { BookingState } from '../booking-wizard'

interface Tenant {
  id: string
  name: string
}

interface PaymentStepProps {
  linkId: string
  bookingState: BookingState
  tenant: Tenant
  onBack: () => void
  currentStep: number
  totalSteps: number
}

export function PaymentStep({
  linkId,
  bookingState,
  tenant,
  onBack,
  currentStep,
  totalSteps,
}: PaymentStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setIsLoading(true)
    setError('')

    try {
      if (!bookingState.serviceId || !bookingState.professionalId || !bookingState.selectedSlot || !bookingState.userDetails) {
        setError('Información incompleta. Por favor completa todos los pasos.')
        setIsLoading(false)
        return
      }

      // Create booking and get Wompi checkout URL
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          serviceId: bookingState.serviceId,
          professionalId: bookingState.professionalId,
          startTime: bookingState.selectedSlot.start,
          endTime: bookingState.selectedSlot.end,
          userName: bookingState.userDetails.name,
          userEmail: bookingState.userDetails.email,
          userPhone: bookingState.userDetails.phone,
          acceptedTerms: bookingState.userDetails.acceptedTerms,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear la reserva')
        setIsLoading(false)
        return
      }

      // Redirect to Wompi checkout
      window.location.href = data.checkoutUrl
    } catch (err) {
      setError('Error al procesar el pago. Por favor intenta nuevamente.')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Resumen de tu reserva</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Servicio:</span>
            <span className="font-medium text-gray-900">Servicio seleccionado</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Profesional:</span>
            <span className="font-medium text-gray-900">Profesional seleccionado</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha y hora:</span>
            <span className="font-medium text-gray-900">
              {bookingState.selectedSlot 
                ? new Date(bookingState.selectedSlot.start).toLocaleString('es-CO')
                : 'No seleccionado'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Nombre:</span>
            <span className="font-medium text-gray-900">
              {bookingState.userDetails?.name}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">
              {bookingState.userDetails?.email}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Teléfono:</span>
            <span className="font-medium text-gray-900">
              {bookingState.userDetails?.phone}
            </span>
          </div>
          
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-gray-900">Total a pagar:</span>
              <span className="text-gray-900">$30.000 COP</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Anticipo del 25% - El resto se paga en la cita
            </p>
          </div>
          <Button
          onClick={handlePayment}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Proceder al pago
            </>
          )}
        </Button>
        </div>
      </Card>

      {/* Progress Bar */}
      <div className="pt-4 pb-3 border-t">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: '#3b82f6', // Blue color for payment step
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

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>
      </div>
    </div>
  )
}
