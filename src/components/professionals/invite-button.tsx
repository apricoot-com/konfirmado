'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Check, Copy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface InviteButtonProps {
  professionalId: string
  status: string
}

export function InviteButton({ professionalId, status }: InviteButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [connectionUrl, setConnectionUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleInvite = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/professionals/${professionalId}/invite`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setConnectionUrl(data.connectionUrl)
        setShowDialog(true)
      } else {
        alert(data.error || 'Error al generar invitación')
      }
    } catch (error) {
      alert('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(connectionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        onClick={handleInvite}
        disabled={isLoading}
        className={`flex-1 ${status === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {status === 'error' ? 'Reconectar' : 'Enviar Invitación'}
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de Conexión Generado</DialogTitle>
            <DialogDescription>
              Comparte este link con el profesional para que conecte su calendario de Google
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Link de conexión:</p>
              <code className="block text-xs font-mono text-gray-900 break-all">
                {connectionUrl}
              </code>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Este link expira en 7 días. El profesional debe usarlo para conectar su Google Calendar.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
