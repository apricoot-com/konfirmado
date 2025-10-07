import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm' }),
  }),
})

/**
 * Delete tenant account and all associated data
 * This is a destructive operation that cannot be undone
 * 
 * GDPR/Privacy Compliance:
 * - Deletes all user data
 * - Deletes all bookings
 * - Deletes all services
 * - Deletes all professionals
 * - Deletes all booking links
 * - Deletes tenant configuration
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, tenant } = await requireAuth()
    
    const body = await req.json()
    const validated = deleteAccountSchema.safeParse(body)
    
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }
    
    const { password } = validated.data
    
    // Verify password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })
    
    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    const isValidPassword = await bcrypt.compare(password, dbUser.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }
    
    // Delete all data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete in order to respect foreign key constraints
      
      // 1. Delete callback logs
      await tx.callbackLog.deleteMany({
        where: {
          booking: {
            tenantId: tenant.id,
          },
        },
      })
      
      // 2. Delete payments
      await tx.payment.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 3. Delete slot holds (get professional IDs first)
      const professionals = await tx.professional.findMany({
        where: { tenantId: tenant.id },
        select: { id: true },
      })
      const professionalIds = professionals.map(p => p.id)
      
      if (professionalIds.length > 0) {
        await tx.slotHold.deleteMany({
          where: {
            professionalId: { in: professionalIds },
          },
        })
      }
      
      // 4. Delete bookings
      await tx.booking.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 5. Delete booking links
      await tx.bookingLink.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 6. Delete service-professional associations
      await tx.serviceProfessional.deleteMany({
        where: {
          service: {
            tenantId: tenant.id,
          },
        },
      })
      
      // 7. Delete services
      await tx.service.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 8. Delete professionals
      await tx.professional.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 9. Delete subscriptions
      await tx.subscription.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 10. Delete metrics
      await tx.metric.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 11. Delete audit logs
      await tx.auditLog.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 12. Delete verification tokens for users
      const userEmails = await tx.user.findMany({
        where: { tenantId: tenant.id },
        select: { email: true },
      })
      
      for (const u of userEmails) {
        await tx.verificationToken.deleteMany({
          where: { identifier: u.email },
        })
      }
      
      // 13. Delete users
      await tx.user.deleteMany({
        where: { tenantId: tenant.id },
      })
      
      // 14. Finally, delete the tenant
      await tx.tenant.delete({
        where: { id: tenant.id },
      })
    })
    
    console.log(`✓ Account deleted: ${tenant.name} (${tenant.id})`)
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
