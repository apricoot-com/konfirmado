import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      })
    }
    
    // Delete any existing reset tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `reset:${email}`,
      },
    })
    
    // Create reset token
    const token = generateToken(32)
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })
    
    // TODO: Send reset email
    // await sendPasswordResetEmail(email, token)
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    )
  }
}
