import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.session.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.expenseParticipant.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test users
  console.log('👤 Creating users...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Smith',
      passwordHash,
      emailVerified: true,
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Johnson',
      passwordHash,
      emailVerified: true,
      defaultCurrency: 'USD',
      timezone: 'America/Los_Angeles',
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@example.com',
      name: 'Carol Williams',
      passwordHash,
      emailVerified: true,
      defaultCurrency: 'EUR',
      timezone: 'Europe/London',
    },
  });

  const dave = await prisma.user.create({
    data: {
      email: 'dave@example.com',
      name: 'Dave Brown',
      passwordHash,
      emailVerified: true,
      defaultCurrency: 'USD',
      timezone: 'America/Chicago',
    },
  });

  console.log(`✅ Created ${[alice, bob, carol, dave].length} users`);

  // Create test groups
  console.log('👥 Creating groups...');

  const roommates = await prisma.group.create({
    data: {
      name: 'Roommates',
      description: 'Shared apartment expenses',
      groupType: 'home',
      defaultCurrency: 'USD',
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'admin' },
          { userId: bob.id, role: 'member' },
          { userId: carol.id, role: 'member' },
        ],
      },
    },
  });

  const tripGroup = await prisma.group.create({
    data: {
      name: 'Europe Trip 2025',
      description: 'Summer vacation to Europe',
      groupType: 'trip',
      defaultCurrency: 'EUR',
      createdBy: bob.id,
      members: {
        create: [
          { userId: bob.id, role: 'admin' },
          { userId: alice.id, role: 'member' },
          { userId: dave.id, role: 'member' },
        ],
      },
    },
  });

  const dinnerClub = await prisma.group.create({
    data: {
      name: 'Dinner Club',
      description: 'Monthly dinner meetups',
      groupType: 'friends',
      defaultCurrency: 'USD',
      createdBy: carol.id,
      members: {
        create: [
          { userId: carol.id, role: 'admin' },
          { userId: alice.id, role: 'member' },
          { userId: bob.id, role: 'member' },
          { userId: dave.id, role: 'member' },
        ],
      },
    },
  });

  console.log(`✅ Created ${[roommates, tripGroup, dinnerClub].length} groups`);

  // Create test expenses
  console.log('💰 Creating expenses...');

  // Roommates expenses
  const expense1 = await prisma.expense.create({
    data: {
      groupId: roommates.id,
      amount: 1200,
      currency: 'USD',
      description: 'Monthly rent',
      category: 'rent',
      date: new Date('2025-11-01'),
      createdBy: alice.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: alice.id, paidAmount: 1200, owedAmount: 400 },
          { userId: bob.id, paidAmount: 0, owedAmount: 400 },
          { userId: carol.id, paidAmount: 0, owedAmount: 400 },
        ],
      },
    },
  });

  const expense2 = await prisma.expense.create({
    data: {
      groupId: roommates.id,
      amount: 85.50,
      currency: 'USD',
      description: 'Electricity bill',
      category: 'utilities',
      date: new Date('2025-11-15'),
      createdBy: bob.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: alice.id, paidAmount: 0, owedAmount: 28.50 },
          { userId: bob.id, paidAmount: 85.50, owedAmount: 28.50 },
          { userId: carol.id, paidAmount: 0, owedAmount: 28.50 },
        ],
      },
    },
  });

  const expense3 = await prisma.expense.create({
    data: {
      groupId: roommates.id,
      amount: 127.48,
      currency: 'USD',
      description: 'Grocery shopping',
      category: 'groceries',
      date: new Date('2025-11-18'),
      createdBy: carol.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: alice.id, paidAmount: 0, owedAmount: 42.49 },
          { userId: bob.id, paidAmount: 0, owedAmount: 42.49 },
          { userId: carol.id, paidAmount: 127.48, owedAmount: 42.50 },
        ],
      },
    },
  });

  // Trip expenses
  const expense4 = await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      amount: 450,
      currency: 'EUR',
      description: 'Hotel in Paris',
      category: 'travel',
      date: new Date('2025-11-10'),
      createdBy: bob.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: bob.id, paidAmount: 450, owedAmount: 150 },
          { userId: alice.id, paidAmount: 0, owedAmount: 150 },
          { userId: dave.id, paidAmount: 0, owedAmount: 150 },
        ],
      },
    },
  });

  const expense5 = await prisma.expense.create({
    data: {
      groupId: tripGroup.id,
      amount: 89.75,
      currency: 'EUR',
      description: 'Dinner at French restaurant',
      category: 'food_dining',
      date: new Date('2025-11-11'),
      createdBy: alice.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: bob.id, paidAmount: 0, owedAmount: 29.92 },
          { userId: alice.id, paidAmount: 89.75, owedAmount: 29.92 },
          { userId: dave.id, paidAmount: 0, owedAmount: 29.91 },
        ],
      },
    },
  });

  // Dinner club expense
  const expense6 = await prisma.expense.create({
    data: {
      groupId: dinnerClub.id,
      amount: 156.80,
      currency: 'USD',
      description: 'Italian restaurant',
      category: 'food_dining',
      date: new Date('2025-11-20'),
      createdBy: dave.id,
      splitMethod: 'equal',
      participants: {
        create: [
          { userId: alice.id, paidAmount: 0, owedAmount: 39.20 },
          { userId: bob.id, paidAmount: 0, owedAmount: 39.20 },
          { userId: carol.id, paidAmount: 0, owedAmount: 39.20 },
          { userId: dave.id, paidAmount: 156.80, owedAmount: 39.20 },
        ],
      },
    },
  });

  console.log(
    `✅ Created ${[expense1, expense2, expense3, expense4, expense5, expense6].length} expenses`
  );

  // Create test settlements
  console.log('💸 Creating settlements...');

  const settlement1 = await prisma.settlement.create({
    data: {
      groupId: roommates.id,
      payerId: bob.id,
      payeeId: alice.id,
      amount: 400,
      currency: 'USD',
      paymentMethod: 'bank_transfer',
      confirmed: true,
      confirmedAt: new Date(),
      confirmedBy: alice.id,
      date: new Date('2025-11-05'),
    },
  });

  const settlement2 = await prisma.settlement.create({
    data: {
      groupId: tripGroup.id,
      payerId: dave.id,
      payeeId: bob.id,
      amount: 150,
      currency: 'EUR',
      paymentMethod: 'venmo',
      confirmed: false,
      date: new Date('2025-11-12'),
    },
  });

  console.log(`✅ Created ${[settlement1, settlement2].length} settlements`);

  // Create test notifications
  console.log('🔔 Creating notifications...');

  await prisma.notification.create({
    data: {
      userId: bob.id,
      type: 'expense_created',
      title: 'New expense added',
      message: 'Alice added "Monthly rent" for $1,200.00',
      expenseId: expense1.id,
      groupId: roommates.id,
      channels: ['push', 'email'],
      deliveredAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: alice.id,
      type: 'settlement_created',
      title: 'Payment received',
      message: 'Bob paid you $400.00',
      settlementId: settlement1.id,
      groupId: roommates.id,
      channels: ['push'],
      deliveredAt: new Date(),
      read: true,
      readAt: new Date(),
    },
  });

  console.log('✅ Created notifications');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Users: 4 (alice, bob, carol, dave)`);
  console.log(`   Groups: 3 (Roommates, Europe Trip 2025, Dinner Club)`);
  console.log(`   Expenses: 6`);
  console.log(`   Settlements: 2`);
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('   Email: alice@example.com, bob@example.com, carol@example.com, dave@example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
