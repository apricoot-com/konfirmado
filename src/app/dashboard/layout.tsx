import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <div className="flex">
        <DashboardNav />
        
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
