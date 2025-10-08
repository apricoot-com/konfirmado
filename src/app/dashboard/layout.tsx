import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { isSuperAdmin } from '@/lib/superadmin'
import { DashboardLayoutClient } from '@/components/dashboard/layout-client'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  const isSuper = await isSuperAdmin()
  
  return <DashboardLayoutClient user={session.user} isSuperAdmin={isSuper}>{children}</DashboardLayoutClient>
}
