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
    title: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
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
  )
}
