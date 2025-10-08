import { PaymentProviderSettings } from './payment-provider-settings'
import type { Tenant } from '@prisma/client'

interface PaymentSettingsProps {
  tenant: Tenant
}

export function PaymentSettings({ tenant }: PaymentSettingsProps) {
  return <PaymentProviderSettings tenant={tenant} />
}
