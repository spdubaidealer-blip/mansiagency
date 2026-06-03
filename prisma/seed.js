const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log('Seeding database...');

  // Clear existing records to start fresh
  await prisma.admin.deleteMany({});
  await prisma.ratePackage.deleteMany({});
  await prisma.paymentSetting.deleteMany({});
  await prisma.announcement.deleteMany({});

  // Seed Admin credentials
  const adminPassword = 'Mansi_Admin_Secure_9988#';
  const hashedPassword = crypto.createHash('sha256').update(adminPassword).digest('hex');

  await prisma.admin.create({
    data: {
      username: 'mansi_admin',
      password: hashedPassword,
    },
  });
  console.log('Seeded Admin: mansi_admin / Mansi_Admin_Secure_9988# (Hashed)');


  // Seed Chamet rates
  const rates = [
    // INR Packages
    { currency: 'INR', coins: 15000, price: 280 },
    { currency: 'INR', coins: 20000, price: 370 },
    { currency: 'INR', coins: 50000, price: 900 },
    { currency: 'INR', coins: 100000, price: 1750 },
    { currency: 'INR', coins: 200000, price: 3450 },
    { currency: 'INR', coins: 500000, price: 8600 },
    { currency: 'INR', coins: 1000000, price: 17400 },
    
    // AED Packages
    { currency: 'AED', coins: 15000, price: 12 },
    { currency: 'AED', coins: 50000, price: 38 },
    { currency: 'AED', coins: 100000, price: 75 },
    { currency: 'AED', coins: 200000, price: 145 },
    { currency: 'AED', coins: 500000, price: 360 },
    { currency: 'AED', coins: 1000000, price: 710 },
    { currency: 'AED', coins: 10350000, price: 750 },
  ];

  for (const rate of rates) {
    await prisma.ratePackage.create({ data: rate });
  }
  console.log(`Seeded ${rates.length} rate packages.`);

  // Seed default PaymentSettings
  const settings = [
    { type: 'UPI', details: 'mansidiamond@upi', qrImageUrl: '/uploads/default-upi-qr.png' },
    { type: 'BotimPay', details: '+971501234567', qrImageUrl: '' },
    { type: 'duPay', details: '+971501234567', qrImageUrl: '' },
    { type: 'eMoney', details: '+971501234567', qrImageUrl: '' },
  ];

  for (const setting of settings) {
    await prisma.paymentSetting.create({ data: setting });
  }
  console.log('Seeded default payment settings.');

  // Seed a default announcement
  await prisma.announcement.create({
    data: {
      message: 'Welcome to Mansi Diamond Agency! Get cheap and fast Chamet top-ups within minutes. 🚀 Contact support for bulk queries.',
      isActive: true,
    },
  });
  console.log('Seeded default announcement.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
