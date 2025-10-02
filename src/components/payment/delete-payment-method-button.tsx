'use client'

import { Trash2 } from 'lucide-react'

export function DeletePaymentMethodButton() {
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este método de pago?')) {
      return
    }
    
    try {
      const response = await fetch('/api/subscription/payment-method', {
        method: 'DELETE',
      })
      
      if (response.ok) {
        window.location.reload()
      } else {
        alert('Error al eliminar método de pago')
      }
    } catch (error) {
      alert('Error al eliminar método de pago')
    }
  }
  
  return (
    <button
      type="button"
      onClick={handleDelete}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <Trash2 className="w-4 h-4" />
      Eliminar
    </button>
  )
}
