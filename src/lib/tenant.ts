import { prisma } from './prisma'
import { auth } from './auth'

/**
 * Get tenant from subdomain or session
 */
export async function getTenantFromRequest(req: Request) {
  const hostname = req.headers.get('host')
  
  if (!hostname) {
    return null
  }
  
  // Extract subdomain (e.g., "cliente" from "cliente.konfirmado.com")
  const parts = hostname.split('.')
  
  // Check if we have a subdomain (more than 2 parts for domain.com)
  if (parts.length > 2) {
    const subdomain = parts[0]
    
    // Skip common subdomains
    if (subdomain !== 'www' && subdomain !== 'api') {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain },
      })
      
      if (tenant) {
        return tenant
      }
    }
  }
  
  // Fallback to session tenant
  const session = await auth()
  if (session?.user?.tenantId) {
    return await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
    })
  }
  
  return null
}

/**
 * Get tenant from session (for authenticated routes)
 */
export async function getTenantFromSession() {
  const session = await auth()
  
  if (!session?.user?.tenantId) {
    return null
  }
  
  return await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  })
}

/**
 * Require authenticated user with tenant
 */
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  })
  
  if (!tenant) {
    throw new Error('TENANT_NOT_FOUND')
  }
  
  return { user: session.user, tenant }
}
