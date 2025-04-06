const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Buat paket/plan
  const freePlan = await prisma.plan.upsert({
    where: { id: 'free' },
    update: {},
    create: {
      id: 'free',
      name: 'Free',
      price: 'Rp 0',
      period: '',
      maxAccounts: 1,
      maxMessages: 50,
      features: JSON.stringify([
        '1 Nomor WhatsApp',
        '50 pesan/bulan',
        'API Basic'
      ])
    }
  });
  
  const proPlan = await prisma.plan.upsert({
    where: { id: 'professional' },
    update: {},
    create: {
      id: 'professional',
      name: 'Professional',
      price: 'Rp 299.000',
      period: '/bulan',
      maxAccounts: 5,
      maxMessages: 10000,
      features: JSON.stringify([
        '5 Nomor WhatsApp',
        '10.000 pesan/bulan',
        'API & Webhook'
      ])
    }
  });
  
  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'enterprise' },
    update: {},
    create: {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Rp 999.000',
      period: '/bulan',
      maxAccounts: 100,
      maxMessages: 1000000,
      features: JSON.stringify([
        '100 Nomor WhatsApp',
        '1.000.000 pesan/bulan',
        'Full API Access'
      ])
    }
  });
  
  // Buat akun admin
  const passwordHash = await hash('Hexanest@2024', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'hexanest@hexanest.id' },
    update: { role: 'admin' },
    create: {
      email: 'hexanest@hexanest.id',
      password: passwordHash,
      name: 'Hexanest Admin',
      role: 'admin',
      planId: 'professional',
      isActive: true
    }
  });
  
  console.log({ freePlan, proPlan, enterprisePlan, admin });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 