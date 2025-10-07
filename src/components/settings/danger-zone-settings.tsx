'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import type { Tenant } from '@prisma/client'

interface DangerZoneSettingsProps {
  tenant: Tenant
}

export function DangerZoneSettings({ tenant }: DangerZoneSettingsProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setError('')
    setIsDeleting(true)

    try {
      const response = await fetch('/api/tenant/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al eliminar la cuenta')
        setIsDeleting(false)
      } else {
        // Account deleted successfully - sign out and redirect
        await signOut({ redirect: false })
        router.push('/auth/login?deleted=true')
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
      setIsDeleting(false)
    }
  }

  const canDelete = password.length > 0 && confirmation === 'DELETE'

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Zona de Peligro</CardTitle>
        <CardDescription>
          Acciones irreversibles que afectan permanentemente tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showDeleteConfirm ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-900">Eliminar cuenta</h4>
                  <p className="text-sm text-red-800">
                    Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor asegúrate.
                  </p>
                  <ul className="text-sm text-red-800 space-y-1 mt-2">
                    <li>• Se eliminarán todos tus servicios</li>
                    <li>• Se eliminarán todos tus profesionales</li>
                    <li>• Se eliminarán todas las reservas (pasadas y futuras)</li>
                    <li>• Se eliminarán todos los links de agendamiento</li>
                    <li>• Se eliminarán todos los datos de pago</li>
                    <li>• Esta acción es <strong>permanente e irreversible</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">
                    ⚠️ Confirmación requerida
                  </h4>
                  <p className="text-sm text-red-800">
                    Esta acción eliminará permanentemente la cuenta <strong>{tenant.name}</strong> y
                    todos los datos asociados. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Confirma tu contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isDeleting}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Escribe <code className="bg-red-100 px-2 py-1 rounded text-red-900 font-mono">DELETE</code> para confirmar
              </Label>
              <Input
                id="confirmation"
                type="text"
                placeholder="DELETE"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                disabled={isDeleting}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                Debes escribir exactamente "DELETE" en mayúsculas
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setPassword('')
                  setConfirmation('')
                  setError('')
                }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
