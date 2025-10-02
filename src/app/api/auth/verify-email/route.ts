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
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }
    
    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }
    
    // Update user email verification
    await prisma.$transaction([
      prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ])
    
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
