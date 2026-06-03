const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log('Seeding database safely...');

  // Seed Admin credentials using upsert (does not delete existing users)
  const adminPassword = 'Mansi_Admin_Secure_9988#';
  const hashedPassword = crypto.createHash('sha256').update(adminPassword).digest('hex');

  await prisma.admin.upsert({
    where: { username: 'mansi_admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'mansi_admin',
      password: hashedPassword,
    },
  });
  console.log('Seeded Admin: mansi_admin / Mansi_Admin_Secure_9988# (Safe Upsert)');

  // Seed Chamet rates only if table is empty
  const rateCount = await prisma.ratePackage.count();
  if (rateCount === 0) {
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
  } else {
    console.log('Rate packages already exist. Skipping rate seeding.');
  }

  // Seed default PaymentSettings only if empty
  const settingsCount = await prisma.paymentSetting.count();
  if (settingsCount === 0) {
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
  } else {
    console.log('Payment settings already exist. Skipping settings seeding.');
  }

  // Seed a default announcement only if empty
  const announcementCount = await prisma.announcement.count();
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: {
        message: 'Welcome to Mansi Diamond Agency! Get cheap and fast Chamet top-ups within minutes. 🚀 Contact support for bulk queries.',
        isActive: true,
      },
    });
    console.log('Seeded default announcement.');
  } else {
    console.log('Announcement already exists. Skipping announcement seeding.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
