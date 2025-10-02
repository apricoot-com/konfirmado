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
}

export function PaymentStep({
  linkId,
  bookingState,
  tenant,
  onBack,
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmar y pagar</h2>
        <p className="text-gray-600">Revisa tu reserva antes de continuar</p>
      </div>

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
        </div>
      </Card>

      {/* Payment placeholder */}
      <Card className="p-12 text-center">
        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pasarela de Pago (Wompi)
        </h3>
        <p className="text-gray-600 mb-6">
          La integración con Wompi se implementará en la Fase 2
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}
        
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
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
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          <ChevronLeft className="w-5 h-5 mr-2" />
          Atrás
        </Button>
      </div>
    </div>
  )
}
