export interface SubscriptionPlan {
  id: string
  name: string
  price: number // Monthly price in COP
  limits: {
    professionals: number
    services: number
    bookingsPerMonth: number
  }
  features: string[]
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: 0,
    limits: {
      professionals: 999999,
      services: 999999,
      bookingsPerMonth: 999999,
    },
    features: [
      'Profesionales ilimitados',
      'Servicios ilimitados',
      'Reservas ilimitadas',
      'Google Calendar',
      'Pagos con Wompi',
      'Soporte prioritario',
      'Sin restricciones',
    ],
  },
  trial: {
    id: 'trial',
    name: 'Trial',
    price: 0,
    limits: {
      professionals: 1,
      services: 3,
      bookingsPerMonth: 10,
    },
    features: [
      '1 profesional',
      '3 servicios',
      '10 reservas/mes',
      'Google Calendar',
      'Pagos con Wompi',
    ],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 49900, // $49.900 COP/mes
    limits: {
      professionals: 1,
      services: 10,
      bookingsPerMonth: 100,
    },
    features: [
      '1 profesional',
      '10 servicios',
      '100 reservas/mes',
      'Google Calendar',
      'Pagos con Wompi',
      'Soporte por email',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149900, // $149.900 COP/mes
    limits: {
      professionals: 5,
      services: 50,
      bookingsPerMonth: 500,
    },
    features: [
      '5 profesionales',
      '50 servicios',
      '500 reservas/mes',
      'Google Calendar',
      'Pagos con Wompi',
      'Branding personalizado',
      'Soporte prioritario',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    limits: {
      professionals: 999, // Configurable
      services: 999,
      bookingsPerMonth: 9999,
    },
    features: [
      'Profesionales ilimitados',
      'Servicios ilimitados',
      'Reservas ilimitadas',
      'Google Calendar',
      'Pagos con Wompi',
      'Branding personalizado',
      'Soporte 24/7',
      'Integraciones personalizadas',
    ],
  },
}

/**
 * Get plan details
 */
export function getPlan(planId: string): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.trial
}

/**
 * Check if tenant can add more professionals
 */
export function canAddProfessional(
  currentCount: number,
  plan: string
): { allowed: boolean; limit: number } {
  const planDetails = getPlan(plan)
  return {
    allowed: currentCount < planDetails.limits.professionals,
    limit: planDetails.limits.professionals,
  }
}

/**
 * Check if tenant can add more services
 */
export function canAddService(
  currentCount: number,
  plan: string
): { allowed: boolean; limit: number } {
  const planDetails = getPlan(plan)
  return {
    allowed: currentCount < planDetails.limits.services,
    limit: planDetails.limits.services,
  }
}

/**
 * Check if tenant is in trial and if trial has expired
 */
export function getTrialStatus(tenant: {
  subscriptionPlan: string
  subscriptionStatus: string
  trialEndsAt: Date | null
}): {
  isTrial: boolean
  isExpired: boolean
  daysRemaining: number
} {
  const isTrial = tenant.subscriptionPlan === 'trial'
  
  if (!isTrial || !tenant.trialEndsAt) {
    return { isTrial: false, isExpired: false, daysRemaining: 0 }
  }
  
  const now = new Date()
  const isExpired = tenant.trialEndsAt < now
  const daysRemaining = Math.max(
    0,
    Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  )
  
  return { isTrial, isExpired, daysRemaining }
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(tenant: {
  subscriptionStatus: string
  subscriptionPlan: string
  trialEndsAt: Date | null
  subscriptionEndsAt: Date | null
}): boolean {
  if (tenant.subscriptionStatus !== 'active') {
    return false
  }
  
  // Check trial expiration
  if (tenant.subscriptionPlan === 'trial' && tenant.trialEndsAt) {
    return tenant.trialEndsAt > new Date()
  }
  
  // Check subscription expiration
  if (tenant.subscriptionEndsAt) {
    return tenant.subscriptionEndsAt > new Date()
  }
  
  return true
}
