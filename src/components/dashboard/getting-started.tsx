'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Play, BookOpen, X } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface GettingStartedProps {
  stats: {
    hasServices: boolean
    hasProfessionals: boolean
    hasConnectedCalendar: boolean
    hasPaymentConfig: boolean
    hasBookingLinks: boolean
    hasBranding: boolean
  }
}

export function GettingStarted({ stats }: GettingStartedProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const steps = [
    {
      id: 'branding',
      title: 'Configura tu marca',
      description: 'Logo, colores y nombre de tu empresa',
      completed: stats.hasBranding,
      href: '/dashboard/settings',
    },
    {
      id: 'service',
      title: 'Crea tu primer servicio',
      description: 'Define qué servicios ofreces',
      completed: stats.hasServices,
      href: '/dashboard/services/new',
    },
    {
      id: 'professional',
      title: 'Agrega un profesional',
      description: 'Añade el personal que atenderá las citas',
      completed: stats.hasProfessionals,
      href: '/dashboard/professionals/new',
    },
    {
      id: 'calendar',
      title: 'Conecta Google Calendar',
      description: 'Sincroniza disponibilidad automáticamente',
      completed: stats.hasConnectedCalendar,
      href: '/dashboard/professionals',
    },
    {
      id: 'payment',
      title: 'Configura pagos con Wompi',
      description: 'Recibe pagos por adelantado',
      completed: stats.hasPaymentConfig,
      href: '/dashboard/payment-methods',
    },
    {
      id: 'link',
      title: 'Genera tu primer link',
      description: 'Crea un link de agendamiento para compartir',
      completed: stats.hasBookingLinks,
      href: '/dashboard/links/new',
    },
  ]

  const completedSteps = steps.filter(s => s.completed).length
  const totalSteps = steps.length
  const progress = Math.round((completedSteps / totalSteps) * 100)
  const isComplete = completedSteps === totalSteps
  const hasNoProgress = completedSteps === 0

  // Auto-open video modal for brand new users (only once)
  useEffect(() => {
    const hasSeenVideo = localStorage.getItem('konfirmado_seen_intro_video')
    
    if (hasNoProgress && !hasSeenVideo) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => {
        setShowVideoModal(true)
        localStorage.setItem('konfirmado_seen_intro_video', 'true')
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [hasNoProgress])

  // Don't show if dismissed or complete
  if (isDismissed || isComplete) {
    return null
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🚀 Comienza a usar Konfirmado
            </CardTitle>
            <CardDescription className="mt-2">
              Completa estos pasos para empezar a recibir reservas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso</span>
            <span className="font-medium text-blue-600">{completedSteps}/{totalSteps} completados</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Steps */}
        {steps.map((step, index) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.completed
                ? 'bg-green-50 border border-green-200'
                : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.completed ? 'text-green-900' : 'text-gray-900'
              }`}>
                {step.title}
              </p>
              <p className={`text-xs ${
                step.completed ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.description}
              </p>
            </div>
            {!step.completed && (
              <span className="text-xs text-blue-600 font-medium">
                Configurar →
              </span>
            )}
          </Link>
        ))}

        {/* Resources */}
        <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVideoModal(true)}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Ver tutorial (3 min)
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1"
          >
            <Link href="/docs">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentación
            </Link>
          </Button>
        </div>
      </CardContent>

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Video Container */}
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/2wYHi0KoqLk?autoplay=1"
                title="Konfirmado Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                ¿Necesitas ayuda? Escríbenos a <a href="mailto:support@konfirmado.com" className="text-blue-600 hover:text-blue-700">support@konfirmado.com</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
