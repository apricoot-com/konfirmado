import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(3).max(100),
  callbackUrl: z.string().url().startsWith('https://'),
  returnUrl: z.string().url().startsWith('https://'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = registerSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { email, password, tenantName, callbackUrl, returnUrl } = validated.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create tenant and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          callbackUrl,
          returnUrl,
        },
      })
      
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          tenantId: tenant.id,
        },
      })
      
      // Create verification token
      const token = generateToken(32)
      await tx.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
      
      return { user, tenant, token }
    })
    
    // TODO: Send verification email
    // await sendVerificationEmail(email, result.token)
    
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      verificationToken: process.env.NODE_ENV === 'development' ? result.token : undefined,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
