import { requireAuth } from '@/lib/tenant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandingSettings } from '@/components/settings/branding-settings'
import { IntegrationSettings } from '@/components/settings/integration-settings'
import { PaymentSettings } from '@/components/settings/payment-settings'
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
        <TabsList>
          <TabsTrigger value="branding">Marca</TabsTrigger>
          <TabsTrigger value="integration">Integración</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="danger" className="text-red-600">Zona de Peligro</TabsTrigger>
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

        <TabsContent value="danger">
          <DangerZoneSettings tenant={tenant} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
