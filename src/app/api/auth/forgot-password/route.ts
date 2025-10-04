import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'
// import { generateToken } from '@/lib/utils'

// TODO: Implement password reset functionality
// This requires adding a VerificationToken model to the Prisma schema
// and implementing email sending functionality

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // TODO: Implement password reset
    // 1. Add VerificationToken model to schema
    // 2. Generate reset token
    // 3. Send email with reset link
    // 4. Create reset password page
    
    // For now, return not implemented
    return NextResponse.json({
      error: 'Password reset not yet implemented. Please contact support.',
    }, { status: 501 })
    
    /*
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
    */
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Request failed' },
      { status: 500 }
    )
  }
}
