/**
 * Database Seed Script
 * Populates the database with initial data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.activityLog.deleteMany();
    await prisma.supportResponse.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.message.deleteMany();
    await prisma.professionalProfile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.systemConfig.deleteMany();
  }

  // Hash passwords
  const defaultPassword = await bcrypt.hash('123456', 12);

  // Create system configurations
  console.log('⚙️ Creating system configurations...');
  await prisma.systemConfig.createMany({
    data: [
      { key: 'WAYNE_CASH_RATE', value: '0.10' }, // 1 real = 10 Wayne Cash
      { key: 'MIN_WITHDRAWAL', value: '10.00' },
      { key: 'MAX_DAILY_TRANSACTIONS', value: '10' },
      { key: 'PLATFORM_FEE_PERCENTAGE', value: '5.0' },
      { key: 'MAINTENANCE_MODE', value: 'false' },
    ]
  });

  // Create client users
  console.log('👥 Creating client users...');
  const client1 = await prisma.user.create({
    data: {
      email: 'cliente1@exemplo.com',
      phone: '+5511999999001',
      name: 'João Silva',
      type: 'CLIENT',
      document: '12345678901',
      passwordHash: defaultPassword,
      isVerified: true,
      wayneCashBalance: 150.75,
      addressStreet: 'Rua das Flores',
      addressNumber: '123',
      addressNeighborhood: 'Centro',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressCountry: 'Brasil',
      addressZipCode: '01234-567',
    }
  });

  const client2 = await prisma.user.create({
    data: {
      email: 'cliente2@exemplo.com',
      phone: '+5511999999002',
      name: 'Maria Santos',
      type: 'CLIENT',
      document: '98765432100',
      passwordHash: defaultPassword,
      isVerified: true,
      wayneCashBalance: 25.50,
      addressStreet: 'Avenida Paulista',
      addressNumber: '456',
      addressNeighborhood: 'Bela Vista',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressCountry: 'Brasil',
      addressZipCode: '01310-100',
    }
  });

  // Create professional users
  console.log('🔧 Creating professional users...');
  const professional1 = await prisma.user.create({
    data: {
      email: 'profissional1@exemplo.com',
      phone: '+5511999999003',
      name: 'Carlos Pereira',
      type: 'PROFESSIONAL',
      document: '11122233344',
      passwordHash: defaultPassword,
      isVerified: true,
      wayneCashBalance: 320.00,
      addressStreet: 'Rua dos Profissionais',
      addressNumber: '789',
      addressNeighborhood: 'Vila Madalena',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressCountry: 'Brasil',
      addressZipCode: '05433-000',
      professionalProfile: {
        create: {
          specialty: 'PLUMBER',
          rating: 4.8,
          totalServices: 127,
          isAvailable: true,
          vehicleType: 'Van',
          vehicleModel: 'Fiat Fiorino',
          vehiclePlate: 'ABC-1234',
          vehicleColor: 'Branco',
          vehicleYear: 2020,
        }
      }
    }
  });

  const professional2 = await prisma.user.create({
    data: {
      email: 'profissional2@exemplo.com',
      phone: '+5511999999004',
      name: 'Ana Costa',
      type: 'PROFESSIONAL',
      document: '55566677788',
      passwordHash: defaultPassword,
      isVerified: true,
      wayneCashBalance: 180.25,
      addressStreet: 'Rua das Técnicas',
      addressNumber: '321',
      addressNeighborhood: 'Pinheiros',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressCountry: 'Brasil',
      addressZipCode: '05422-001',
      professionalProfile: {
        create: {
          specialty: 'ELECTRICIAN',
          rating: 4.9,
          totalServices: 89,
          isAvailable: true,
        }
      }
    }
  });

  // Create sample messages
  console.log('💬 Creating sample messages...');
  await prisma.message.createMany({
    data: [
      {
        content: 'Olá! Preciso de um encanador para consertar um vazamento.',
        senderId: client1.id,
        receiverId: professional1.id,
        status: 'READ',
      },
      {
        content: 'Olá! Posso ajudar sim. Qual é o problema exatamente?',
        senderId: professional1.id,
        receiverId: client1.id,
        status: 'READ',
      },
      {
        content: 'É um vazamento na torneira da cozinha.',
        senderId: client1.id,
        receiverId: professional1.id,
        status: 'DELIVERED',
      },
    ]
  });

  // Create sample transactions
  console.log('💰 Creating sample transactions...');
  await prisma.transaction.createMany({
    data: [
      {
        userId: client1.id,
        type: 'PAYMENT',
        status: 'COMPLETED',
        amount: 85.50,
        description: 'Pagamento por serviço de encanamento',
        paymentMethod: 'wayne-cash',
        processedAt: new Date(),
      },
      {
        userId: professional1.id,
        type: 'BONUS',
        status: 'COMPLETED',
        amount: 85.50,
        description: 'Recebimento por serviço de encanamento',
        processedAt: new Date(),
      },
      {
        userId: client2.id,
        type: 'PAYMENT',
        status: 'PENDING',
        amount: 120.00,
        description: 'Pagamento por serviço elétrico',
        paymentMethod: 'credit-card',
        cardLast4: '1234',
        cardBrand: 'Visa',
      },
    ]
  });

  // Create sample support tickets
  console.log('🎫 Creating sample support tickets...');
  const supportTicket = await prisma.supportTicket.create({
    data: {
      userId: client1.id,
      subject: 'Problema com pagamento',
      description: 'Não consegui finalizar o pagamento pelo cartão de crédito.',
      status: 'OPEN',
      priority: 'HIGH',
      responses: {
        create: [
          {
            content: 'Olá! Recebemos sua solicitação e vamos analisar o problema.',
            isStaff: true,
          },
          {
            content: 'Obrigado pelo retorno rápido!',
            isStaff: false,
          },
        ]
      }
    }
  });

  // Create activity logs
  console.log('📊 Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        userId: client1.id,
        action: 'LOGIN',
        details: JSON.stringify({ userAgent: 'Mozilla/5.0...', success: true }),
        ipAddress: '192.168.1.100',
      },
      {
        userId: professional1.id,
        action: 'SERVICE_COMPLETED',
        details: JSON.stringify({ serviceId: 'srv_123', amount: 85.50 }),
        ipAddress: '192.168.1.101',
      },
      {
        action: 'SYSTEM_MAINTENANCE',
        details: JSON.stringify({ type: 'database_backup', duration: '5min' }),
      },
    ]
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`
📊 Created:
- ${await prisma.user.count()} users
- ${await prisma.professionalProfile.count()} professional profiles
- ${await prisma.message.count()} messages
- ${await prisma.transaction.count()} transactions
- ${await prisma.supportTicket.count()} support tickets
- ${await prisma.systemConfig.count()} system configurations
`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });