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
    where: { name: 'CliniTest' },
  })

  if (!clientTenant) {
    clientTenant = await prisma.tenant.create({
      data: {
        name: 'CliniTest',
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        logoUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/logo-clinitest.png',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Created CliniTest tenant')
  } else {
    clientTenant = await prisma.tenant.update({
      where: { id: clientTenant.id },
      data: {
        callbackUrl: 'http://localhost:3000/api/callback',
        returnUrl: 'http://localhost:3000/thanks',
        logoUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/logo-clinitest.png',
        subscriptionPlan: 'trial',
        subscriptionStatus: 'active',
      },
    })
    console.log('✓ Updated CliniTest tenant')
  }

  const clientUserBefore = await prisma.user.findUnique({
    where: { email: 'user@clinitest.com' },
  })

  const clientUser = await prisma.user.upsert({
    where: { email: 'user@clinitest.com' },
    update: {
      password: hashedPassword,
      emailVerified: now,
      tenantId: clientTenant.id,
    },
    create: {
      email: 'user@clinitest.com',
      password: hashedPassword,
      emailVerified: now,
      tenantId: clientTenant.id,
    },
  })

  console.log(`✓ CliniTest user: ${clientUser.email} (${clientUserBefore ? 'updated' : 'created'})`)

  // Create services for client tenant
  const services = [
    {
      name: 'Consulta General',
      description: 'Consulta médica general de 30 minutos. Incluye evaluación inicial y recomendaciones básicas.',
      imageUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/service-1.jpg',
      durationMinutes: 30,
      price: 120000, // 120,000 COP
      chargeType: 'partial' as const,
      partialPercentage: 25, // 25% advance payment
      confirmationMessage: 'Tu consulta ha sido confirmada. Te esperamos el día programado.',
      isActive: true,
    },
    {
      name: 'Consulta Especializada',
      description: 'Consulta con especialista de 60 minutos. Evaluación detallada y plan de tratamiento.',
      imageUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/service-2.png',
      durationMinutes: 60,
      price: 250000, // 250,000 COP
      chargeType: 'total' as const,
      confirmationMessage: 'Tu consulta especializada ha sido confirmada. Recibirás un recordatorio 24 horas antes.',
      isActive: true,
    },
    {
      name: 'Seguimiento',
      description: 'Consulta de seguimiento de 20 minutos para revisar evolución del tratamiento.',
      imageUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/service-3.jpg',
      durationMinutes: 20,
      price: 80000, // 80,000 COP
      chargeType: 'partial' as const,
      partialPercentage: 50, // 50% advance payment
      isActive: true,
    },
  ]

  console.log('\n📋 Creating services...')
  const createdServices = []
  for (const serviceData of services) {
    const existingService = await prisma.service.findFirst({
      where: {
        tenantId: clientTenant.id,
        name: serviceData.name,
      },
    })

    if (!existingService) {
      const service = await prisma.service.create({
        data: {
          ...serviceData,
          tenantId: clientTenant.id,
        },
      })
      createdServices.push(service)
      console.log(`✓ Created service: ${service.name}`)
    } else {
      // Update existing service to ensure it has the latest data
      const updatedService = await prisma.service.update({
        where: { id: existingService.id },
        data: {
          ...serviceData,
          tenantId: clientTenant.id,
        },
      })
      createdServices.push(updatedService)
      console.log(`✓ Updated service: ${updatedService.name}`)
    }
  }

  // Ensure we have exactly 3 services
  if (createdServices.length !== 3) {
    throw new Error(`Expected 3 services, but found ${createdServices.length}`)
  }

  // Create professionals for client tenant
  const professionals = [
    {
      name: 'Dra. María López',
      email: 'maria.lopez@clinic.com',
      description: 'Médica general con 10 años de experiencia. Especializada en medicina familiar.',
      photoUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/doctora-1.png',
      calendarStatus: 'pending' as const,
      isActive: true,
    },
    {
      name: 'Dr. Carlos Rodríguez',
      email: 'carlos.rodriguez@clinic.com',
      description: 'Especialista en medicina interna. Atención personalizada y seguimiento continuo.',
      photoUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/doctor-1.png',
      calendarStatus: 'pending' as const,
      isActive: true,
    },
    {
      name: 'Dra. Ana Martínez',
      email: 'ana.martinez@clinic.com',
      description: 'Médica general con enfoque en medicina preventiva y bienestar.',
      photoUrl: 'https://thord-public.s3.us-east-1.amazonaws.com/konfirmado_dev_images/clinitest/doctora-2.png',
      calendarStatus: 'pending' as const,
      isActive: true,
    },
  ]

  console.log('\n👨‍⚕️ Creating professionals...')
  const createdProfessionals = []
  for (const professionalData of professionals) {
    const existingProfessional = await prisma.professional.findFirst({
      where: {
        tenantId: clientTenant.id,
        name: professionalData.name,
      },
    })

    if (!existingProfessional) {
      const professional = await prisma.professional.create({
        data: {
          ...professionalData,
          tenantId: clientTenant.id,
        },
      })
      createdProfessionals.push(professional)
      console.log(`✓ Created professional: ${professional.name}`)
    } else {
      // Update existing professional to ensure it has the latest data
      const updatedProfessional = await prisma.professional.update({
        where: { id: existingProfessional.id },
        data: {
          ...professionalData,
          tenantId: clientTenant.id,
        },
      })
      createdProfessionals.push(updatedProfessional)
      console.log(`✓ Updated professional: ${updatedProfessional.name}`)
    }
  }

  // Ensure we have exactly 3 professionals
  if (createdProfessionals.length !== 3) {
    throw new Error(`Expected 3 professionals, but found ${createdProfessionals.length}`)
  }

  // Link services to professionals
  console.log('\n🔗 Linking services to professionals...')
  // Define specific links:
  // - Consulta General: 1 professional (Dra. María López)
  // - Consulta Especializada: 2 professionals (Dr. Carlos Rodríguez & Dra. Ana Martínez)
  // - Seguimiento: 3 professionals (all professionals)

  // Find services by name to ensure correct mapping
  const consultaGeneral = createdServices.find(s => s.name === 'Consulta General')
  const consultaEspecializada = createdServices.find(s => s.name === 'Consulta Especializada')
  const seguimiento = createdServices.find(s => s.name === 'Seguimiento')

  // Find professionals by name to ensure correct mapping
  const draMariaLopez = createdProfessionals.find(p => p.name === 'Dra. María López')
  const drCarlosRodriguez = createdProfessionals.find(p => p.name === 'Dr. Carlos Rodríguez')
  const draAnaMartinez = createdProfessionals.find(p => p.name === 'Dra. Ana Martínez')

  if (!consultaGeneral || !consultaEspecializada || !seguimiento) {
    throw new Error('Could not find all required services')
  }
  if (!draMariaLopez || !drCarlosRodriguez || !draAnaMartinez) {
    throw new Error('Could not find all required professionals')
  }

  const serviceProfessionalLinks = [
    {
      service: consultaGeneral,
      professionals: [draMariaLopez],
    },
    {
      service: consultaEspecializada,
      professionals: [drCarlosRodriguez, draAnaMartinez],
    },
    {
      service: seguimiento,
      professionals: [draMariaLopez, drCarlosRodriguez, draAnaMartinez],
    },
  ]

  for (const { service, professionals } of serviceProfessionalLinks) {
    for (const professional of professionals) {
      const existingLink = await prisma.serviceProfessional.findUnique({
        where: {
          serviceId_professionalId: {
            serviceId: service.id,
            professionalId: professional.id,
          },
        },
      })

      if (!existingLink) {
        await prisma.serviceProfessional.create({
          data: {
            serviceId: service.id,
            professionalId: professional.id,
          },
        })
        console.log(`✓ Linked ${service.name} to ${professional.name}`)
      } else {
        console.log(`✓ Link already exists: ${service.name} ↔ ${professional.name}`)
      }
    }
  }

  // Create booking links for client tenant
  // Find services and professionals by name to ensure correct mapping
  const consultaGeneralService = createdServices.find(s => s.name === 'Consulta General')
  const consultaEspecializadaService = createdServices.find(s => s.name === 'Consulta Especializada')
  const draMariaLopezProf = createdProfessionals.find(p => p.name === 'Dra. María López')
  const drCarlosRodriguezProf = createdProfessionals.find(p => p.name === 'Dr. Carlos Rodríguez')

  const bookingLinks = [
    {
      name: 'Link General - Todos los Servicios',
      serviceId: null, // No preselection
      professionalId: null, // No preselection
      expiresAt: null, // No expiration
      isActive: true,
    },
    {
      name: 'Link Consulta General - Dra. López',
      serviceId: consultaGeneralService?.id || null,
      professionalId: draMariaLopezProf?.id || null,
      expiresAt: null,
      isActive: true,
    },
    {
      name: 'Link Especializada - Dr. Rodríguez',
      serviceId: consultaEspecializadaService?.id || null,
      professionalId: drCarlosRodriguezProf?.id || null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      isActive: true,
    },
  ]

  console.log('\n🔗 Creating booking links...')
  for (const linkData of bookingLinks) {
    const existingLink = await prisma.bookingLink.findFirst({
      where: {
        tenantId: clientTenant.id,
        name: linkData.name,
      },
    })

    if (!existingLink) {
      const link = await prisma.bookingLink.create({
        data: {
          ...linkData,
          tenantId: clientTenant.id,
        },
      })
      console.log(`✓ Created booking link: ${link.name} (ID: ${link.publicId})`)
    } else {
      // Update existing link to ensure it has the latest data
      const updatedLink = await prisma.bookingLink.update({
        where: { id: existingLink.id },
        data: {
          ...linkData,
          tenantId: clientTenant.id,
        },
      })
      console.log(`✓ Updated booking link: ${updatedLink.name} (ID: ${updatedLink.publicId})`)
    }
  }

  console.log('\n✅ Database seed completed!')
  console.log('📧 Login credentials:')
  console.log(`   Admin: admin@konfirmado.com / ${password}`)
  console.log(`   Client: user@clinitest.com / ${password}`)
  console.log('\n📊 Seed summary:')
  console.log(`   Services: ${createdServices.length}`)
  console.log(`   Professionals: ${createdProfessionals.length}`)
  console.log(`   Booking Links: ${bookingLinks.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

