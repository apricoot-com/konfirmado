'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExportBookingsButtonProps {
  tenantId: string
}

export function ExportBookingsButton({ tenantId }: ExportBookingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [isExporting, setIsExporting] = useState(false)

  // Generate last 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: es }),
    }
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/bookings/export?month=${selectedMonth}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al exportar')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reservas-${selectedMonth}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('Error al exportar las reservas')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Exportar CSV</span>
        <span className="sm:hidden">Exportar</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Exportar Reservas</h3>
                <p className="text-xs text-gray-600">Selecciona el mes a exportar</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mes</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    {monthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={isExporting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleExport}
                  size="sm"
                  className="flex-1"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>Exportando...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      Exportar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
