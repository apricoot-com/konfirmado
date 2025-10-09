'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { Tenant } from '@prisma/client'

interface BillingSettingsProps {
  tenant: Tenant
}

type PersonType = 'natural' | 'juridica'
type DocumentType = 'NIT' | 'RUC' | 'CUIT' | 'DNI' | 'CC' | 'CE'

export function BillingSettings({ tenant }: BillingSettingsProps) {
  const billingInfo = ((tenant as any).billingInfo as any) || {}
  
  const [formData, setFormData] = useState({
    // Business Info
    businessName: billingInfo.businessName || '',
    personType: (billingInfo.personType as PersonType) || 'natural',
    documentType: (billingInfo.documentType as DocumentType) || 'NIT',
    fiscalId: billingInfo.fiscalId || '',
    
    // Contact
    email: billingInfo.email || '',
    phone: billingInfo.phone || '',
    
    // Address
    address: billingInfo.address || '',
    city: billingInfo.city || '',
    state: billingInfo.state || '',
    postalCode: billingInfo.postalCode || '',
    country: billingInfo.country || 'CO',
    
    // Financial
    currency: billingInfo.currency || 'COP',
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    try {
      const response = await fetch('/api/tenant/billing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al actualizar la información')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError('Ocurrió un error. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const countries = [
    { code: 'CO', name: 'Colombia' },
    { code: 'AR', name: 'Argentina' },
    { code: 'PE', name: 'Perú' },
    { code: 'CL', name: 'Chile' },
    { code: 'MX', name: 'México' },
    { code: 'EC', name: 'Ecuador' },
  ]

  const currencies = [
    { code: 'COP', name: 'Peso Colombiano (COP)' },
    { code: 'ARS', name: 'Peso Argentino (ARS)' },
    { code: 'PEN', name: 'Sol Peruano (PEN)' },
    { code: 'CLP', name: 'Peso Chileno (CLP)' },
    { code: 'MXN', name: 'Peso Mexicano (MXN)' },
    { code: 'USD', name: 'Dólar (USD)' },
  ]

  const documentTypes: { value: DocumentType; label: string; countries: string[] }[] = [
    { value: 'NIT', label: 'NIT (Número de Identificación Tributaria)', countries: ['CO'] },
    { value: 'RUC', label: 'RUC (Registro Único de Contribuyentes)', countries: ['PE', 'EC'] },
    { value: 'CUIT', label: 'CUIT (Clave Única de Identificación Tributaria)', countries: ['AR'] },
    { value: 'DNI', label: 'DNI (Documento Nacional de Identidad)', countries: ['AR', 'PE'] },
    { value: 'CC', label: 'CC (Cédula de Ciudadanía)', countries: ['CO'] },
    { value: 'CE', label: 'CE (Cédula de Extranjería)', countries: ['CO'] },
  ]

  // Filter document types based on selected country
  const availableDocTypes = documentTypes.filter(
    dt => dt.countries.includes(formData.country)
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Facturación</CardTitle>
        <CardDescription>
          Configura los datos fiscales de tu empresa para la emisión de facturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>Información actualizada exitosamente</span>
            </div>
          )}

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Datos de la Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Razón Social *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  placeholder="Mi Empresa S.A.S."
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personType">Tipo de Persona *</Label>
                <select
                  id="personType"
                  name="personType"
                  value={formData.personType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                >
                  <option value="natural">Persona Natural</option>
                  <option value="juridica">Persona Jurídica</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País *</Label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento *</Label>
                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                >
                  {availableDocTypes.map((docType) => (
                    <option key={docType.value} value={docType.value}>
                      {docType.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscalId">Número de Identificación Fiscal *</Label>
              <Input
                id="fiscalId"
                name="fiscalId"
                type="text"
                placeholder="900123456-7"
                value={formData.fiscalId}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Información de Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email de Facturación *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="facturacion@empresa.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Las facturas se enviarán a este correo
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Dirección Fiscal</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección Completa *</Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="Calle 123 #45-67, Oficina 890"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Bogotá"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Departamento/Estado</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="Cundinamarca"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  placeholder="110111"
                  value={formData.postalCode}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Configuración Financiera</h3>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda *</Label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Moneda en la que se emitirán las facturas
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar información'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
