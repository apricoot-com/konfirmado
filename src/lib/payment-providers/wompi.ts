import crypto from 'crypto'
import {
  IPaymentProvider,
  WompiCredentials,
  CreatePaymentParams,
  PaymentResponse,
  WebhookPayload,
} from './types'

/**
 * Wompi Payment Provider Implementation
 * Existing Wompi logic refactored to match interface
 */
export class WompiProvider implements IPaymentProvider {
  private credentials: WompiCredentials
  private isProduction: boolean
  private baseUrl: string

  constructor(credentials: WompiCredentials, isProduction = false) {
    this.credentials = credentials
    this.isProduction = isProduction
    this.baseUrl = isProduction
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1'
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      // Generate integrity signature
      const signature = this.generateIntegritySignature(
        params.reference,
        params.amount,
        params.currency
      )

      // Create transaction
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.publicKey}`,
        },
        body: JSON.stringify({
          amount_in_cents: params.amount * 100,
          currency: params.currency,
          customer_email: params.customerEmail,
          reference: params.reference,
          redirect_url: params.returnUrl,
          signature,
        }),
      })

      const data = await response.json()

      if (data.data?.id) {
        return {
          success: true,
          transactionId: data.data.id,
          redirectUrl: data.data.payment_link_url || data.data.payment_method_url,
        }
      }

      return {
        success: false,
        error: data.error?.messages?.join(', ') || 'Payment creation failed',
      }
    } catch (error: any) {
      console.error('Wompi create payment error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  private generateIntegritySignature(
    reference: string,
    amount: number,
    currency: string
  ): string {
    const amountInCents = amount * 100
    const signatureString = `${reference}${amountInCents}${currency}${this.credentials.integritySecret}`
    
    return crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex')
  }

  verifyWebhook(payload: any, signature: string): boolean {
    try {
      const { event, data, sent_at } = payload
      const timestamp = Math.floor(new Date(sent_at).getTime() / 1000)
      
      const concatenatedString = `${JSON.stringify(event)}${JSON.stringify(data)}${timestamp}`
      const expectedSignature = crypto
        .createHmac('sha256', this.credentials.eventsSecret)
        .update(concatenatedString)
        .digest('hex')

      return signature === expectedSignature
    } catch (error) {
      console.error('Wompi webhook verification error:', error)
      return false
    }
  }

  parseWebhook(payload: any): WebhookPayload {
    const { data } = payload
    const transaction = data.transaction

    let status: WebhookPayload['status'] = 'pending'
    
    if (transaction.status === 'APPROVED') {
      status = 'approved'
    } else if (transaction.status === 'DECLINED' || transaction.status === 'VOIDED') {
      status = 'declined'
    } else if (transaction.status === 'ERROR') {
      status = 'error'
    }

    return {
      provider: 'wompi',
      transactionId: transaction.id,
      reference: transaction.reference,
      status,
      amount: transaction.amount_in_cents / 100,
      currency: transaction.currency,
      rawData: payload,
    }
  }

  async getPaymentStatus(transactionId: string): Promise<WebhookPayload> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.publicKey}`,
        },
      })

      const data = await response.json()

      if (data.data) {
        return this.parseWebhook({ data: { transaction: data.data } })
      }

      throw new Error('Transaction not found')
    } catch (error: any) {
      console.error('Wompi get status error:', error)
      throw error
    }
  }
}

/**
 * Factory function to create Wompi provider
 */
export function createWompiProvider(
  credentials: WompiCredentials,
  isProduction = false
): WompiProvider {
  return new WompiProvider(credentials, isProduction)
}
