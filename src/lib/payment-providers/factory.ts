import { IPaymentProvider, PaymentConfig } from './types'
import { WompiProvider } from './wompi'
import { PayUProvider } from './payu'

/**
 * Payment Provider Factory
 * Creates the appropriate payment provider based on tenant configuration
 */
export function createPaymentProvider(config: PaymentConfig): IPaymentProvider {
  const isProduction = process.env.NODE_ENV === 'production'

  switch (config.provider) {
    case 'wompi':
      return new WompiProvider(config.credentials as any, isProduction)
    
    case 'payu':
      return new PayUProvider(config.credentials as any, isProduction)
    
    // Future providers
    case 'mercadopago':
      throw new Error('MercadoPago not implemented yet')
    
    default:
      throw new Error(`Unknown payment provider: ${config.provider}`)
  }
}

/**
 * Get payment provider from tenant
 */
export async function getPaymentProviderForTenant(
  tenantId: string
): Promise<IPaymentProvider> {
  const { prisma } = await import('@/lib/prisma')
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      paymentProvider: true,
      paymentConfig: true,
    },
  })

  if (!tenant || !tenant.paymentProvider || !tenant.paymentConfig) {
    throw new Error('Payment provider not configured for tenant')
  }

  const config: PaymentConfig = {
    provider: tenant.paymentProvider as any,
    credentials: tenant.paymentConfig as any,
  }

  return createPaymentProvider(config)
}
