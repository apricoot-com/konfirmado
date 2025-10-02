import { requireAuth } from '@/lib/tenant'
import { PaymentMethodForm } from '@/components/payment/payment-method-form'
import { DeletePaymentMethodButton } from '@/components/payment/delete-payment-method-button'
import { CreditCard, Plus } from 'lucide-react'

export default async function PaymentMethodsPage() {
  const { tenant } = await requireAuth()
  
  const hasPaymentMethod = !!tenant.paymentMethodToken
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Métodos de Pago</h1>
        <p className="text-gray-600 mt-2">Gestiona tus tarjetas para renovaciones automáticas</p>
      </div>
      
      {/* Current Payment Method */}
      {hasPaymentMethod ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago Actual</h2>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {tenant.paymentMethodType || 'Tarjeta'}
                </div>
                <div className="text-sm text-gray-600">
                  •••• •••• •••• {tenant.paymentMethodMask}
                </div>
              </div>
            </div>
            
            <DeletePaymentMethodButton />
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Si eliminas tu método de pago, no podremos renovar tu suscripción automáticamente. 
              Deberás agregar uno nuevo antes de que expire tu plan.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">No tienes un método de pago</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Agrega una tarjeta para poder suscribirte a planes pagos y recibir renovaciones automáticas.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Add/Update Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          {hasPaymentMethod ? (
            <>
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Actualizar Método de Pago</h2>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Agregar Método de Pago</h2>
            </>
          )}
        </div>
        
        <PaymentMethodForm />
      </div>
    </div>
  )
}
