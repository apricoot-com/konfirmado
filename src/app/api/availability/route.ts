import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFreeBusy, generateAvailableSlots } from '@/lib/google-calendar'
import { z } from 'zod'

const availabilitySchema = z.object({
  professionalId: z.string().cuid(),
  serviceId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = availabilitySchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { professionalId, serviceId, startDate, endDate } = validated.data
    
    // Get professional with calendar info
    const professional = await prisma.professional.findFirst({
      where: {
        id: professionalId,
        isActive: true,
        calendarStatus: 'connected',
      },
    })
    
    if (!professional || !professional.refreshToken || !professional.calendarId) {
      return NextResponse.json(
        { error: 'Professional calendar not connected' },
        { status: 400 }
      )
    }
    
    // Get service to know duration
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
    })
    
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    
    // Get busy periods from Google Calendar
    let busyPeriods
    try {
      busyPeriods = await getFreeBusy(
        professional.refreshToken,
        professional.calendarId,
        new Date(startDate),
        new Date(endDate)
      )
    } catch (error: any) {
      // Check if it's an auth error
      if (error.code === 401 || error.code === 403 || error.message?.includes('invalid_grant')) {
        // Mark calendar as error status
        await prisma.professional.update({
          where: { id: professionalId },
          data: { calendarStatus: 'error' },
        })
        
        return NextResponse.json(
          { error: 'Calendar authorization expired. Please reconnect.' },
          { status: 401 }
        )
      }
      
      throw error
    }
    
    // Get active holds (not expired) for this professional
    const activeHolds = await prisma.slotHold.findMany({
      where: {
        professionalId,
        expiresAt: {
          gte: new Date(),
        },
        startTime: {
          gte: new Date(startDate),
          lt: new Date(endDate),
        },
      },
    })
    
    // Combine busy periods from calendar and holds
    const allBusyPeriods = [
      ...busyPeriods.map(period => ({
        start: period.start || '',
        end: period.end || '',
      })),
      ...activeHolds.map(hold => ({
        start: hold.startTime.toISOString(),
        end: hold.endTime.toISOString(),
      })),
    ]
    
    // Generate available slots with business hours filter
    const availableSlots = generateAvailableSlots(
      allBusyPeriods,
      new Date(startDate),
      new Date(endDate),
      service.durationMinutes,
      professional.businessHours as any,
      professional.timezone
    )
    
    return NextResponse.json({
      slots: availableSlots.map(slot => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
