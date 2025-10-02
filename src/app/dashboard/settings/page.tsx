import { requireAuth } from '@/lib/tenant'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BrandingSettings } from '@/components/settings/branding-settings'
import { IntegrationSettings } from '@/components/settings/integration-settings'

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
        </TabsList>

        <TabsContent value="branding">
          <BrandingSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="integration">
          <IntegrationSettings tenant={tenant} />
        </TabsContent>

        <TabsContent value="payments">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración de Wompi</h3>
            <p className="text-gray-600">Próximamente...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
