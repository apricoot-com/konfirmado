import crypto from 'crypto'
import {
  IPaymentProvider,
  PayUCredentials,
  CreatePaymentParams,
  PaymentResponse,
  WebhookPayload,
} from './types'

/**
 * PayU Payment Provider Implementation
 * Docs: https://developers.payulatam.com/
 */
export class PayUProvider implements IPaymentProvider {
  private credentials: PayUCredentials
  private isProduction: boolean
  private baseUrl: string

  constructor(credentials: PayUCredentials, isProduction = false) {
    this.credentials = credentials
    this.isProduction = isProduction
    this.baseUrl = isProduction
      ? 'https://api.payulatam.com/payments-api/4.0/service.cgi'
      : 'https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi'
  }

  /**
   * Create payment transaction
   * PayU uses a redirect flow (similar to Wompi)
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    try {
      // Generate signature for PayU
      const signature = this.generateSignature(
        params.reference,
        params.amount,
        params.currency
      )

      // PayU uses a form-based redirect
      // We'll generate a checkout URL with parameters
      const checkoutUrl = this.isProduction
        ? 'https://checkout.payulatam.com/ppp-web-gateway-payu/'
        : 'https://sandbox.checkout.payulatam.com/ppp-web-gateway-payu/'

      const paymentUrl = this.buildCheckoutUrl(checkoutUrl, {
        merchantId: this.credentials.merchantId,
        accountId: this.credentials.accountId,
        description: params.description,
        referenceCode: params.reference,
        amount: params.amount,
        currency: params.currency,
        signature,
        buyerEmail: params.customerEmail,
        buyerFullName: params.customerName,
        telephone: params.customerPhone || '',
        responseUrl: params.returnUrl,
        confirmationUrl: params.confirmationUrl,
      })

      return {
        success: true,
        redirectUrl: paymentUrl,
      }
    } catch (error: any) {
      console.error('PayU create payment error:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Generate PayU signature
   * Format: MD5(apiKey~merchantId~referenceCode~amount~currency)
   */
  private generateSignature(
    reference: string,
    amount: number,
    currency: string
  ): string {
    const { apiKey, merchantId } = this.credentials
    
    // PayU requires amount with 1 decimal for COP, 2 for USD
    const formattedAmount = currency === 'COP' 
      ? amount.toFixed(1) 
      : amount.toFixed(2)
    
    const signatureString = `${apiKey}~${merchantId}~${reference}~${formattedAmount}~${currency}`
    
    return crypto
      .createHash('md5')
      .update(signatureString)
      .digest('hex')
  }

  /**
   * Build checkout URL with parameters
   */
  private buildCheckoutUrl(baseUrl: string, params: Record<string, any>): string {
    const queryParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value))
      }
    })
    
    return `${baseUrl}?${queryParams.toString()}`
  }

  /**
   * Verify webhook signature
   * PayU sends signature in the payload
   */
  verifyWebhook(payload: any, signature: string): boolean {
    try {
      const {
        merchant_id,
        reference_sale,
        value,
        currency,
        state_pol,
      } = payload

      // Generate expected signature
      const signatureString = `${this.credentials.apiKey}~${merchant_id}~${reference_sale}~${value}~${currency}~${state_pol}`
      
      const expectedSignature = crypto
        .createHash('md5')
        .update(signatureString)
        .digest('hex')

      return signature === expectedSignature
    } catch (error) {
      console.error('PayU webhook verification error:', error)
      return false
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: any): WebhookPayload {
    const {
      transaction_id,
      reference_sale,
      value,
      currency,
      state_pol,
      response_message_pol,
    } = payload

    // PayU state codes:
    // 4 = Approved
    // 6 = Declined
    // 7 = Pending
    // 104 = Error
    let status: WebhookPayload['status'] = 'pending'
    
    if (state_pol === '4') {
      status = 'approved'
    } else if (state_pol === '6' || state_pol === '104') {
      status = 'declined'
    } else if (state_pol === '7') {
      status = 'pending'
    }

    return {
      provider: 'payu',
      transactionId: transaction_id,
      reference: reference_sale,
      status,
      amount: parseFloat(value),
      currency,
      rawData: payload,
    }
  }

  /**
   * Get payment status (query API)
   */
  async getPaymentStatus(transactionId: string): Promise<WebhookPayload> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          language: 'es',
          command: 'ORDER_DETAIL_BY_REFERENCE_CODE',
          merchant: {
            apiLogin: this.credentials.apiLogin,
            apiKey: this.credentials.apiKey,
          },
          details: {
            referenceCode: transactionId,
          },
          test: !this.isProduction,
        }),
      })

      const data = await response.json()

      if (data.code === 'SUCCESS' && data.result) {
        const transaction = data.result.payload[0]?.transactions[0]
        
        return this.parseWebhook({
          transaction_id: transaction.id,
          reference_sale: transaction.referenceCode,
          value: transaction.value,
          currency: transaction.currency,
          state_pol: transaction.state,
          response_message_pol: transaction.responseMessage,
        })
      }

      throw new Error('Transaction not found')
    } catch (error: any) {
      console.error('PayU get status error:', error)
      throw error
    }
  }
}

/**
 * Factory function to create PayU provider
 */
export function createPayUProvider(
  credentials: PayUCredentials,
  isProduction = false
): PayUProvider {
  return new PayUProvider(credentials, isProduction)
}
