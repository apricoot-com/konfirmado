import { requireAuth } from '@/lib/tenant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandingSettings } from '@/components/settings/branding-settings'
import { IntegrationSettings } from '@/components/settings/integration-settings'
import { PaymentSettings } from '@/components/settings/payment-settings'
import { BillingSettings } from '@/components/settings/billing-settings'
import { PasswordSettings } from '@/components/settings/password-settings'
import { DangerZoneSettings } from '@/components/settings/danger-zone-settings'

export default async function SettingsPage() {
  const { tenant } = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-2">Gestiona la configuración de tu cuenta</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="h-auto sm:h-12 p-1 bg-gray-100 w-full grid grid-cols-2 sm:grid-cols-3 lg:flex lg:w-fit gap-1">
          <TabsTrigger value="branding" className="h-10 md:px-6 text-sm sm:text-base">
            Marca
          </TabsTrigger>
          <TabsTrigger value="integration" className="h-10 md:px-6 text-sm sm:text-base">
            Integración
          </TabsTrigger>
          <TabsTrigger value="payments" className="h-10 md:px-6 text-sm sm:text-base">
            Pagos
          </TabsTrigger>
          <TabsTrigger value="billing" className="h-10 md:px-6 text-sm sm:text-base">
            Facturación
          </TabsTrigger>
          <TabsTrigger value="security" className="h-10 md:px-6 text-sm sm:text-base">
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="danger" className="h-10 md:px-6 text-sm sm:text-base text-red-600 data-[state=active]:text-red-700">
            Zona de Peligro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <BrandingSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="integration">
          <IntegrationSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="security">
          <PasswordSettings />
        </TabsContent>

        <TabsContent value="danger">
          <DangerZoneSettings tenant={tenant} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
