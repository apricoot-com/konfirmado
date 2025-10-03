'use client'

import { useState } from 'react'
import { SelectionStep } from './steps/selection-step'
import { AvailabilityStep } from './steps/availability-step'
import { DetailsStep } from './steps/details-step'
import { PaymentStep } from './steps/payment-step'

interface Tenant {
  id: string
  name: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  privacyPolicyUrl: string | null
  termsUrl: string | null
}

interface Service {
  id: string
  name: string
  description: string
  imageUrl: string | null
  durationMinutes: number
  price: number
  chargeType: string
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

interface RetryBooking {
  id: string
  serviceId: string
  professionalId: string
  startTime: Date
  endTime: Date
  userName: string
  userEmail: string
  userPhone: string
  acceptedTerms: boolean
}

interface BookingWizardProps {
  linkId: string
  tenant: Tenant
  services: Service[]
  professionals: Professional[]
  preselectedServiceId?: string
  preselectedProfessionalId?: string
  retryBooking?: RetryBooking | null
}

export interface BookingState {
  serviceId: string | null
  professionalId: string | null
  selectedSlot: {
    start: string
    end: string
  } | null
  holdId: string | null
  userDetails: {
    name: string
    email: string
    phone: string
    acceptedTerms: boolean
  } | null
}

export function BookingWizard({
  linkId,
  tenant,
  services,
  professionals,
  preselectedServiceId,
  preselectedProfessionalId,
  retryBooking,
}: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(retryBooking ? 4 : 1)
  const [bookingState, setBookingState] = useState<BookingState>({
    serviceId: preselectedServiceId || null,
    professionalId: preselectedProfessionalId || null,
    selectedSlot: retryBooking ? {
      start: new Date(retryBooking.startTime).toISOString(),
      end: new Date(retryBooking.endTime).toISOString(),
    } : null,
    holdId: null,
    userDetails: retryBooking ? {
      name: retryBooking.userName,
      email: retryBooking.userEmail,
      phone: retryBooking.userPhone,
      acceptedTerms: retryBooking.acceptedTerms,
    } : null,
  })

  const updateBookingState = (updates: Partial<BookingState>) => {
    setBookingState(prev => ({ ...prev, ...updates }))
  }

  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  // Apply tenant branding
  const brandingStyles = {
    '--primary-color': tenant.primaryColor,
    '--secondary-color': tenant.secondaryColor,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-gray-50" style={brandingStyles}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {tenant.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold" style={{ color: tenant.primaryColor }}>
                {tenant.name}
              </h1>
            )}
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'text-white'
                      : step < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={
                    step === currentStep
                      ? { backgroundColor: tenant.primaryColor }
                      : {}
                  }
                >
                  {step < currentStep ? '✓' : step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <SelectionStep
            services={services}
            professionals={professionals}
            bookingState={bookingState}
            updateBookingState={updateBookingState}
            onNext={goToNextStep}
            primaryColor={tenant.primaryColor}
          />
        )}

        {currentStep === 2 && (
          <AvailabilityStep
            bookingState={bookingState}
            updateBookingState={updateBookingState}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            primaryColor={tenant.primaryColor}
          />
        )}

        {currentStep === 3 && (
          <DetailsStep
            bookingState={bookingState}
            updateBookingState={updateBookingState}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            primaryColor={tenant.primaryColor}
            tenant={tenant}
          />
        )}

        {currentStep === 4 && (
          <PaymentStep
            linkId={linkId}
            bookingState={bookingState}
            tenant={tenant}
            onBack={goToPreviousStep}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          Powered by Konfirmado
        </div>
      </footer>
    </div>
  )
}
