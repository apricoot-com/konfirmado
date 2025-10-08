'use client'

import { useState } from 'react'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'

interface DashboardLayoutClientProps {
  user: {
    email?: string | null
    name?: string | null
  }
  isSuperAdmin?: boolean
  children: React.ReactNode
}

export function DashboardLayoutClient({ user, isSuperAdmin = false, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        user={user} 
        isSuperAdmin={isSuperAdmin}
        onMenuClick={() => setIsMobileMenuOpen(true)} 
      />
      
      <div className="flex">
        <DashboardNav 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
          isSuperAdmin={isSuperAdmin}
        />
        
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
