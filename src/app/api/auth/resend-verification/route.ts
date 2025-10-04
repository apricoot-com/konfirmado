import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = resendSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }
    
    const { email } = validated.data
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({ success: true })
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Este correo ya está verificado' },
        { status: 400 }
      )
    }
    
    // Check rate limit (max 1 resend per 5 minutes)
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        },
      },
    })
    
    if (recentToken) {
      return NextResponse.json(
        { error: 'Por favor espera 5 minutos antes de reenviar' },
        { status: 429 }
      )
    }
    
    // Delete old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })
    
    // Generate new token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })
    
    // Send verification email
    if (process.env.RESEND_API_KEY) {
      try {
        await sendVerificationEmail(email, token)
      } catch (error) {
        console.error('Failed to send verification email:', error)
        return NextResponse.json(
          { error: 'Error al enviar el correo' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
