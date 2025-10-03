import { google } from 'googleapis'
import { decrypt, encrypt } from './encryption'

/**
 * Google Calendar OAuth scopes
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events', // Write access for creating events
]

/**
 * Get OAuth2 client
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/callback`
  )
}

/**
 * Generate authorization URL for professional to connect calendar
 */
export function getAuthUrl(connectionToken: string): string {
  const oauth2Client = getOAuth2Client()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_CALENDAR_SCOPES,
    state: connectionToken,
    prompt: 'consent', // Force to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Get calendar client with refresh token
 */
export function getCalendarClient(refreshToken: string) {
  const oauth2Client = getOAuth2Client()
  oauth2Client.setCredentials({
    refresh_token: decrypt(refreshToken),
  })
  
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Get user's calendar list
 */
export async function getCalendarList(refreshToken: string) {
  const calendar = getCalendarClient(refreshToken)
  
  const response = await calendar.calendarList.list()
  return response.data.items || []
}

/**
 * Get free/busy information for a calendar
 */
export async function getFreeBusy(
  refreshToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
) {
  const calendar = getCalendarClient(refreshToken)
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  })
  
  const calendarData = response.data.calendars?.[calendarId]
  return calendarData?.busy || []
}

/**
 * Generate available time slots from busy periods
 */
export function generateAvailableSlots(
  busyPeriods: Array<{ start: string; end: string }>,
  startDate: Date,
  endDate: Date,
  durationMinutes: number,
  workingHours = { start: 8, end: 18 } // 8 AM to 6 PM
): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = []
  const slotDuration = durationMinutes * 60 * 1000 // Convert to milliseconds
  
  // Generate all possible slots within working hours
  const currentDate = new Date(startDate)
  
  while (currentDate < endDate) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(workingHours.start, 0, 0, 0)
    
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(workingHours.end, 0, 0, 0)
    
    let slotStart = new Date(dayStart)
    
    while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration)
      
      // Check if slot overlaps with any busy period
      const isAvailable = !busyPeriods.some(busy => {
        const busyStart = new Date(busy.start)
        const busyEnd = new Date(busy.end)
        
        return (
          (slotStart >= busyStart && slotStart < busyEnd) ||
          (slotEnd > busyStart && slotEnd <= busyEnd) ||
          (slotStart <= busyStart && slotEnd >= busyEnd)
        )
      })
      
      if (isAvailable && slotStart > new Date()) {
        slots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
        })
      }
      
      // Move to next slot (30 min intervals)
      slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000)
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return slots
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(
  refreshToken: string,
  calendarId: string,
  event: {
    summary: string
    description?: string
    location?: string
    start: Date
    end: Date
    attendees?: Array<{ email: string; displayName?: string }>
  }
) {
  const calendar = getCalendarClient(refreshToken)
  
  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Bogota',
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Bogota',
      },
      attendees: event.attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 min before
        ],
      },
    },
  })
  
  return response.data
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string,
  event: {
    summary?: string
    description?: string
    location?: string
    start?: Date
    end?: Date
    attendees?: Array<{ email: string; displayName?: string }>
  }
) {
  const calendar = getCalendarClient(refreshToken)
  
  const response = await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.start ? {
        dateTime: event.start.toISOString(),
        timeZone: 'America/Bogota',
      } : undefined,
      end: event.end ? {
        dateTime: event.end.toISOString(),
        timeZone: 'America/Bogota',
      } : undefined,
      attendees: event.attendees,
    },
  })
  
  return response.data
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  refreshToken: string,
  calendarId: string,
  eventId: string
) {
  const calendar = getCalendarClient(refreshToken)
  
  await calendar.events.delete({
    calendarId,
    eventId,
  })
}
