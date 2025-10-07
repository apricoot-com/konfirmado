import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = checkSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }
    
    const { email } = validated.data
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    })
    
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ verified: false })
    }
    
    return NextResponse.json({ 
      verified: !!user.emailVerified 
    })
  } catch (error) {
    console.error('Check verification error:', error)
    return NextResponse.json(
      { error: 'Error checking verification status' },
      { status: 500 }
    )
  }
}
