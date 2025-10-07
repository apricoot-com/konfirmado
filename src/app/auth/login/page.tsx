'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)

  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setAccountDeleted(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResendVerification(false)
    setResendSuccess(false)
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Login failed - check if it's because email is not verified
        const checkResponse = await fetch('/api/auth/check-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        
        if (checkResponse.ok) {
          const data = await checkResponse.json()
          if (!data.verified) {
            setError('Tu correo electrónico aún no ha sido verificado.')
            setShowResendVerification(true)
            return
          }
        }
        
        // Not an email verification issue - wrong credentials
        setError('Credenciales inválidas. Por favor verifica tu email y contraseña.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        setResendSuccess(true)
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Error al reenviar el correo de verificación')
      }
    } catch (error) {
      setError('Error al reenviar el correo de verificación')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Konfirmado</CardTitle>
          <CardDescription className="text-center">
            Ingresa a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {accountDeleted && (
              <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Cuenta eliminada exitosamente</span>
                </div>
                <p className="mt-1 text-xs text-green-700">
                  Tu cuenta y todos los datos asociados han sido eliminados permanentemente.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">{error}</span>
                </div>
                {showResendVerification && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-700 mb-2">
                      Revisa tu bandeja de entrada o spam. Si no recibiste el correo:
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="w-full text-red-700 border-red-300 hover:bg-red-100"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Reenviando...
                        </>
                      ) : (
                        'Reenviar correo de verificación'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {resendSuccess && (
              <div className="p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">¡Correo enviado!</span>
                </div>
                <p className="mt-1 text-xs text-green-700">
                  Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Regístrate
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
