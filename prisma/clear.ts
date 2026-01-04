import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing database...')

  try {
    // Delete in order to respect foreign key constraints
    // Start with tables that have foreign keys pointing to them
    
    console.log('Deleting callback logs...')
    await prisma.callbackLog.deleteMany()
    
    console.log('Deleting payments...')
    await prisma.payment.deleteMany()
    
    console.log('Deleting bookings...')
    await prisma.booking.deleteMany()
    
    console.log('Deleting slot holds...')
    await prisma.slotHold.deleteMany()
    
    console.log('Deleting webhook events...')
    await prisma.webhookEvent.deleteMany()
    
    console.log('Deleting booking links...')
    await prisma.bookingLink.deleteMany()
    
    console.log('Deleting service professionals...')
    await prisma.serviceProfessional.deleteMany()
    
    console.log('Deleting services...')
    await prisma.service.deleteMany()
    
    console.log('Deleting professionals...')
    await prisma.professional.deleteMany()
    
    console.log('Deleting subscriptions...')
    await prisma.subscription.deleteMany()
    
    console.log('Deleting metrics...')
    await prisma.metric.deleteMany()
    
    console.log('Deleting audit logs...')
    await prisma.auditLog.deleteMany()
    
    console.log('Deleting verification tokens...')
    await prisma.verificationToken.deleteMany()
    
    console.log('Deleting users...')
    await prisma.user.deleteMany()
    
    console.log('Deleting tenants...')
    await prisma.tenant.deleteMany()
    
    console.log('✅ Database cleared successfully!')
  } catch (error) {
    console.error('❌ Error clearing database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Clear failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

