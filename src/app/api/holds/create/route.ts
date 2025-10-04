import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const holdSchema = z.object({
  professionalId: z.string(),
  serviceId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionId: z.string(),
})

const HOLD_DURATION_MINUTES = 10 // Hold slots for 10 minutes

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = holdSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { professionalId, serviceId, startTime, endTime, sessionId } = validated.data
    
    // Check if slot is already held by someone else
    const existingHold = await prisma.slotHold.findFirst({
      where: {
        professionalId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        expiresAt: {
          gte: new Date(), // Not expired
        },
        sessionId: {
          not: sessionId, // Different session
        },
      },
    })
    
    if (existingHold) {
      return NextResponse.json(
        { error: 'Slot is already held by another user' },
        { status: 409 }
      )
    }
    
    // Check if slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        professionalId,
        startTime: new Date(startTime),
        status: {
          in: ['pending', 'paid', 'confirmed'],
        },
      },
    })
    
    if (existingBooking) {
      return NextResponse.json(
        { error: 'Slot is already booked' },
        { status: 409 }
      )
    }
    
    // Delete any expired holds for this session
    await prisma.slotHold.deleteMany({
      where: {
        sessionId,
        expiresAt: {
          lt: new Date(),
        },
      },
    })
    
    // Delete any existing hold for this session (user changed their mind)
    await prisma.slotHold.deleteMany({
      where: {
        sessionId,
        expiresAt: {
          gte: new Date(),
        },
      },
    })
    
    // Create new hold
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000)
    
    const hold = await prisma.slotHold.create({
      data: {
        professionalId,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        expiresAt,
        sessionId,
      },
    })
    
    console.log(`✓ Hold created: ${hold.id} (expires at ${expiresAt.toISOString()})`)
    
    return NextResponse.json({
      success: true,
      holdId: hold.id,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: HOLD_DURATION_MINUTES * 60,
    })
  } catch (error) {
    console.error('Create hold error:', error)
    return NextResponse.json(
      { error: 'Failed to create hold' },
      { status: 500 }
    )
  }
}
