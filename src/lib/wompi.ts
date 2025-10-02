import crypto from 'crypto'
import { decrypt } from './encryption'

interface WompiConfig {
  publicKey: string
  privateKey: string
  integritySecret: string
  eventsSecret: string
  mode: 'test' | 'production'
}

/**
 * Get Wompi API base URL based on environment
 */
function getWompiBaseUrl(): string {
  // Use sandbox in development or if using test keys
  const isDev = process.env.NODE_ENV === 'development'
  return isDev ? 'https://sandbox.wompi.co/v1' : 'https://production.wompi.co/v1'
}

/**
 * Get platform Wompi credentials (for subscription payments)
 * These are YOUR Wompi credentials, not the tenant's
 */
export function getPlatformWompiConfig(): WompiConfig | null {
  const publicKey = process.env.PLATFORM_WOMPI_PUBLIC_KEY
  const privateKey = process.env.PLATFORM_WOMPI_PRIVATE_KEY
  const integritySecret = process.env.PLATFORM_WOMPI_INTEGRITY_SECRET
  const eventsSecret = process.env.PLATFORM_WOMPI_EVENTS_SECRET

  if (!publicKey || !privateKey || !integritySecret || !eventsSecret) {
    return null
  }

  return {
    publicKey,
    privateKey,
    integritySecret,
    eventsSecret,
    mode: process.env.NODE_ENV === 'development' ? 'test' : 'production',
  }
}

interface CreateCheckoutParams {
  reference: string
  amountInCents: number
  currency: 'COP'
  customerEmail: string
  redirectUrl: string
  integritySecret: string
}

/**
 * Generate Wompi integrity signature
 * Format: SHA256(reference + amount + currency + integritySecret)
 */
export function generateIntegritySignature({
  reference,
  amountInCents,
  currency,
  integritySecret,
}: Omit<CreateCheckoutParams, 'customerEmail' | 'redirectUrl'>): string {
  const concatenated = `${reference}${amountInCents}${currency}${integritySecret}`
  return crypto.createHash('sha256').update(concatenated).digest('hex')
}

/**
 * Generate Wompi checkout URL
 */
export function generateCheckoutUrl({
  reference,
  amountInCents,
  currency,
  customerEmail,
  redirectUrl,
  integritySecret,
  publicKey,
}: CreateCheckoutParams & { publicKey: string }): string {
  const signature = generateIntegritySignature({
    reference,
    amountInCents,
    currency,
    integritySecret,
  })

  const params = new URLSearchParams({
    'public-key': publicKey,
    currency,
    'amount-in-cents': amountInCents.toString(),
    reference,
    'signature:integrity': signature,
    'redirect-url': redirectUrl,
    'customer-data:email': customerEmail,
  })

  return `https://checkout.wompi.co/p/?${params.toString()}`
}

/**
 * Verify webhook signature
 * Format: SHA256(data.values + timestamp + eventsSecret)
 */
export function verifyWebhookSignature(
  eventData: any,
  timestamp: number,
  checksum: string,
  eventsSecret: string
): boolean {
  try {
    // Extract values from properties array
    const properties = eventData.signature?.properties || []
    let concatenated = ''
    
    for (const prop of properties) {
      const keys = prop.split('.')
      let value = eventData.data
      
      for (const key of keys) {
        value = value?.[key]
      }
      
      if (value !== undefined && value !== null) {
        concatenated += value.toString()
      }
    }
    
    // Add timestamp and secret
    concatenated += timestamp.toString() + eventsSecret
    
    // Generate checksum
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(concatenated)
      .digest('hex')
    
    return calculatedChecksum === checksum
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Get Wompi config for tenant (decrypts secrets)
 */
export function getWompiConfig(tenant: {
  wompiPublicKey: string | null
  wompiPrivateKey: string | null
  wompiIntegritySecret: string | null
  wompiEventsSecret: string | null
  wompiMode: string
}): WompiConfig | null {
  if (
    !tenant.wompiPublicKey ||
    !tenant.wompiPrivateKey ||
    !tenant.wompiIntegritySecret ||
    !tenant.wompiEventsSecret
  ) {
    return null
  }

  return {
    publicKey: tenant.wompiPublicKey,
    privateKey: decrypt(tenant.wompiPrivateKey),
    integritySecret: decrypt(tenant.wompiIntegritySecret),
    eventsSecret: decrypt(tenant.wompiEventsSecret),
    mode: tenant.wompiMode as 'test' | 'production',
  }
}

/**
 * Check transaction status via Wompi API
 */
export async function getTransactionStatus(
  transactionId: string,
  privateKey: string
): Promise<any> {
  const baseUrl = getWompiBaseUrl()
  const response = await fetch(
    `${baseUrl}/transactions/${transactionId}`,
    {
      headers: {
        Authorization: `Bearer ${privateKey}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Wompi API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Create acceptance token (required for tokenization)
 */
export async function createAcceptanceToken(publicKey: string): Promise<string> {
  const baseUrl = getWompiBaseUrl()
  const response = await fetch(`${baseUrl}/merchants/${publicKey}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to get merchant info: ${response.status}`)
  }

  const data = await response.json()
  return data.data.presigned_acceptance.acceptance_token
}

/**
 * Tokenize payment method (card)
 */
export async function tokenizeCard(params: {
  number: string
  cvc: string
  exp_month: string
  exp_year: string
  card_holder: string
  publicKey: string
}): Promise<{ id: string; type: string; mask: string }> {
  const baseUrl = getWompiBaseUrl()
  const response = await fetch(`${baseUrl}/tokens/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.publicKey}`,
    },
    body: JSON.stringify({
      number: params.number,
      cvc: params.cvc,
      exp_month: params.exp_month,
      exp_year: params.exp_year,
      card_holder: params.card_holder,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.reason || 'Failed to tokenize card')
  }

  const data = await response.json()
  console.log('Wompi tokenize response:', JSON.stringify(data, null, 2))
  
  return {
    id: data.data.id,
    type: data.data.brand || 'CARD', // Wompi returns "brand" (VISA, MASTERCARD, etc.)
    mask: data.data.last_four, // Wompi returns "last_four" not "mask"
  }
}

/**
 * Create transaction with token (for recurring charges)
 */
export async function createTokenTransaction(params: {
  token: string
  acceptanceToken: string
  amountInCents: number
  currency: 'COP'
  customerEmail: string
  reference: string
  privateKey: string
  integritySecret: string
}): Promise<any> {
  const baseUrl = getWompiBaseUrl()
  
  // Generate integrity signature
  const signatureString = `${params.reference}${params.amountInCents}${params.currency}${params.integritySecret}`
  const signature = crypto.createHash('sha256').update(signatureString).digest('hex')
  
  const response = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.privateKey}`,
    },
    body: JSON.stringify({
      acceptance_token: params.acceptanceToken,
      amount_in_cents: params.amountInCents,
      currency: params.currency,
      customer_email: params.customerEmail,
      payment_method: {
        type: 'CARD',
        token: params.token,
        installments: 1,
      },
      reference: params.reference,
      signature, // Add integrity signature
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.log('Wompi create transaction error:', JSON.stringify(error, null, 2))
    throw new Error(error.error?.reason || 'Failed to create transaction')
  }

  return response.json()
}
