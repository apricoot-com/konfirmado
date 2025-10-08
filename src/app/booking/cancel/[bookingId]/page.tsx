'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ bookingId: string }>
  searchParams: Promise<{ token?: string }>
}

export default function CancelBookingPage({ params, searchParams }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const [booking, setBooking] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const token = resolvedSearchParams.token
  
  useEffect(() => {
    if (!token) {
      setError('Invalid cancellation link')
      setIsLoading(false)
      return
    }
    
    // Fetch booking details
    fetchBooking()
  }, [token])
  
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
  
  const handleCancel = async () => {
    setIsCancelling(true)
    setError('')
    
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to cancel booking')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }
  
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
              {error || 'Invalid cancellation link'}
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
            <CardTitle className="text-2xl font-bold text-center">Reserva Cancelada</CardTitle>
            <CardDescription className="text-center">
              Tu reserva ha sido cancelada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-gray-600">
              <p>Recibirás un correo de confirmación en breve.</p>
              <p className="mt-2">No se realizará ningún cargo adicional.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Cancelar Reserva</CardTitle>
          <CardDescription className="text-center">
            ¿Estás seguro que deseas cancelar esta reserva?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {booking && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Servicio:</span>
                <p className="text-gray-900">{booking.service.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Profesional:</span>
                <p className="text-gray-900">{booking.professional.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Fecha y hora:</span>
                <p className="text-gray-900">
                  {format(new Date(booking.startTime), "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Esta acción no se puede deshacer. No se realizarán reembolsos.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push(`/booking/confirmation/${resolvedParams.bookingId}`)
              }
            }}
            disabled={isCancelling}
          >
            Volver
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelación'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
