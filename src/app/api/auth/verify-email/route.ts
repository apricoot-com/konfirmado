import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    })
    
    if (!verificationToken) {
      console.error('Verification token not found:', token)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }
    
    console.log('Token found:', {
      identifier: verificationToken.identifier,
      expires: verificationToken.expires,
      now: new Date(),
      isExpired: verificationToken.expires < new Date()
    })
    
    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      console.error('Token expired:', {
        expires: verificationToken.expires,
        now: new Date()
      })
      
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.json(
        { error: 'Token has expired. Please request a new verification email.' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })
    
    if (!user) {
      console.error('User not found for email:', verificationToken.identifier)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }
    
    // Update user email verification and delete token
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      })
      
      // Delete token (use deleteMany to avoid error if already deleted)
      await tx.verificationToken.deleteMany({
        where: { token },
      })
    })
    
    console.log('✓ Email verified successfully for:', user.email)
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
