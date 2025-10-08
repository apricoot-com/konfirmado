import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

/**
 * Check if the current user is a superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.email) return false
  
  const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return superadminEmails.includes(session.user.email)
}

/**
 * Require superadmin access or redirect to login
 */
export async function requireSuperAdmin() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/login')
  }
  
  const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  
  if (!superadminEmails.includes(session.user.email)) {
    redirect('/dashboard')
  }
  
  return session
}
