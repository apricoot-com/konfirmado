import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { getCalendarList } from '@/lib/google-calendar'

/**
 * Test calendar connection for a professional
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenant } = await requireAuth()
    const { id } = await params
    
    const professional = await prisma.professional.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    })
    
    if (!professional) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 })
    }
    
    if (!professional.refreshToken || !professional.calendarId) {
      return NextResponse.json(
        { error: 'Calendar not connected', status: 'not_connected' },
        { status: 400 }
      )
    }
    
    try {
      // Try to fetch calendar list to test connection
      const calendars = await getCalendarList(professional.refreshToken)
      const connectedCalendar = calendars.find(cal => cal.id === professional.calendarId)
      
      if (!connectedCalendar) {
        // Calendar not found, mark as error
        await prisma.professional.update({
          where: { id },
          data: { calendarStatus: 'error' },
        })
        
        return NextResponse.json({
          status: 'error',
          message: 'Calendar not found or access revoked',
        })
      }
      
      // Update status to connected if it was in error
      if (professional.calendarStatus === 'error') {
        await prisma.professional.update({
          where: { id },
          data: { calendarStatus: 'connected' },
        })
      }
      
      return NextResponse.json({
        status: 'connected',
        calendar: {
          id: connectedCalendar.id,
          name: connectedCalendar.summary,
          primary: connectedCalendar.primary,
        },
      })
    } catch (error: any) {
      // Auth error - token expired or revoked
      if (error.code === 401 || error.code === 403 || error.message?.includes('invalid_grant')) {
        await prisma.professional.update({
          where: { id },
          data: { calendarStatus: 'error' },
        })
        
        return NextResponse.json({
          status: 'error',
          message: 'Authorization expired. Professional needs to reconnect.',
        })
      }
      
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Test calendar error:', error)
    return NextResponse.json(
      { error: 'Failed to test calendar connection' },
      { status: 500 }
    )
  }
}
