'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Lock, AlertCircle, Loader2 } from 'lucide-react'

export function PaymentMethodForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardHolder: '',
    expMonth: '',
    expYear: '',
    cvc: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Format card number with spaces
    if (e.target.name === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
    }
    
    // Limit exp month to 2 digits
    if (e.target.name === 'expMonth') {
      value = value.replace(/\D/g, '').slice(0, 2)
    }
    
    // Limit exp year to 2 digits
    if (e.target.name === 'expYear') {
      value = value.replace(/\D/g, '').slice(0, 2)
    }
    
    // Limit CVC to 3-4 digits
    if (e.target.name === 'cvc') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Validate
      const cardNumber = formData.cardNumber.replace(/\s/g, '')
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        throw new Error('Número de tarjeta inválido')
      }
      
      if (!formData.cardHolder.trim()) {
        throw new Error('Nombre del titular requerido')
      }
      
      if (!formData.expMonth || parseInt(formData.expMonth) < 1 || parseInt(formData.expMonth) > 12) {
        throw new Error('Mes de expiración inválido')
      }
      
      if (!formData.expYear || formData.expYear.length !== 2) {
        throw new Error('Año de expiración inválido')
      }
      
      if (formData.cvc.length < 3) {
        throw new Error('CVC inválido')
      }

      // Call API to tokenize
      const response = await fetch('/api/subscription/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber,
          cardHolder: formData.cardHolder,
          expMonth: formData.expMonth,
          expYear: formData.expYear,
          cvc: formData.cvc,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar método de pago')
      }

      // Success
      setSuccess(true)
      setFormData({
        cardNumber: '',
        cardHolder: '',
        expMonth: '',
        expYear: '',
        cvc: '',
      })
      
      // Reload page to show new payment method
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Pago seguro</h3>
            <p className="text-xs text-blue-800 mt-1">
              Tu información de pago es procesada de forma segura por Wompi. No almacenamos los datos completos de tu tarjeta.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CreditCard className="w-5 h-5" />
              <span className="font-medium text-sm">¡Método de pago guardado exitosamente!</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Número de Tarjeta</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              name="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleChange}
              maxLength={19}
              required
              disabled={isLoading}
              className="pl-10"
            />
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardHolder">Nombre del Titular</Label>
          <Input
            id="cardHolder"
            name="cardHolder"
            type="text"
            placeholder="JUAN PEREZ"
            value={formData.cardHolder}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="uppercase"
          />
          <p className="text-xs text-gray-500">Como aparece en la tarjeta</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expMonth">Mes</Label>
            <Input
              id="expMonth"
              name="expMonth"
              type="text"
              placeholder="MM"
              value={formData.expMonth}
              onChange={handleChange}
              maxLength={2}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expYear">Año</Label>
            <Input
              id="expYear"
              name="expYear"
              type="text"
              placeholder="YY"
              value={formData.expYear}
              onChange={handleChange}
              maxLength={2}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              name="cvc"
              type="text"
              placeholder="123"
              value={formData.cvc}
              onChange={handleChange}
              maxLength={4}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Tarjeta'
          )}
        </Button>
      </form>

      <p className="text-xs text-gray-500 text-center">
        Al guardar tu tarjeta, autorizas a Konfirmado a realizar cargos automáticos mensuales según tu plan de suscripción.
      </p>
    </div>
  )
}
