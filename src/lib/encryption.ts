import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Encrypts sensitive data (e.g., refresh tokens, API keys)
 * Format: iv:authTag:encrypted
 */
export function encrypt(text: string): string {
  const KEY = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(encrypted: string): string {
  const KEY = getKey()
  const [ivHex, authTagHex, encryptedHex] = encrypted.split(':')
  
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted data format')
  }
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Generates HMAC signature for callbacks
 */
export function generateHmac(data: string, secret?: string): string {
  const hmacSecret = secret || process.env.CALLBACK_SECRET
  if (!hmacSecret) {
    throw new Error('CALLBACK_SECRET environment variable is not set')
  }
  
  return crypto
    .createHmac('sha256', hmacSecret)
    .update(data)
    .digest('hex')
}

/**
 * Verifies HMAC signature
 */
export function verifyHmac(data: string, signature: string, secret?: string): boolean {
  const expected = generateHmac(data, secret)
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  )
}
