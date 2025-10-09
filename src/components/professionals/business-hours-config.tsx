'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface DayHours {
  start: string
  end: string
}

interface BusinessHours {
  monday: DayHours | null
  tuesday: DayHours | null
  wednesday: DayHours | null
  thursday: DayHours | null
  friday: DayHours | null
  saturday: DayHours | null
  sunday: DayHours | null
}

interface BusinessHoursConfigProps {
  businessHours: BusinessHours
  onChange: (hours: BusinessHours) => void
}

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const

export function BusinessHoursConfig({ businessHours, onChange }: BusinessHoursConfigProps) {
  const handleToggleDay = (day: keyof BusinessHours) => {
    const newHours = { ...businessHours }
    if (newHours[day]) {
      newHours[day] = null // Close this day
    } else {
      newHours[day] = { start: '09:00', end: '18:00' } // Open with default hours
    }
    onChange(newHours)
  }

  const handleTimeChange = (day: keyof BusinessHours, field: 'start' | 'end', value: string) => {
    const newHours = { ...businessHours }
    if (newHours[day]) {
      newHours[day] = {
        ...newHours[day]!,
        [field]: value,
      }
      onChange(newHours)
    }
  }

  const applyToAll = () => {
    const template = businessHours.monday || { start: '09:00', end: '18:00' }
    const newHours = { ...businessHours }
    DAYS.forEach(({ key }) => {
      if (key !== 'saturday' && key !== 'sunday') {
        newHours[key] = { ...template }
      }
    })
    onChange(newHours)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Horario de atención</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={applyToAll}
        >
          Copiar Lunes
        </Button>
      </div>

      <div className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const dayHours = businessHours[key]
          const isOpen = dayHours !== null

          return (
            <div key={key} className="flex flex-wrap items-center gap-4 border border-gray-100 p-2">
              <div className="w-32">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={() => handleToggleDay(key)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              </div>

              {isOpen ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col">
                    <Label htmlFor={`${key}-start`} className="text-sm text-gray-600 whitespace-nowrap">
                      Desde
                    </Label>
                    <Input
                      id={`${key}-start`}
                      type="time"
                      value={dayHours!.start}
                      onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <div className="flex flex-col">
                    <Label htmlFor={`${key}-end`} className="text-sm text-gray-600 whitespace-nowrap">
                      Hasta
                    </Label>
                    <Input
                      id={`${key}-end`}
                      type="time"
                      value={dayHours!.end}
                      onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-500 italic">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los horarios configurados aquí se combinan con tu calendario de Google
          para mostrar solo los espacios disponibles dentro de tu horario de atención.
        </p>
      </div>
    </Card>
  )
}
