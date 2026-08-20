import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@rentalcar/database';
import { AppModule } from '../src/app.module';

/**
 * Regression suite for the tenancy-guard + AgencyUser.agencyId fix.
 *
 * Locks in the intended security model per the platform audit:
 *  - an agency-scoped admin can never act on another agency's resources
 *  - an admin with no assigned agency is REJECTED, not silently unrestricted
 *  - a superAdmin remains genuinely unrestricted
 *  - an agency can now have more than one staff admin
 *  - the "deactivating an admin cascades to their agency" behavior stays
 *    scoped to the formal responsible admin, not every staff member
 *
 * Runs against a real, disposable Postgres database (never a shared or
 * production DATABASE_URL) so the guard, the Prisma layer, and the schema
 * are all exercised together — this is exactly where the bug lived.
 */
describe('Tenancy isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const PASSWORD = 'testpass123';
  let passwordHash: string;

  let agencyA: { id: number };
  let agencyB: { id: number };
  let adminA: { id: number; email: string };
  let adminAOther: { id: number; email: string }; // second staff admin on agency A
  let adminB: { id: number; email: string };
  let adminNoAgency: { id: number; email: string }; // the historical bug state
  let superAdmin: { id: number; email: string };

  let tokenA: string;
  let tokenAOther: string;
  let tokenB: string;
  let tokenNoAgency: string;
  let tokenSuper: string;

  const login = async (email: string, password: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/auth/admin/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    return res.body.accessToken;
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
    await prisma.car.deleteMany({ where: { registration: { startsWith: 'TEST-' } } });
    // Agency.responsibleId references AgencyUser, so agencies must go first.
    await prisma.agency.deleteMany({ where: { name: { startsWith: 'Tenancy Test' } } });
    await prisma.agencyUser.deleteMany({ where: { email: { contains: '@tenancy-test.local' } } });

    agencyA = await prisma.agency.create({
      data: {
        name: 'Tenancy Test Agency A',
        address: '1 Test St',
        email: 'agency-a@tenancy-test.local',
        telephone: '0000000001',
        responsibleId: (
          await prisma.agencyUser.create({
            data: {
              name: 'Resp',
              firstname: 'A',
              email: 'responsible-a@tenancy-test.local',
              password: passwordHash,
              role: 'admin',
            },
          })
        ).id,
      },
    });

    agencyB = await prisma.agency.create({
      data: {
        name: 'Tenancy Test Agency B',
        address: '2 Test St',
        email: 'agency-b@tenancy-test.local',
        telephone: '0000000002',
        responsibleId: (
          await prisma.agencyUser.create({
            data: {
              name: 'Resp',
              firstname: 'B',
              email: 'responsible-b@tenancy-test.local',
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
        email: 'admin-a@tenancy-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: agencyA.id,
      },
    });

    // Proves the schema fix: a SECOND staff admin on the SAME agency, which
    // the pre-fix Agency.responsibleId @unique model could not represent.
    adminAOther = await prisma.agencyUser.create({
      data: {
        name: 'Admin',
        firstname: 'A2',
        email: 'admin-a2@tenancy-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: agencyA.id,
      },
    });

    adminB = await prisma.agencyUser.create({
      data: {
        name: 'Admin',
        firstname: 'B',
        email: 'admin-b@tenancy-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: agencyB.id,
      },
    });

    // The historical bug state: role 'admin' but no agencyId at all.
    adminNoAgency = await prisma.agencyUser.create({
      data: {
        name: 'Admin',
        firstname: 'NoAgency',
        email: 'admin-noagency@tenancy-test.local',
        password: passwordHash,
        role: 'admin',
        agencyId: null,
      },
    });

    superAdmin = await prisma.agencyUser.create({
      data: {
        name: 'Super',
        firstname: 'Admin',
        email: 'superadmin@tenancy-test.local',
        password: passwordHash,
        role: 'superAdmin',
      },
    });

    tokenA = await login(adminA.email, PASSWORD);
    tokenAOther = await login(adminAOther.email, PASSWORD);
    tokenB = await login(adminB.email, PASSWORD);
    tokenNoAgency = await login(adminNoAgency.email, PASSWORD);
    tokenSuper = await login(superAdmin.email, PASSWORD);
  });

  afterAll(async () => {
    // AuditLog.actorEmail is deliberately not a foreign key (entries must
    // survive actor deletion), so it needs its own explicit cleanup here.
    await prisma.auditLog.deleteMany({ where: { actorEmail: { contains: '@tenancy-test.local' } } });
    await prisma.car.deleteMany({ where: { registration: { startsWith: 'TEST-' } } });
    // Agency.responsibleId references AgencyUser, so agencies must go first.
    await prisma.agency.deleteMany({ where: { name: { startsWith: 'Tenancy Test' } } });
    await prisma.agencyUser.deleteMany({ where: { email: { contains: '@tenancy-test.local' } } });
    await prisma.$disconnect();
    await app.close();
  });

  const carPayload = (agencyId: number, registration: string) => ({
    agencyId,
    brand: 'TestBrand',
    model: 'TestModel',
    year: 2023,
    mileage: 1000,
    price: 50,
    registration,
    fuel: 'Gasoline',
    door: 4,
    gearBox: 'Automatic',
  });

  describe('POST /cars — create', () => {
    it('lets an agency admin create a car for their own agency', async () => {
      const res = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(carPayload(agencyA.id, 'TEST-A-OWN'));
      expect(res.status).toBe(201);
    });

    it('rejects an agency admin creating a car for another agency', async () => {
      const res = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(carPayload(agencyB.id, 'TEST-A-CROSS'));
      expect(res.status).toBe(403);
    });

    it('REJECTS an admin with no assigned agency — the core regression case', async () => {
      // Before the fix: userAgencyId resolved to undefined for this admin
      // (same as a superAdmin), so `if (userAgencyId && ...)` never fired
      // and the write went through unrestricted for ANY target agency.
      const res = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${tokenNoAgency}`)
        .send(carPayload(agencyA.id, 'TEST-NOAGENCY-FAIL'));
      expect(res.status).toBe(403);

      const leaked = await prisma.car.findFirst({ where: { registration: 'TEST-NOAGENCY-FAIL' } });
      expect(leaked).toBeNull();
    });

    it('lets a superAdmin create a car for any agency', async () => {
      const res = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send(carPayload(agencyB.id, 'TEST-SUPER-B'));
      expect(res.status).toBe(201);
    });
  });

  describe('PUT/DELETE /cars/:id and availability — cross-tenant + no-agency', () => {
    let carAId: number;

    beforeAll(async () => {
      const car = await prisma.car.create({ data: carPayload(agencyA.id, 'TEST-A-MUTATE') });
      carAId = car.id;
    });

    it('rejects update from another agency admin', async () => {
      const res = await request(app.getHttpServer())
        .put(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ price: 999 });
      expect(res.status).toBe(403);
    });

    it('rejects update from an admin with no agency', async () => {
      const res = await request(app.getHttpServer())
        .put(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenNoAgency}`)
        .send({ price: 999 });
      expect(res.status).toBe(403);
    });

    it('rejects delete from another agency admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it('rejects delete from an admin with no agency', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenNoAgency}`);
      expect(res.status).toBe(403);
    });

    it('rejects blockDates from another agency admin', async () => {
      const res = await request(app.getHttpServer())
        .post(`/cars/${carAId}/availability/block`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ dates: ['2026-01-01'] });
      expect(res.status).toBe(403);
    });

    it('rejects blockDates from an admin with no agency', async () => {
      const res = await request(app.getHttpServer())
        .post(`/cars/${carAId}/availability/block`)
        .set('Authorization', `Bearer ${tokenNoAgency}`)
        .send({ dates: ['2026-01-01'] });
      expect(res.status).toBe(403);
    });

    it('rejects unblockDates from another agency admin', async () => {
      const res = await request(app.getHttpServer())
        .post(`/cars/${carAId}/availability/unblock`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ dates: ['2026-01-01'] });
      expect(res.status).toBe(403);
    });

    it('lets the owning agency admin update their own car', async () => {
      const res = await request(app.getHttpServer())
        .put(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ price: 60 });
      expect(res.status).toBe(200);
    });

    it('lets a second staff admin on the SAME agency also manage the car', async () => {
      // Proves multi-admin-per-agency actually works end-to-end, not just
      // at the schema level.
      const res = await request(app.getHttpServer())
        .put(`/cars/${carAId}`)
        .set('Authorization', `Bearer ${tokenAOther}`)
        .send({ price: 65 });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /super-admin/users — createAdminUser', () => {
    it('requires agencyId for a non-superAdmin', async () => {
      const res = await request(app.getHttpServer())
        .post('/super-admin/users')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({
          name: 'New',
          firstname: 'Admin',
          email: 'new-admin-noagency@tenancy-test.local',
          password: PASSWORD,
        });
      expect(res.status).toBe(400);
    });

    it('404s when agencyId does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/super-admin/users')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({
          name: 'New',
          firstname: 'Admin',
          email: 'new-admin-badagency@tenancy-test.local',
          password: PASSWORD,
          agencyId: 999999,
        });
      expect(res.status).toBe(404);
    });

    it('rejects an agencyId on a superAdmin creation', async () => {
      const res = await request(app.getHttpServer())
        .post('/super-admin/users')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({
          name: 'New',
          firstname: 'Super',
          email: 'new-super-with-agency@tenancy-test.local',
          password: PASSWORD,
          role: 'superAdmin',
          agencyId: agencyA.id,
        });
      expect(res.status).toBe(400);
    });

    it('creates a properly-scoped admin who can immediately act on their agency', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/super-admin/users')
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({
          name: 'New',
          firstname: 'Admin',
          email: 'new-admin-ok@tenancy-test.local',
          password: PASSWORD,
          agencyId: agencyA.id,
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.agencyId).toBe(agencyA.id);

      const newToken = await login('new-admin-ok@tenancy-test.local', PASSWORD);
      const carRes = await request(app.getHttpServer())
        .post('/cars')
        .set('Authorization', `Bearer ${newToken}`)
        .send(carPayload(agencyA.id, 'TEST-NEWADMIN'));
      expect(carRes.status).toBe(201);
    });
  });

  describe('PATCH /super-admin/users/:id/agency — assignAdminToAgency', () => {
    it('assigns a second admin to an agency that already has one — the one-admin ceiling is gone', async () => {
      const extra = await prisma.agencyUser.create({
        data: {
          name: 'Extra',
          firstname: 'Staff',
          email: 'extra-staff@tenancy-test.local',
          password: passwordHash,
          role: 'admin',
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/super-admin/users/${extra.id}/agency`)
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({ agencyId: agencyA.id });

      expect(res.status).toBe(200);
      expect(res.body.agencyId).toBe(agencyA.id);
      // Response shape now matches the SDK's AdminUser type (id/email/role/
      // status/agencyId/...) instead of the old bug where this endpoint
      // actually returned an Agency object.
      expect(res.body.email).toBe('extra-staff@tenancy-test.local');

      const stillHasFirstAdmin = await prisma.agencyUser.findUnique({ where: { id: adminA.id } });
      expect(stillHasFirstAdmin?.agencyId).toBe(agencyA.id);
    });

    it('rejects assigning an agency to a superAdmin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/super-admin/users/${superAdmin.id}/agency`)
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({ agencyId: agencyA.id });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /super-admin/users/:id/status — deactivation cascade stays scoped to the responsible admin', () => {
    it('deactivating a non-responsible staff admin does NOT deactivate their agency', async () => {
      const before = await prisma.agency.findUnique({ where: { id: agencyA.id } });
      expect(before?.status).toBe('activate');

      const res = await request(app.getHttpServer())
        .patch(`/super-admin/users/${adminAOther.id}/status`)
        .set('Authorization', `Bearer ${tokenSuper}`)
        .send({ status: 'deactivate' });
      expect(res.status).toBe(200);

      const after = await prisma.agency.findUnique({ where: { id: agencyA.id } });
      expect(after?.status).toBe('activate');

      // restore for any later tests / re-runs
      await prisma.agencyUser.update({ where: { id: adminAOther.id }, data: { status: 'activate' } });
    });
  });

  describe('Unauthenticated and cross-role access', () => {
    it('401s on car creation with no token', async () => {
      const res = await request(app.getHttpServer())
        .post('/cars')
        .send(carPayload(agencyA.id, 'TEST-NOTOKEN'));
      expect(res.status).toBe(401);
    });

    it('403s a non-superAdmin calling a super-admin route', async () => {
      const res = await request(app.getHttpServer())
        .post('/super-admin/users')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'X',
          firstname: 'Y',
          email: 'shouldnt-exist@tenancy-test.local',
          password: PASSWORD,
          agencyId: agencyA.id,
        });
      expect(res.status).toBe(403);
    });
  });
});
