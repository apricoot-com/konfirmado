import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { SUBSCRIPTION_PLANS, getTrialStatus } from '@/lib/subscriptions'
import { formatPrice } from '@/lib/utils'
import { Check, AlertCircle, CreditCard, Calendar, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>
}) {
  const { tenant } = await requireAuth()
  const params = await searchParams
  
  const currentPlan = SUBSCRIPTION_PLANS[tenant.subscriptionPlan]
  const trialStatus = getTrialStatus(tenant)
  
  // Get current usage
  const [professionalsCount, servicesCount] = await Promise.all([
    prisma.professional.count({ where: { tenantId: tenant.id, isActive: true } }),
    prisma.service.count({ where: { tenantId: tenant.id, isActive: true } }),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>
        <p className="text-gray-600 mt-2">Gestiona tu plan y facturación</p>
      </div>
      
      {/* Success/Pending Messages */}
      {params.upgrade === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">¡Suscripción activada!</h3>
              <p className="text-sm text-green-800 mt-1">
                Tu plan ha sido actualizado exitosamente.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {params.upgrade === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Pago en proceso</h3>
              <p className="text-sm text-blue-800 mt-1">
                Tu pago está siendo procesado. Te notificaremos cuando se complete (generalmente toma unos segundos).
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Plan Actual: {currentPlan.name}</h2>
            {trialStatus.isTrial ? (
              <div className="mt-2">
                {trialStatus.isExpired ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Trial expirado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {trialStatus.daysRemaining} día{trialStatus.daysRemaining !== 1 ? 's' : ''} restante{trialStatus.daysRemaining !== 1 ? 's' : ''} de trial
                    </span>
                  </div>
                )}
                {tenant.trialEndsAt && (
                  <p className="text-sm text-gray-600 mt-1">
                    Expira: {format(tenant.trialEndsAt, "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mt-1">
                {currentPlan.price > 0 ? `${formatPrice(currentPlan.price)}/mes` : 'Precio personalizado'}
              </p>
            )}
          </div>
          
          {tenant.paymentMethodMask && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              <span>•••• {tenant.paymentMethodMask}</span>
            </div>
          )}
        </div>
        
        {/* Usage Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profesionales</span>
              <span className="text-sm text-gray-600">
                {professionalsCount} / {currentPlan.limits.professionals}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (professionalsCount / currentPlan.limits.professionals) * 100)}%`,
                }}
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Servicios</span>
              <span className="text-sm text-gray-600">
                {servicesCount} / {currentPlan.limits.services}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, (servicesCount / currentPlan.limits.services) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Planes Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_PLANS)
            .filter(plan => plan.id !== 'trial')
            .map((plan) => {
              const isCurrent = tenant.subscriptionPlan === plan.id
              const isUpgrade = plan.price > currentPlan.price
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg border-2 p-6 ${
                    isCurrent ? 'border-blue-600' : 'border-gray-200'
                  }`}
                >
                  {isCurrent && (
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                      Plan Actual
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price > 0 ? (
                      <>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-gray-600">/mes</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">Contactar</span>
                    )}
                  </div>
                  
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                      >
                        Plan Actual
                      </button>
                    ) : plan.id === 'enterprise' ? (
                      <Link
                        href="mailto:sales@konfirmado.com"
                        className="block w-full px-4 py-2 bg-gray-900 text-white text-center rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        Contactar Ventas
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/subscription/checkout?plan=${plan.id}`}
                        className={`block w-full px-4 py-2 text-center rounded-lg font-medium transition-colors ${
                          isUpgrade
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {isUpgrade ? 'Actualizar Plan' : 'Cambiar Plan'}
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
      
      {/* Payment Method */}
      {!tenant.paymentMethodToken && tenant.subscriptionPlan !== 'trial' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Método de pago requerido</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Agrega un método de pago para renovaciones automáticas
              </p>
              <Link
                href="/dashboard/payment-methods"
                className="inline-block mt-3 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Agregar Método de Pago
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
