'use client'

import { signOut } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    email?: string | null
    name?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Konfirmado</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
