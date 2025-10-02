import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = resetSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }
    
    const { token, password } = validated.data
    
    // Find reset token
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token },
    })
    
    if (!resetToken || !resetToken.identifier.startsWith('reset:')) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }
    
    // Check if token is expired
    if (resetToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: { token },
      })
      
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }
    
    // Extract email from identifier
    const email = resetToken.identifier.replace('reset:', '')
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Update password and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Reset failed' },
      { status: 500 }
    )
  }
}
