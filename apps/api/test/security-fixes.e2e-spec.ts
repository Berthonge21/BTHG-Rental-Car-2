import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@rentalcar/database';
import { AppModule } from '../src/app.module';
import { RentalLifecycleService } from '../src/modules/rentals/rental-lifecycle.service';

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
    // AuditLog.actorEmail is deliberately not a foreign key (entries must
    // survive actor deletion), so it needs its own explicit cleanup here.
    await prisma.auditLog.deleteMany({
      where: {
        OR: [{ actorEmail: { contains: '@secfix-test.local' } }, { actorEmail: clientEmail }],
      },
    });
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

  describe('Rental status transitions are validated server-side', () => {
    const futureDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().slice(0, 10);
    };

    // Each call must book a non-overlapping window — otherwise it would
    // legitimately hit the same booking-conflict check tested elsewhere.
    let dayOffset = 200;
    const createReservedRental = async () => {
      const start = futureDate(dayOffset);
      const end = futureDate(dayOffset + 3);
      dayOffset += 4;
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
      return res.body.id as number;
    };

    it('admin PATCH rejects an invalid transition (reserved -> completed, skipping ongoing)', async () => {
      const rentalId = await createReservedRental();
      const res = await request(app.getHttpServer())
        .patch(`/admin/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed' });
      expect(res.status).toBe(400);
    });

    it('admin PATCH allows the real graph: reserved -> ongoing -> completed', async () => {
      const rentalId = await createReservedRental();

      const toOngoing = await request(app.getHttpServer())
        .patch(`/admin/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'ongoing' });
      expect(toOngoing.status).toBe(200);

      const toCompleted = await request(app.getHttpServer())
        .patch(`/admin/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'completed' });
      expect(toCompleted.status).toBe(200);

      // and now it's terminal — nothing should move it further
      const backToReserved = await request(app.getHttpServer())
        .patch(`/admin/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'reserved' });
      expect(backToReserved.status).toBe(400);
    });

    it("client PATCH cannot move their own booking straight to 'completed' or 'ongoing'", async () => {
      const rentalId = await createReservedRental();

      const toCompleted = await request(app.getHttpServer())
        .patch(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'completed' });
      expect(toCompleted.status).toBe(403);

      const toOngoing = await request(app.getHttpServer())
        .patch(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'ongoing' });
      expect(toOngoing.status).toBe(403);

      const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
      expect(rental?.status).toBe('reserved');
    });

    it('client PATCH can still cancel their own reserved booking', async () => {
      const rentalId = await createReservedRental();
      const res = await request(app.getHttpServer())
        .patch(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'cancelled' });
      expect(res.status).toBe(200);
    });
  });

  describe('Rental lifecycle — auto-completing past-due rentals', () => {
    it('moves an ongoing rental past its endDate to completed', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 10);
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 1);

      const client = await prisma.client.findUniqueOrThrow({ where: { email: clientEmail } });
      const rental = await prisma.rental.create({
        data: {
          clientId: client.id,
          carId: carA.id,
          startDate: past,
          endDate: pastEnd,
          startTime: past,
          endTime: pastEnd,
          total: carA.price,
          status: 'ongoing',
        },
      });

      const lifecycle = app.get(RentalLifecycleService);
      await lifecycle.completePastDueRentals();

      const updated = await prisma.rental.findUnique({ where: { id: rental.id } });
      expect(updated?.status).toBe('completed');
    });

    it('does not touch an ongoing rental that has not ended yet', async () => {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 5);

      const client = await prisma.client.findUniqueOrThrow({ where: { email: clientEmail } });
      const rental = await prisma.rental.create({
        data: {
          clientId: client.id,
          carId: carA.id,
          startDate: start,
          endDate: futureEnd,
          startTime: start,
          endTime: futureEnd,
          total: carA.price,
          status: 'ongoing',
        },
      });

      const lifecycle = app.get(RentalLifecycleService);
      await lifecycle.completePastDueRentals();

      const unchanged = await prisma.rental.findUnique({ where: { id: rental.id } });
      expect(unchanged?.status).toBe('ongoing');

      await prisma.rental.delete({ where: { id: rental.id } });
    });
  });

  describe('Audit log — privileged actions are attributed to an actor', () => {
    const futureDate = (daysFromNow: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysFromNow);
      return d.toISOString().slice(0, 10);
    };

    it('records who cancelled a rental', async () => {
      const start = futureDate(300);
      const end = futureDate(303);
      const created = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          carId: carA.id,
          startDate: start,
          endDate: end,
          startTime: `${start}T10:00:00Z`,
          endTime: `${end}T10:00:00Z`,
        });
      expect(created.status).toBe(201);

      const res = await request(app.getHttpServer())
        .patch(`/rentals/${created.body.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'cancelled' });
      expect(res.status).toBe(200);

      const entry = await prisma.auditLog.findFirst({
        where: { action: 'rental.cancelled', targetType: 'Rental', targetId: created.body.id },
      });
      expect(entry).not.toBeNull();
      expect(entry?.actorEmail).toBe(clientEmail);
    });

    it("records who changed an agency's status", async () => {
      const res = await request(app.getHttpServer())
        .put(`/agencies/${agencyA.id}`)
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({ status: 'deactivate' });
      expect(res.status).toBe(200);

      const entry = await prisma.auditLog.findFirst({
        where: { action: 'agency.status_changed', targetType: 'Agency', targetId: agencyA.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(entry).not.toBeNull();
      expect(entry?.actorEmail).toBe(superAdmin.email);
      expect((entry?.metadata as Record<string, unknown> | null)?.newStatus).toBe('deactivate');

      // restore for any later tests / re-runs
      await request(app.getHttpServer())
        .put(`/agencies/${agencyA.id}`)
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({ status: 'activate' });
    });
  });

  describe('Soft delete — Car and Agency', () => {
    it('deleting a car hides it from listings but keeps the row', async () => {
      const created = await prisma.car.create({
        data: {
          agencyId: agencyA.id,
          brand: 'SoftDelete',
          model: 'TestCar',
          year: 2023,
          mileage: 1000,
          price: 40,
          registration: 'SECFIX-SOFTDEL',
          fuel: 'Gasoline',
          door: 4,
          gearBox: 'Automatic',
        },
      });

      const del = await request(app.getHttpServer())
        .delete(`/cars/${created.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(del.status).toBe(200);

      // Row still exists, just marked deleted.
      const raw = await prisma.car.findUnique({ where: { id: created.id } });
      expect(raw).not.toBeNull();
      expect(raw?.deletedAt).not.toBeNull();

      // But it's gone from every read path.
      const getOne = await request(app.getHttpServer()).get(`/cars/${created.id}`);
      expect(getOne.status).toBe(404);

      const list = await request(app.getHttpServer()).get(`/cars?agencyId=${agencyA.id}`);
      expect(list.body.data.some((c: { id: number }) => c.id === created.id)).toBe(false);
    });

    it('deleting an agency hides it from listings, deactivates it, but keeps the row', async () => {
      const respHash = await bcrypt.hash(PASSWORD, 12);
      const respUser = await prisma.agencyUser.create({
        data: {
          name: 'SoftDel',
          firstname: 'Resp',
          email: 'softdel-resp@secfix-test.local',
          password: respHash,
          role: 'admin',
        },
      });
      const agency = await prisma.agency.create({
        data: {
          name: 'SecFix Test SoftDelete Agency',
          address: '1 Test St',
          email: 'softdel-agency@secfix-test.local',
          telephone: '0000000099',
          responsibleId: respUser.id,
          status: 'activate',
        },
      });

      const del = await request(app.getHttpServer())
        .delete(`/agencies/${agency.id}`)
        .set('Authorization', `Bearer ${tokenSuper}`);
      expect(del.status).toBe(200);

      const raw = await prisma.agency.findUnique({ where: { id: agency.id } });
      expect(raw).not.toBeNull();
      expect(raw?.deletedAt).not.toBeNull();
      expect(raw?.status).toBe('deactivate');

      const getOne = await request(app.getHttpServer()).get(`/agencies/${agency.id}`);
      expect(getOne.status).toBe(404);

      const list = await request(app.getHttpServer()).get('/agencies?limit=100');
      expect(list.body.data.some((a: { id: number }) => a.id === agency.id)).toBe(false);

      await prisma.agency.delete({ where: { id: agency.id } });
      await prisma.agencyUser.delete({ where: { id: respUser.id } });
    });

    it('cannot delete a car with an active or reserved rental', async () => {
      const del = await request(app.getHttpServer())
        .delete(`/cars/${carA.id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      // carA has active/reserved rentals from earlier tests in this suite.
      expect(del.status).toBe(403);

      const raw = await prisma.car.findUnique({ where: { id: carA.id } });
      expect(raw?.deletedAt).toBeNull();
    });
  });
});
