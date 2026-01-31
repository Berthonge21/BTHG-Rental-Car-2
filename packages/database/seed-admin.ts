import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  // Create SuperAdmin user
  const superAdmin = await prisma.agencyUser.upsert({
    where: { email: 'superadmin@automobelite.com' },
    update: {},
    create: {
      name: 'Super',
      firstname: 'Admin',
      email: 'superadmin@automobelite.com',
      password: hashedPassword,
      role: 'superAdmin',
      status: 'activate',
    },
  });

  console.log('SuperAdmin created:', superAdmin);

  // Create Admin user (will be assigned to agency later)
  const admin = await prisma.agencyUser.upsert({
    where: { email: 'admin@automobelite.com' },
    update: {},
    create: {
      name: 'Agency',
      firstname: 'Admin',
      email: 'admin@automobelite.com',
      password: hashedPassword,
      role: 'admin',
      status: 'activate',
    },
  });

  console.log('Admin created:', admin);

  // Create an Agency with the admin as responsible
  const agency = await prisma.agency.upsert({
    where: { name: 'AutoMobile Elite' },
    update: {},
    create: {
      name: 'AutoMobile Elite',
      address: '123 Main Street, Port-au-Prince',
      email: 'contact@automobelite.com',
      telephone: '+509 1234 5678',
      responsibleId: admin.id,
      status: 'activate',
    },
  });

  console.log('Agency created:', agency);

  // Create a sample car for testing
  const car = await prisma.car.upsert({
    where: { id: 1 },
    update: {},
    create: {
      agencyId: agency.id,
      brand: 'Toyota',
      model: 'Camry',
      year: 2023,
      mileage: 15000,
      price: 75.00,
      registration: 'ABC-1234',
      fuel: 'Gasoline',
      door: 4,
      gearBox: 'Automatic',
      description: 'Reliable and comfortable sedan perfect for city driving',
    },
  });

  console.log('Car created:', car);

  console.log('\n--- Test Credentials ---');
  console.log('SuperAdmin: superadmin@automobelite.com / Admin@123');
  console.log('Admin: admin@automobelite.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
