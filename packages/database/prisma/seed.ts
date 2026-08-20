import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password — cost 12, matching every other password hash in the app
  // (auth.service.ts, super-admin.service.ts).
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const clientPassword = await bcrypt.hash('Client@123', 12);

  // 1. Create Super Admin
  const superAdmin = await prisma.agencyUser.upsert({
    where: { email: 'superadmin@bthgrentalcar.com' },
    update: {},
    create: {
      firstname: 'Super',
      name: 'Admin',
      email: 'superadmin@bthgrentalcar.com',
      password: hashedPassword,
      role: 'superAdmin',
      status: 'activate',
    },
  });
  console.log('Created Super Admin:', superAdmin.email);

  // ==========================================
  // AGENCY 1: BTHG Main Agency
  // Admin 1: 6 cars, 2 pending, 1 completed, 1 cancelled
  // ==========================================

  const adminUser1 = await prisma.agencyUser.upsert({
    where: { email: 'admin@bthgrentalcar.com' },
    update: {},
    create: {
      firstname: 'John',
      name: 'Smith',
      email: 'admin@bthgrentalcar.com',
      password: hashedPassword,
      role: 'admin',
      status: 'activate',
    },
  });
  console.log('Created Admin User 1:', adminUser1.email);

  const agency1 = await prisma.agency.upsert({
    where: { email: 'contact@bthgagency.com' },
    update: {},
    create: {
      name: 'BTHG Main Agency',
      address: '123 Main Street, Downtown',
      email: 'contact@bthgagency.com',
      telephone: '+1-555-0100',
      responsibleId: adminUser1.id,
      status: 'activate',
    },
  });
  console.log('Created Agency 1:', agency1.name);

  // Being Agency.responsibleId doesn't imply AgencyUser.agencyId — they're
  // separate concepts (see schema.prisma). Every tenant-scoped operation
  // keys off agencyId, so an admin with none set would be rejected by
  // requireTenantScope on their own agency's resources.
  await prisma.agencyUser.update({
    where: { id: adminUser1.id },
    data: { agencyId: agency1.id },
  });

  // Agency 1 - 6 Cars
  const cars1 = await Promise.all([
    prisma.car.upsert({
      where: { id: 1 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Toyota',
        model: 'Camry',
        year: 2023,
        mileage: 15000,
        price: 75.00,
        registration: 'ABC-1234',
        fuel: 'Gasoline',
        door: 4,
        gearBox: 'Automatic',
        description: 'Comfortable sedan perfect for business trips',
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 2 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Honda',
        model: 'Civic',
        year: 2024,
        mileage: 5000,
        price: 65.00,
        registration: 'XYZ-5678',
        fuel: 'Hybrid',
        door: 4,
        gearBox: 'Automatic',
        description: 'Fuel-efficient hybrid for eco-conscious drivers',
        image: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 3 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Ford',
        model: 'Mustang',
        year: 2023,
        mileage: 8000,
        price: 120.00,
        registration: 'MUS-0001',
        fuel: 'Gasoline',
        door: 2,
        gearBox: 'Manual',
        description: 'Iconic American muscle car',
        image: 'https://images.unsplash.com/photo-1584345604476-8ec5f82d718c?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 4 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Chevrolet',
        model: 'Malibu',
        year: 2022,
        mileage: 25000,
        price: 55.00,
        registration: 'CHV-0002',
        fuel: 'Gasoline',
        door: 4,
        gearBox: 'Automatic',
        description: 'Reliable midsize sedan',
        image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 5 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Nissan',
        model: 'Altima',
        year: 2023,
        mileage: 12000,
        price: 60.00,
        registration: 'NIS-0003',
        fuel: 'Gasoline',
        door: 4,
        gearBox: 'Automatic',
        description: 'Comfortable and efficient',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 6 },
      update: {},
      create: {
        agencyId: agency1.id,
        brand: 'Hyundai',
        model: 'Sonata',
        year: 2024,
        mileage: 3000,
        price: 70.00,
        registration: 'HYN-0004',
        fuel: 'Hybrid',
        door: 4,
        gearBox: 'Automatic',
        description: 'Modern hybrid technology',
        image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=500',
      },
    }),
  ]);
  console.log(`Created 6 cars for Agency 1`);

  // ==========================================
  // AGENCY 2: Premium Auto Rentals
  // Admin 2: 3 cars, 1 pending
  // ==========================================

  const adminUser2 = await prisma.agencyUser.upsert({
    where: { email: 'admin2@bthgrentalcar.com' },
    update: {},
    create: {
      firstname: 'Sarah',
      name: 'Johnson',
      email: 'admin2@bthgrentalcar.com',
      password: hashedPassword,
      role: 'admin',
      status: 'activate',
    },
  });
  console.log('Created Admin User 2:', adminUser2.email);

  const agency2 = await prisma.agency.upsert({
    where: { email: 'contact@premiumauto.com' },
    update: {},
    create: {
      name: 'Premium Auto Rentals',
      address: '456 Luxury Boulevard, Uptown',
      email: 'contact@premiumauto.com',
      telephone: '+1-555-0200',
      responsibleId: adminUser2.id,
      status: 'activate',
    },
  });
  console.log('Created Agency 2:', agency2.name);

  await prisma.agencyUser.update({
    where: { id: adminUser2.id },
    data: { agencyId: agency2.id },
  });

  // Agency 2 - 3 Cars
  const cars2 = await Promise.all([
    prisma.car.upsert({
      where: { id: 7 },
      update: {},
      create: {
        agencyId: agency2.id,
        brand: 'BMW',
        model: '5 Series',
        year: 2024,
        mileage: 8000,
        price: 150.00,
        registration: 'BMW-0001',
        fuel: 'Gasoline',
        door: 4,
        gearBox: 'Automatic',
        description: 'Luxury executive sedan with premium features',
        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 8 },
      update: {},
      create: {
        agencyId: agency2.id,
        brand: 'Mercedes-Benz',
        model: 'E-Class',
        year: 2024,
        mileage: 3000,
        price: 175.00,
        registration: 'MBZ-0002',
        fuel: 'Diesel',
        door: 4,
        gearBox: 'Automatic',
        description: 'Elegant and powerful German engineering',
        image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=500',
      },
    }),
    prisma.car.upsert({
      where: { id: 9 },
      update: {},
      create: {
        agencyId: agency2.id,
        brand: 'Audi',
        model: 'A6',
        year: 2023,
        mileage: 12000,
        price: 140.00,
        registration: 'AUD-0003',
        fuel: 'Hybrid',
        door: 4,
        gearBox: 'Automatic',
        description: 'Sporty luxury with advanced technology',
        image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500',
      },
    }),
  ]);
  console.log(`Created 3 cars for Agency 2`);

  // ==========================================
  // CLIENTS
  // ==========================================

  const client1 = await prisma.client.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      firstname: 'Jane',
      name: 'Doe',
      email: 'client@example.com',
      password: clientPassword,
      telephone: '+1-555-0300',
      numPermis: 'DL123456789',
      address: '456 Oak Avenue',
      city: 'New York',
      role: 'user',
      status: 'activate',
      emailVerified: true,
    },
  });
  console.log('Created Client 1:', client1.email);

  const client2 = await prisma.client.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      firstname: 'Mike',
      name: 'Wilson',
      email: 'mike@example.com',
      password: clientPassword,
      telephone: '+1-555-0400',
      numPermis: 'DL987654321',
      address: '789 Pine Street',
      city: 'Los Angeles',
      role: 'user',
      status: 'activate',
      emailVerified: true,
    },
  });
  console.log('Created Client 2:', client2.email);

  const client3 = await prisma.client.upsert({
    where: { email: 'emma@example.com' },
    update: {},
    create: {
      firstname: 'Emma',
      name: 'Brown',
      email: 'emma@example.com',
      password: clientPassword,
      telephone: '+1-555-0500',
      numPermis: 'DL555666777',
      address: '321 Maple Drive',
      city: 'Chicago',
      role: 'user',
      status: 'activate',
      emailVerified: true,
    },
  });
  console.log('Created Client 3:', client3.email);

  // ==========================================
  // RENTALS FOR AGENCY 1
  // 2 pending (reserved), 1 completed, 1 cancelled
  // ==========================================

  // Pending 1 - Toyota Camry
  const startDate1 = new Date();
  startDate1.setDate(startDate1.getDate() + 1);
  const endDate1 = new Date();
  endDate1.setDate(endDate1.getDate() + 4);

  await prisma.rental.upsert({
    where: { id: 1 },
    update: {},
    create: {
      clientId: client1.id,
      carId: cars1[0].id, // Toyota Camry
      startDate: startDate1,
      endDate: endDate1,
      startTime: new Date(startDate1.setHours(10, 0, 0)),
      endTime: new Date(endDate1.setHours(10, 0, 0)),
      total: 225.00,
      status: 'reserved',
    },
  });
  console.log('Created Rental #1 (Agency 1 - Toyota Camry - RESERVED)');

  // Pending 2 - Ford Mustang
  const startDate2 = new Date();
  startDate2.setDate(startDate2.getDate() + 5);
  const endDate2 = new Date();
  endDate2.setDate(endDate2.getDate() + 7);

  await prisma.rental.upsert({
    where: { id: 2 },
    update: {},
    create: {
      clientId: client2.id,
      carId: cars1[2].id, // Ford Mustang
      startDate: startDate2,
      endDate: endDate2,
      startTime: new Date(startDate2.setHours(9, 0, 0)),
      endTime: new Date(endDate2.setHours(18, 0, 0)),
      total: 240.00,
      status: 'reserved',
    },
  });
  console.log('Created Rental #2 (Agency 1 - Ford Mustang - RESERVED)');

  // Completed - Honda Civic
  const startDate3 = new Date();
  startDate3.setDate(startDate3.getDate() - 10);
  const endDate3 = new Date();
  endDate3.setDate(endDate3.getDate() - 7);

  await prisma.rental.upsert({
    where: { id: 3 },
    update: {},
    create: {
      clientId: client3.id,
      carId: cars1[1].id, // Honda Civic
      startDate: startDate3,
      endDate: endDate3,
      startTime: new Date(startDate3.setHours(8, 0, 0)),
      endTime: new Date(endDate3.setHours(20, 0, 0)),
      total: 195.00,
      status: 'completed',
    },
  });
  console.log('Created Rental #3 (Agency 1 - Honda Civic - COMPLETED)');

  // Cancelled - Chevrolet Malibu
  const startDate4 = new Date();
  startDate4.setDate(startDate4.getDate() - 5);
  const endDate4 = new Date();
  endDate4.setDate(endDate4.getDate() - 2);

  await prisma.rental.upsert({
    where: { id: 4 },
    update: {},
    create: {
      clientId: client1.id,
      carId: cars1[3].id, // Chevrolet Malibu
      startDate: startDate4,
      endDate: endDate4,
      startTime: new Date(startDate4.setHours(10, 0, 0)),
      endTime: new Date(endDate4.setHours(10, 0, 0)),
      total: 165.00,
      status: 'cancelled',
    },
  });
  console.log('Created Rental #4 (Agency 1 - Chevrolet Malibu - CANCELLED)');

  // ==========================================
  // RENTALS FOR AGENCY 2
  // 1 pending (reserved)
  // ==========================================

  const startDate5 = new Date();
  startDate5.setDate(startDate5.getDate() + 2);
  const endDate5 = new Date();
  endDate5.setDate(endDate5.getDate() + 5);

  await prisma.rental.upsert({
    where: { id: 5 },
    update: {},
    create: {
      clientId: client2.id,
      carId: cars2[0].id, // BMW 5 Series
      startDate: startDate5,
      endDate: endDate5,
      startTime: new Date(startDate5.setHours(9, 0, 0)),
      endTime: new Date(endDate5.setHours(18, 0, 0)),
      total: 450.00,
      status: 'reserved',
    },
  });
  console.log('Created Rental #5 (Agency 2 - BMW 5 Series - RESERVED)');

  console.log('\n✅ Seeding completed!');
  console.log('\n📋 Summary:');
  console.log('==========================================');
  console.log('AGENCY 1 (BTHG Main Agency):');
  console.log('  - 6 Cars: Toyota Camry, Honda Civic, Ford Mustang,');
  console.log('            Chevrolet Malibu, Nissan Altima, Hyundai Sonata');
  console.log('  - 4 Rentals: 2 Reserved, 1 Completed, 1 Cancelled');
  console.log('  - Available Cars: 4 (2 reserved)');
  console.log('------------------------------------------');
  console.log('AGENCY 2 (Premium Auto Rentals):');
  console.log('  - 3 Cars: BMW 5 Series, Mercedes E-Class, Audi A6');
  console.log('  - 1 Rental: 1 Reserved');
  console.log('  - Available Cars: 2 (1 reserved)');
  console.log('==========================================');
  console.log('\n📋 Test Credentials:');
  console.log('==========================================');
  console.log('SUPER ADMIN:');
  console.log('  Email: superadmin@bthgrentalcar.com');
  console.log('  Password: Admin@123');
  console.log('------------------------------------------');
  console.log('ADMIN 1 (BTHG Main Agency):');
  console.log('  Email: admin@bthgrentalcar.com');
  console.log('  Password: Admin@123');
  console.log('------------------------------------------');
  console.log('ADMIN 2 (Premium Auto Rentals):');
  console.log('  Email: admin2@bthgrentalcar.com');
  console.log('  Password: Admin@123');
  console.log('------------------------------------------');
  console.log('CLIENTS:');
  console.log('  client@example.com / Client@123');
  console.log('  mike@example.com / Client@123');
  console.log('  emma@example.com / Client@123');
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
