'use client'

import { useState } from 'react'
import { ServiceSelectionStep } from './steps/service-selection-step'
import { ProfessionalSelectionStep } from './steps/professional-selection-step'
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
  description: string | null
  imageUrl: string | null
  durationMinutes: number
  price: number
  chargeType: string
  confirmationMessage?: string | null
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
  // Calculate initial step based on preselected values
  const getInitialStep = () => {
    if (retryBooking) return 5
    if (preselectedServiceId && preselectedProfessionalId) return 3 // Skip service and professional selection
    if (preselectedServiceId) return 2 // Skip service selection
    return 1 // Start from beginning
  }

  const [currentStep, setCurrentStep] = useState(getInitialStep())
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
    setCurrentStep(prev => {
      const next = prev + 1
      // Skip steps that are already completed by preselection
      if (next === 1 && preselectedServiceId) return 2
      if (next === 2 && preselectedServiceId && preselectedProfessionalId) return 3
      return Math.min(next, 5)
    })
  }

  const goToPreviousStep = () => {
    setCurrentStep(prev => {
      const previous = prev - 1
      // Skip steps that are preselected
      if (previous === 1 && preselectedServiceId) return 1 // Can't go back before step 1
      if (previous === 2 && preselectedServiceId && preselectedProfessionalId) return 1 // Skip professional selection
      return Math.max(previous, 1)
    })
  }

  // Step titles and descriptions
  const stepInfo = {
    1: { title: 'Selecciona un servicio', description: 'Elige el servicio que necesitas' },
    2: { title: 'Selecciona un profesional', description: 'Elige quién te atenderá' },
    3: { title: 'Selecciona fecha y hora', description: 'Elige el horario que mejor te convenga' },
    4: { title: 'Tus datos', description: 'Completa tu información de contacto' },
    5: { title: 'Confirmar y pagar', description: 'Revisa tu reserva antes de continuar' },
  }

  // Apply tenant branding
  const brandingStyles = {
    '--primary-color': tenant.primaryColor,
    '--secondary-color': tenant.secondaryColor,
  } as React.CSSProperties

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-4 md:py-8" style={brandingStyles}>
      {/* Main content - Card wrapper */}
      <main className="w-full max-w-full md:max-w-3xl lg:max-w-4xl mx-auto px-2 md:px-4 flex-1 flex flex-col min-h-0">
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
          {/* Card Header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
            {/* Logo and Name */}
            <div className="flex flex-col items-center justify-center mb-4">
              {tenant.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-12 md:h-16 lg:h-20 object-contain max-w-full mb-2"
                />
              )}
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: tenant.primaryColor }}>
                {tenant.name}
              </h1>
            </div>
            
            {/* Step title and description */}
            <div className="text-center">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                {stepInfo[currentStep as keyof typeof stepInfo].title}
              </h2>
              <p className="text-sm text-gray-600">
                {stepInfo[currentStep as keyof typeof stepInfo].description}
              </p>
            </div>
          </div>

          {/* Card Content */}
          <div className="flex-1 flex flex-col min-h-0 px-4 md:px-6 py-4 md:py-6">
        {currentStep === 1 && (
          <ServiceSelectionStep
            services={services}
            bookingState={bookingState}
            updateBookingState={updateBookingState}
            onNext={goToNextStep}
            primaryColor={tenant.primaryColor}
            currentStep={currentStep}
            totalSteps={5}
            preselectedServiceId={preselectedServiceId}
            isReadOnly={!!preselectedServiceId}
          />
        )}

        {currentStep === 2 && (
          <div className="flex-1 flex flex-col min-h-0">
            <ProfessionalSelectionStep
              services={services}
              bookingState={bookingState}
              updateBookingState={updateBookingState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              primaryColor={tenant.primaryColor}
              currentStep={currentStep}
              totalSteps={5}
              preselectedProfessionalId={preselectedProfessionalId}
              isReadOnly={!!preselectedProfessionalId}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex-1 flex flex-col min-h-0">
            <AvailabilityStep
              bookingState={bookingState}
              updateBookingState={updateBookingState}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              primaryColor={tenant.primaryColor}
              currentStep={currentStep}
              totalSteps={5}
              services={services}
              professionals={professionals}
              isReadOnly={!!preselectedServiceId || !!preselectedProfessionalId}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex-1 flex flex-col min-h-0">
            <DetailsStep
            bookingState={bookingState}
            updateBookingState={updateBookingState}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
            primaryColor={tenant.primaryColor}
            tenant={tenant}
            currentStep={currentStep}
            totalSteps={5}
          />
          </div>
        )}

        {currentStep === 5 && (
          <PaymentStep
            linkId={linkId}
            bookingState={bookingState}
            tenant={tenant}
            onBack={goToPreviousStep}
            currentStep={currentStep}
            totalSteps={5}
          />
        )}
          </div>

          {/* Card Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 bg-gray-50">
            <p className="text-center text-xs md:text-sm text-gray-600">
              Powered by Konfirmado
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
