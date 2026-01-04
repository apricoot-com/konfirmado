'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import type { BookingState } from '../booking-wizard'

interface Tenant {
  privacyPolicyUrl: string | null
  termsUrl: string | null
}

interface DetailsStepProps {
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  primaryColor: string
  tenant: Tenant
  currentStep: number
  totalSteps: number
}

export function DetailsStep({
  bookingState,
  updateBookingState,
  onNext,
  onBack,
  primaryColor,
  tenant,
  currentStep,
  totalSteps,
}: DetailsStepProps) {
  const [formData, setFormData] = useState({
    name: bookingState.userDetails?.name || '',
    email: bookingState.userDetails?.email || '',
    phone: bookingState.userDetails?.phone || '',
    acceptedTerms: bookingState.userDetails?.acceptedTerms || false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePhoneChange = (value: string | undefined) => {
    setFormData(prev => ({
      ...prev,
      phone: value || '',
    }))
    // Clear error when user types
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correo electrónico inválido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Número de teléfono inválido'
    }

    if ((tenant.termsUrl || tenant.privacyPolicyUrl) && !formData.acceptedTerms) {
      newErrors.acceptedTerms = 'Debes aceptar los términos y condiciones'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    console.log('Continue button clicked', formData)
    if (validate()) {
      console.log('Validation passed')
      updateBookingState({
        userDetails: formData,
      })
      onNext()
    } else {
      console.log('Validation failed', errors)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 mb-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Juan Pérez"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono *</Label>
            <PhoneInput
              international
              defaultCountry="CO"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`flex h-10 w-full rounded-md border ${
                errors.phone ? 'border-red-500' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Selecciona tu país e ingresa tu número
            </p>
          </div>

          {(tenant.termsUrl || tenant.privacyPolicyUrl) && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Acepto{' '}
                  {tenant.termsUrl && (
                    <>
                      los{' '}
                      <a
                        href={tenant.termsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-900"
                        style={{ color: primaryColor }}
                      >
                        términos y condiciones
                      </a>
                    </>
                  )}
                  {tenant.termsUrl && tenant.privacyPolicyUrl && ' y '}
                  {tenant.privacyPolicyUrl && (
                    <>
                      la{' '}
                      <a
                        href={tenant.privacyPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-900"
                        style={{ color: primaryColor }}
                      >
                        política de privacidad
                      </a>
                    </>
                  )}
                  {' *'}
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.acceptedTerms}
                </p>
              )}
            </div>
          )}
        </div>
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
            type="button"
            onClick={handleContinue}
            style={{ backgroundColor: primaryColor }}
            className="hover:opacity-90 cursor-pointer"
          >
            Continuar al pago
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
