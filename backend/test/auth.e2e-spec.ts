import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GoogleVerifier, GoogleProfile } from '../src/services/google-verifier.service';

// Fake Google: these "tokens" stand in for what Google would return.
const FAKE: Record<string, GoogleProfile> = {
  'student-ok': { sub: 'g-1', email: 'e2e-student@g.bracu.ac.bd', emailVerified: true, name: 'Test Student', picture: 'http://x/y.png' },
  'faculty-ok': { sub: 'g-2', email: 'e2e-faculty@bracu.ac.bd', emailVerified: true, name: 'Test Faculty' },
  'gmail': { sub: 'g-3', email: 'e2e-someone@gmail.com', emailVerified: true, name: 'Outsider' },
  'unverified': { sub: 'g-4', email: 'e2e-unverified@g.bracu.ac.bd', emailVerified: false },
  'lookalike': { sub: 'g-5', email: 'e2e-fake@g.bracu.ac.bd.evil.com', emailVerified: true },
};
const fakeVerifier = {
  async verify(token: string) {
    const p = FAKE[token];
    if (!p) throw new (require('@nestjs/common').UnauthorizedException)('Invalid Google token');
    return p;
  },
};

describe('Login with BRAC University Google account', () => {
  let app: INestApplication;
  let db: DataSource;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://meetly:meetly@localhost:5432/meetly';
    process.env.STUDENT_DOMAIN = 'g.bracu.ac.bd';
    process.env.FACULTY_DOMAIN = 'bracu.ac.bd';
    process.env.NODE_ENV = 'test';

    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleVerifier).useValue(fakeVerifier)
      .compile();
    app = mod.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    db = app.get(DataSource);
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%'`);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%'`);
    await app.close();
  });

  it('rejects a personal Gmail account (403) and sets no cookie', async () => {
    const res = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'gmail' });
    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('rejects a look-alike domain such as g.bracu.ac.bd.evil.com (403)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'lookalike' });
    expect(res.status).toBe(403);
  });

  it('rejects an unverified Google email (401)', async () => {
    const res = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'unverified' });
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token (401) and a missing token (400)', async () => {
    const bad = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'nonsense' });
    expect(bad.status).toBe(401);
    const missing = await request(app.getHttpServer()).post('/auth/google').send({});
    expect(missing.status).toBe(400);
  });

  it('blocks /auth/me and /users/me when not logged in (401)', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await request(app.getHttpServer()).patch('/users/me').send({ department: 'CSE' }).expect(401);
  });

  it('logs a student in: creates the user, sets an httpOnly cookie', async () => {
    const res = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'student-ok' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: 'e2e-student@g.bracu.ac.bd', role: 'student', isVerified: true, profileComplete: false,
    });
    const cookie = (res.headers['set-cookie'] as unknown as string[])[0];
    expect(cookie).toContain('token=');
    expect(cookie.toLowerCase()).toContain('httponly');
  });

  it('gives faculty emails the faculty role, not verified yet', async () => {
    const res = await request(app.getHttpServer()).post('/auth/google').send({ credential: 'faculty-ok' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: 'faculty', isVerified: false });
  });

  it('full flow: login, /auth/me, complete profile, logout', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent.post('/auth/google').send({ credential: 'student-ok' }).expect(200);

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body.email).toBe('e2e-student@g.bracu.ac.bd');
    expect(me.body.profileComplete).toBe(false);

    // The user tries to sneak in a role change; it must be ignored.
    const upd = await agent.patch('/users/me')
      .send({ department: 'CSE', studentId: '21301234', bio: 'hi!', role: 'admin', email: 'x@y.z' })
      .expect(200);
    expect(upd.body).toMatchObject({
      department: 'CSE', studentId: '21301234', bio: 'hi!', profileComplete: true,
      role: 'student', email: 'e2e-student@g.bracu.ac.bd',
    });

    await agent.patch('/users/me').send({ department: '' }).expect(400);

    await agent.post('/auth/logout').expect(200);
    await agent.get('/auth/me').expect(401);
  });

  it('logging in twice does not create a duplicate user', async () => {
    await request(app.getHttpServer()).post('/auth/google').send({ credential: 'student-ok' }).expect(200);
    await request(app.getHttpServer()).post('/auth/google').send({ credential: 'student-ok' }).expect(200);
    const rows = await db.query(`SELECT count(*)::int AS n FROM users WHERE email = 'e2e-student@g.bracu.ac.bd'`);
    expect(rows[0].n).toBe(1);
  });
});
