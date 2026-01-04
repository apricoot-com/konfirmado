import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  const password = 'Asdf1234$'
  const hashedPassword = await bcrypt.hash(password, 12)
  const now = new Date()

  // Admin tenant and user
  let adminTenant = await prisma.tenant.findFirst({
    where: { name: 'Admin Tenant' },
  })

  if (!adminTenant) {
    adminTenant = await prisma.tenant.create({
      data: {
        name: 'Admin Tenant',
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Created admin tenant')
  } else {
    adminTenant = await prisma.tenant.update({
      where: { id: adminTenant.id },
      data: {
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Updated admin tenant')
  }

  const adminUserBefore = await prisma.user.findUnique({
    where: { email: 'admin@konfirmado.com' },
  })

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@konfirmado.com' },
    update: {
      password: hashedPassword,
      emailVerified: now,
      tenantId: adminTenant.id,
    },
    create: {
      email: 'admin@konfirmado.com',
      password: hashedPassword,
      emailVerified: now,
      tenantId: adminTenant.id,
    },
  })

  console.log(`✓ Admin user: ${adminUser.email} (${adminUserBefore ? 'updated' : 'created'})`)

  // Client tenant and user
  let clientTenant = await prisma.tenant.findFirst({
    where: { name: 'Test Client' },
  })

  if (!clientTenant) {
    clientTenant = await prisma.tenant.create({
      data: {
        name: 'Test Client',
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Created client tenant')
  } else {
    clientTenant = await prisma.tenant.update({
      where: { id: clientTenant.id },
      data: {
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Updated client tenant')
  }

  const clientUserBefore = await prisma.user.findUnique({
    where: { email: 'user@client.com' },
  })

  const clientUser = await prisma.user.upsert({
    where: { email: 'user@client.com' },
    update: {
      password: hashedPassword,
      emailVerified: now,
      tenantId: clientTenant.id,
    },
    create: {
      email: 'user@client.com',
      password: hashedPassword,
      emailVerified: now,
      tenantId: clientTenant.id,
    },
  })

  console.log(`✓ Client user: ${clientUser.email} (${clientUserBefore ? 'updated' : 'created'})`)

  console.log('✅ Database seed completed!')
  console.log('📧 Login credentials:')
  console.log(`   Admin: admin@konfirmado.com / ${password}`)
  console.log(`   Client: user@client.com / ${password}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

