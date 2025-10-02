import { google } from 'googleapis'
import { decrypt, encrypt } from './encryption'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
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
    scope: SCOPES,
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
