import { prisma } from './prisma'

export type AuditAction = 
  | 'link_created'
  | 'link_updated'
  | 'link_deleted'
  | 'calendar_connected'
  | 'calendar_disconnected'
  | 'payment_attempted'
  | 'payment_approved'
  | 'payment_declined'
  | 'payment_method_added'
  | 'payment_method_updated'
  | 'callback_sent'
  | 'callback_failed'
  | 'booking_created'
  | 'booking_cancelled'
  | 'service_created'
  | 'service_updated'
  | 'professional_created'
  | 'professional_updated'
  | 'subscription_upgraded'
  | 'subscription_renewed'

export type EntityType = 
  | 'booking_link'
  | 'professional'
  | 'booking'
  | 'payment'
  | 'service'
  | 'tenant'

interface AuditLogParams {
  tenantId: string
  userId?: string
  action: AuditAction
  entityType: EntityType
  entityId: string
  metadata?: Record<string, any>
  req?: Request
}

/**
 * Creates an audit log entry
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
        ipAddress: params.req?.headers.get('x-forwarded-for') || 
                   params.req?.headers.get('x-real-ip') || null,
        userAgent: params.req?.headers.get('user-agent') || null,
      }
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Query audit logs for a tenant
 */
export async function getAuditLogs(
  tenantId: string,
  filters?: {
    action?: AuditAction
    entityType?: EntityType
    entityId?: string
    userId?: string
    from?: Date
    to?: Date
    limit?: number
  }
) {
  const where: any = { tenantId }
  
  if (filters?.action) where.action = filters.action
  if (filters?.entityType) where.entityType = filters.entityType
  if (filters?.entityId) where.entityId = filters.entityId
  if (filters?.userId) where.userId = filters.userId
  
  if (filters?.from || filters?.to) {
    where.createdAt = {}
    if (filters.from) where.createdAt.gte = filters.from
    if (filters.to) where.createdAt.lte = filters.to
  }
  
  return await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 100,
  })
}
