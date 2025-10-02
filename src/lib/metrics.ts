import { prisma } from './prisma'

export type MetricName = 
  | 'conversion_funnel'
  | 'webhook_latency'
  | 'oauth_failure'
  | 'callback_latency'
  | 'booking_created'
  | 'payment_success'
  | 'payment_failure'

interface MetricParams {
  tenantId: string
  name: MetricName
  value: number
  metadata?: Record<string, any>
}

/**
 * Records a metric
 */
export async function recordMetric(params: MetricParams): Promise<void> {
  try {
    await prisma.metric.create({
      data: {
        tenantId: params.tenantId,
        name: params.name,
        value: params.value,
        metadata: params.metadata || {},
      }
    })
  } catch (error) {
    console.error('Failed to record metric:', error)
  }
}

/**
 * Get metrics for a tenant
 */
export async function getMetrics(
  tenantId: string,
  name: MetricName,
  from: Date,
  to: Date
) {
  return await prisma.metric.findMany({
    where: {
      tenantId,
      name,
      timestamp: {
        gte: from,
        lte: to,
      }
    },
    orderBy: { timestamp: 'asc' },
  })
}

/**
 * Calculate percentiles for latency metrics
 */
export function calculatePercentiles(values: number[]): {
  p50: number
  p95: number
  p99: number
  avg: number
} {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0 }
  }
  
  const sorted = [...values].sort((a, b) => a - b)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  
  return {
    p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    avg,
  }
}

/**
 * Track conversion funnel step
 */
export async function trackConversionStep(
  tenantId: string,
  step: 'service_selected' | 'slot_selected' | 'details_entered' | 'payment_initiated' | 'payment_approved',
  metadata?: Record<string, any>
): Promise<void> {
  await recordMetric({
    tenantId,
    name: 'conversion_funnel',
    value: 1,
    metadata: { step, ...metadata },
  })
}
