import crypto from 'crypto'
import { decrypt } from './encryption'

interface WompiConfig {
  publicKey: string
  privateKey: string
  integritySecret: string
  eventsSecret: string
  mode: 'test' | 'production'
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
  const response = await fetch(
    `https://production.wompi.co/v1/transactions/${transactionId}`,
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
