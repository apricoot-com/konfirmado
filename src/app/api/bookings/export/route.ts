import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  try {
    const { tenant } = await requireAuth()
    
    // Get month parameter (format: YYYY-MM)
    const searchParams = req.nextUrl.searchParams
    const monthParam = searchParams.get('month')
    
    if (!monthParam) {
      return NextResponse.json({ error: 'Month parameter required' }, { status: 400 })
    }

    // Parse month and get date range
    const monthDate = parseISO(`${monthParam}-01`)
    const startDate = startOfMonth(monthDate)
    const endDate = endOfMonth(monthDate)

    // Fetch bookings for the selected month
    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
        professional: true,
        payment: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Generate CSV content
    const csvHeaders = [
      'Fecha',
      'Hora Inicio',
      'Hora Fin',
      'Cliente',
      'Email',
      'Teléfono',
      'Servicio',
      'Duración (min)',
      'Profesional',
      'Monto',
      'Estado Pago',
      'Referencia',
      'Estado Reserva',
    ]

    const csvRows = bookings.map((booking) => {
      return [
        format(new Date(booking.startTime), 'dd/MM/yyyy', { locale: es }),
        format(new Date(booking.startTime), 'HH:mm', { locale: es }),
        format(new Date(booking.endTime), 'HH:mm', { locale: es }),
        booking.userName,
        booking.userEmail,
        booking.userPhone || '',
        booking.service.name,
        booking.service.durationMinutes.toString(),
        booking.professional.name,
        booking.payment?.amount ? `$${booking.payment.amount.toLocaleString('es-CO')}` : '',
        booking.payment?.status || '',
        booking.payment?.reference || '',
        booking.status,
      ]
    })

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      ),
    ].join('\n')

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    // Return CSV file
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservas-${monthParam}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export bookings error:', error)
    return NextResponse.json(
      { error: 'Error al exportar reservas' },
      { status: 500 }
    )
  }
}
