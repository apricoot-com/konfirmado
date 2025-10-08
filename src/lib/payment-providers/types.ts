/**
 * Payment Provider Interface
 * Allows supporting multiple payment gateways (Wompi, PayU, etc.)
 */

export interface PaymentProvider {
  name: string
  id: 'wompi' | 'payu' | 'mercadopago'
}

export interface PaymentConfig {
  provider: PaymentProvider['id']
  credentials: WompiCredentials | PayUCredentials
}

export interface WompiCredentials {
  publicKey: string
  privateKey: string
  eventsSecret: string
  integritySecret: string
}

export interface PayUCredentials {
  merchantId: string
  apiKey: string
  apiLogin: string
  accountId: string
  publicKey?: string
}

export interface CreatePaymentParams {
  amount: number
  currency: string
  reference: string
  description: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  returnUrl: string
  confirmationUrl: string
}

export interface PaymentResponse {
  success: boolean
  transactionId?: string
  redirectUrl?: string
  error?: string
}

export interface WebhookPayload {
  provider: PaymentProvider['id']
  transactionId: string
  reference: string
  status: 'approved' | 'declined' | 'pending' | 'error'
  amount: number
  currency: string
  rawData: any
}

/**
 * Base Payment Provider Interface
 */
export interface IPaymentProvider {
  /**
   * Create a payment transaction
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResponse>
  
  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: any, signature: string): boolean
  
  /**
   * Parse webhook payload
   */
  parseWebhook(payload: any): WebhookPayload
  
  /**
   * Get payment status
   */
  getPaymentStatus(transactionId: string): Promise<WebhookPayload>
}
