'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no encontrado')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error || 'Error al verificar el correo')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Ocurrió un error. Por favor intenta nuevamente.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold text-center">
            {status === 'loading' && 'Verificando...'}
            {status === 'success' && '¡Email Verificado!'}
            {status === 'error' && 'Error de Verificación'}
          </CardTitle>
          
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        
        {status !== 'loading' && (
          <CardFooter className="flex flex-col gap-2">
            {status === 'success' && (
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Ir al inicio de sesión
              </Button>
            )}
            
            {status === 'error' && (
              <>
                <Button
                  onClick={() => router.push('/auth/register')}
                  className="w-full"
                >
                  Volver al registro
                </Button>
                <Link
                  href="/auth/login"
                  className="text-sm text-center text-blue-600 hover:text-blue-700"
                >
                  ¿Ya verificaste tu cuenta? Inicia sesión
                </Link>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
