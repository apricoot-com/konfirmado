'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, ArrowLeft, Crown } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

const PLANS = [
  {
    id: 'unlimited',
    name: 'Unlimited',
    description: 'Sin restricciones - Para cuentas especiales',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    icon: '👑',
  },
  {
    id: 'trial',
    name: 'Trial',
    description: '1 profesional, 3 servicios, 10 reservas/mes',
    color: 'bg-yellow-500',
    icon: '🎯',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: '1 profesional, 10 servicios, 100 reservas/mes',
    color: 'bg-blue-500',
    icon: '📦',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '5 profesionales, 50 servicios, 500 reservas/mes',
    color: 'bg-purple-500',
    icon: '🚀',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '20 profesionales, 200 servicios, 2000 reservas/mes',
    color: 'bg-gray-800',
    icon: '🏢',
  },
]

export default function ChangePlanPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const tenantId = resolvedParams.id
  
  const [tenant, setTenant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    loadTenant()
  }, [tenantId])
  
  const loadTenant = async () => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}`)
      if (!response.ok) throw new Error('Failed to load tenant')
      
      const data = await response.json()
      setTenant(data)
    } catch (err) {
      setError('Error al cargar tenant')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleChangePlan = async (planId: string) => {
    setError('')
    setSuccess(false)
    setIsChanging(true)
    
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/set-plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al cambiar plan')
      }
      
      setSuccess(true)
      setTimeout(() => {
        router.push(`/superadmin/tenants/${tenantId}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsChanging(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/superadmin/tenants/${tenantId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cambiar Plan</h1>
              <p className="text-sm text-gray-600 mt-1">
                {tenant?.name} - Plan actual: <span className="font-medium">{tenant?.subscriptionPlan}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span>Plan actualizado exitosamente. Redirigiendo...</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = tenant?.subscriptionPlan === plan.id
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Plan actual
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-lg ${plan.color} flex items-center justify-center text-2xl`}>
                      {plan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Button
                    onClick={() => handleChangePlan(plan.id)}
                    disabled={isChanging || isCurrentPlan}
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                  >
                    {isChanging ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : isCurrentPlan ? (
                      'Plan actual'
                    ) : (
                      `Cambiar a ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            ℹ️ Sobre el plan Unlimited
          </h4>
          <p className="text-sm text-blue-800">
            El plan <strong>Unlimited</strong> es especial para cuentas internas, partners o casos especiales. 
            No tiene restricciones y no genera cargos automáticos.
          </p>
        </div>
      </div>
    </div>
  )
}
