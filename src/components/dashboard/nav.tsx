'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Link2,
  CreditCard,
  Settings,
  BarChart3,
  X,
  Zap,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Reservas',
    href: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    title: 'Servicios',
    href: '/dashboard/services',
    icon: Briefcase,
  },
  {
    title: 'Profesionales',
    href: '/dashboard/professionals',
    icon: Users,
  },
  {
    title: 'Links de Agendamiento',
    href: '/dashboard/links',
    icon: Link2,
  },
  {
    title: 'Métricas',
    href: '/dashboard/metrics',
    icon: BarChart3,
  },
  {
    title: 'Suscripción',
    href: '/dashboard/subscription',
    icon: Zap,
  },
  {
    title: 'Métodos de Pago',
    href: '/dashboard/payment-methods',
    icon: CreditCard,
  },
  {
    title: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

interface DashboardNavProps {
  isOpen?: boolean
  onClose?: () => void
}

export function DashboardNav({ isOpen = false, onClose }: DashboardNavProps) {
  const pathname = usePathname()
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
