import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@rentalcar/database';
import { AppModule } from '../src/app.module';

/**
 * Regression suite for the P0/P1 fixes made in this pass of the platform
 * audit (docs/AUDIT.md): server-side rental pricing, the double-booking
 * race, JWT access/refresh token confusion, and the cross-tenant reads on
 * agency stats / the availability calendar. Complements
 * tenancy.e2e-spec.ts, which covers the earlier AgencyUser.agencyId fix.
 *
 * Runs against a real, disposable Postgres database — never a shared or
 * production DATABASE_URL — using its own uniquely-prefixed fixtures so it
 * can run alongside tenancy.e2e-spec.ts without interference.
 */
describe('Security fixes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const PASSWORD = 'testpass123';
  let passwordHash: string;

  let agencyA: { id: number };
  let agencyB: { id: number };
  let adminA: { id: number; email: string };
  let adminB: { id: number; email: string };
  let superAdmin: { id: number; email: string };
  let carA: { id: number; price: number };

  let tokenA: string;
  let tokenB: string;
  let tokenSuper: string;

  const clientEmail = 'client@secfix-test.local';
  const clientPassword = 'clientpass123';
  let clientToken: string;
  let clientRefreshToken: string;

  const login = async (email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    return { accessToken: res.body.accessToken, refreshToken: res.body.refreshToken };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    prisma = new PrismaClient();
    await prisma.$connect();

    passwordHash = await bcrypt.hash(PASSWORD, 12);

    // Clean slate for this suite's own fixtures only.
    await prisma.rental.deleteMany({ where: { client: { email: clientEmail } } });
    await prisma.client.deleteMany({ where: { email: clientEmail } });
    await prisma.car.deleteMany({ where: { registration: { startsWith: 'SECFIX-' } } });
    await prisma.agency.deleteMany({ where: { name: { startsWith: 'SecFix Test' } } });
    await prisma.agencyUser.deleteMany({ where: { email: { contains: '@secfix-test.local' } } });

    agencyA = await prisma.agency.create({
      data: {
        name: 'SecFix Test Agency A',
        address: '1 Test St',
        email: 'agency-a@secfix-test.local',
        telephone: '0000000001',
        responsibleId: (
          await prisma.agencyUser.create({
            data: {
              name: 'Resp',
              firstname: 'A',
              email: 'responsible-a@secfix-test.local',
              password: passwordHash,
              role: 'admin',
            },
          })
        ).id,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: 'SecFix Test Agency B',
        address: '2 Test St',
        email: 'agency-b@secfix-test.local',
        telephone: '0000000002',
        responsibleId: (
          await prisma.agencyUser.create({
            data: {
              name: 'Resp',
              firstname: 'B',
              email: 'responsible-b@secfix-test.local',
              password: passwordHash,
              role: 'admin',
            },
          })
        ).id,
      },
    });

    adminA = await prisma.agencyUser.create({
      data: {
        name: 'Admin',
        firstname: 'A',
        email: 'admin-a@secfix-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: agencyA.id,
      },
    });

    adminB = await prisma.agencyUser.create({
      data: {
        name: 'Admin',
        firstname: 'B',
        email: 'admin-b@secfix-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: agencyB.id,
      },
    });

    superAdmin = await prisma.agencyUser.create({
      data: {
        name: 'Super',
        firstname: 'Admin',
        email: 'superadmin@secfix-test.local',
        password: passwordHash,
        role: 'superAdmin',
      },
    });

    carA = await prisma.car.create({
      data: {
        agencyId: agencyA.id,
        brand: 'TestBrand',
        model: 'TestModel',
        year: 2023,
        mileage: 1000,
        price: 100,
        registration: 'SECFIX-A-CAR',
        fuel: 'Gasoline',
        door: 4,
        gearBox: 'Automatic',
      },
    });

    const a = await login(adminA.email, PASSWORD);
    tokenA = a.accessToken;
    const b = await login(adminB.email, PASSWORD);
    tokenB = b.accessToken;
    const s = await login(superAdmin.email, PASSWORD);
    tokenSuper = s.accessToken;

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      firstname: 'Client',
      name: 'SecFix',
      email: clientEmail,
      password: clientPassword,
      telephone: '0000000003',
      numPermis: 'DL123456789',
      address: '3 Test St',
      city: 'Testville',
    });
    expect(registerRes.status).toBe(201);

    const clientLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: clientEmail, password: clientPassword });
    expect(clientLoginRes.status).toBe(200);
    clientToken = clientLoginRes.body.accessToken;
    clientRefreshToken = clientLoginRes.body.refreshToken;
  });

  afterAll(async () => {
    await prisma.rental.deleteMany({ where: { client: { email: clientEmail } } });
    await prisma.client.deleteMany({ where: { email: clientEmail } });
    await prisma.car.deleteMany({ where: { registration: { startsWith: 'SECFIX-' } } });
    await prisma.agency.deleteMany({ where: { name: { startsWith: 'SecFix Test' } } });
    await prisma.agencyUser.deleteMany({ where: { email: { contains: '@secfix-test.local' } } });
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /rentals — price is always computed server-side', () => {
    const futureDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().slice(0, 10);
    };

    it('rejects a client-supplied total outright (DTO no longer accepts the field)', async () => {
      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          carId: carA.id,
          startDate: futureDate(30),
          endDate: futureDate(33),
          startTime: `${futureDate(30)}T10:00:00Z`,
          endTime: `${futureDate(33)}T10:00:00Z`,
          total: 1, // an attacker's attempted price override
        });
      expect(res.status).toBe(400);
    });

    it('computes total from car.price × days, ignoring any client input', async () => {
      const start = futureDate(30);
      const end = futureDate(33); // 3 days
      const res = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          carId: carA.id,
          startDate: start,
          endDate: end,
          startTime: `${start}T10:00:00Z`,
          endTime: `${end}T10:00:00Z`,
        });
      expect(res.status).toBe(201);
      expect(res.body.total).toBe(carA.price * 3);
    });
  });

  describe('POST /rentals — double-booking is rejected', () => {
    const futureDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().slice(0, 10);
    };

    it('rejects a second booking that overlaps an existing reserved rental for the same car', async () => {
      const start = futureDate(60);
      const end = futureDate(63);

      const first = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          carId: carA.id,
          startDate: start,
          endDate: end,
          startTime: `${start}T10:00:00Z`,
          endTime: `${end}T10:00:00Z`,
        });
      expect(first.status).toBe(201);

      const countBefore = await prisma.rental.count({
        where: { carId: carA.id, status: { in: ['reserved', 'ongoing'] } },
      });

      // Overlaps by one day (starts the day before the first rental ends).
      const overlapStart = futureDate(62);
      const overlapEnd = futureDate(65);
      const second = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          carId: carA.id,
          startDate: overlapStart,
          endDate: overlapEnd,
          startTime: `${overlapStart}T10:00:00Z`,
          endTime: `${overlapEnd}T10:00:00Z`,
        });
      expect(second.status).toBe(409);

      const countAfter = await prisma.rental.count({
        where: { carId: carA.id, status: { in: ['reserved', 'ongoing'] } },
      });
      expect(countAfter).toBe(countBefore);
    });
  });

  describe('JWT tokenType — access and refresh tokens are not interchangeable', () => {
    it('rejects a refresh token used as a Bearer access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${clientRefreshToken}`);
      expect(res.status).toBe(401);
    });

    it('rejects an access token submitted to /auth/refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: clientToken });
      expect(res.status).toBe(401);
    });

    it('a genuine refresh token still works at /auth/refresh', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: clientRefreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('GET /agencies/:id/stats — ownership check', () => {
    it('rejects an admin reading another agency\'s stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/agencies/${agencyB.id}/stats`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('lets an admin read their own agency\'s stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/agencies/${agencyA.id}/stats`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });

    it('lets a superAdmin read any agency\'s stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/agencies/${agencyB.id}/stats`)
        .set('Authorization', `Bearer ${tokenSuper}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /cars/:id/availability/calendar — ownership check', () => {
    it('rejects an admin reading another agency\'s car calendar', async () => {
      const res = await request(app.getHttpServer())
        .get(`/cars/${carA.id}/availability/calendar?year=2026`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it('lets the owning agency admin read their own car\'s calendar', async () => {
      const res = await request(app.getHttpServer())
        .get(`/cars/${carA.id}/availability/calendar?year=2026`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /rentals — closed to agency staff (client/admin id-space collision fix)', () => {
    it('rejects an agency admin calling the client-scoped rentals list', async () => {
      const res = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('still works for an actual client', async () => {
      const res = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${clientToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('GET /agencies — public listing does not leak admin login emails', () => {
    it('excludes AgencyUser.email from the public response', async () => {
      const res = await request(app.getHttpServer()).get('/agencies');
      expect(res.status).toBe(200);
      const found = res.body.data.find((a: { id: number }) => a.id === agencyA.id);
      expect(found).toBeDefined();
      expect(found.AgencyUser?.email).toBeUndefined();
    });
  });
});
