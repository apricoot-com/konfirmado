'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const PLANS: Record<string, any> = {
  basic: {
    name: 'Basic',
    price: 49900,
    features: ['1 profesional', '10 servicios', '100 reservas/mes', 'Google Calendar', 'Pagos con Wompi', 'Soporte por email'],
  },
  pro: {
    name: 'Pro',
    price: 149900,
    features: ['5 profesionales', '50 servicios', '500 reservas/mes', 'Google Calendar', 'Pagos con Wompi', 'Branding personalizado', 'Soporte prioritario'],
  },
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') || 'basic'
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  
  const plan = PLANS[planId]
  
  useEffect(() => {
    // Check if payment method exists
    fetch('/api/tenant')
      .then(res => res.json())
      .then(data => {
        console.log('Tenant data:', data)
        if (data.paymentMethodMask) {
          setPaymentMethod(data.paymentMethodMask)
          console.log('Payment method set:', data.paymentMethodMask)
        } else {
          console.log('No payment method found')
        }
      })
      .catch(err => {
        console.error('Error fetching tenant:', err)
      })
  }, [])
  
  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Plan no válido</h2>
          <Button onClick={() => router.push('/dashboard/subscription')}>
            Volver a Suscripción
          </Button>
        </Card>
      </div>
    )
  }
  
  const handleCheckout = async () => {
    if (!paymentMethod) {
      router.push('/dashboard/payment-methods')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago')
      }
      
      if (data.success) {
        router.push('/dashboard/subscription?upgrade=success')
      } else {
        setError('El pago está siendo procesado. Te notificaremos cuando se complete.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Confirmar Suscripción</h1>
        <p className="text-gray-600 mt-2">Revisa los detalles antes de continuar</p>
      </div>
      
      <Card className="p-6">
        <div className="space-y-6">
          {/* Plan Details */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
              <span className="text-gray-600">/mes</span>
            </div>
          </div>
          
          {/* Features */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Incluye:</h3>
            <ul className="space-y-3">
              {plan.features.map((feature: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Payment Method */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Método de pago:</h3>
            {paymentMethod ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">•••• {paymentMethod}</span>
                <button
                  onClick={() => router.push('/dashboard/payment-methods')}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-700"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Necesitas agregar un método de pago para continuar
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {/* Billing Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Se cobrará <strong>{formatPrice(plan.price)}</strong> hoy y luego mensualmente el mismo día.
              Puedes cancelar en cualquier momento.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/subscription')}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isLoading || !paymentMethod}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                `Confirmar y Pagar ${formatPrice(plan.price)}`
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
