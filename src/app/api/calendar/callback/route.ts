import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokensFromCode, getCalendarList } from '@/lib/google-calendar'
import { encrypt } from '@/lib/encryption'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the connectionToken
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=${error}`
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=missing_params`
      )
    }
    
    // Find professional by connection token
    const professional = await prisma.professional.findUnique({
      where: { connectionToken: state },
      include: { tenant: true },
    })
    
    if (!professional) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=invalid_token`
      )
    }
    
    // Check if token is expired
    if (professional.tokenExpiresAt && professional.tokenExpiresAt < new Date()) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=expired_token`
      )
    }
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)
    
    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=no_refresh_token`
      )
    }
    
    // Get user's calendar list to get primary calendar ID
    const calendars = await getCalendarList(encrypt(tokens.refresh_token))
    const primaryCalendar = calendars.find(cal => cal.primary) || calendars[0]
    
    if (!primaryCalendar?.id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=no_calendar`
      )
    }
    
    // Update professional with calendar info
    await prisma.professional.update({
      where: { id: professional.id },
      data: {
        calendarStatus: 'connected',
        calendarId: primaryCalendar.id,
        refreshToken: encrypt(tokens.refresh_token),
        connectionToken: null, // Invalidate token after use
        tokenExpiresAt: null,
      },
    })
    
    // Audit log
    await logAudit({
      tenantId: professional.tenantId,
      userId: undefined,
      action: 'calendar_connected',
      entityType: 'professional',
      entityId: professional.id,
      metadata: {
        name: professional.name,
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.summary,
      },
      req,
    })
    
    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/success?name=${encodeURIComponent(professional.name)}`
    )
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connect-calendar/error?reason=server_error`
    )
  }
}
