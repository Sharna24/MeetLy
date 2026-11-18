import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GoogleProfile, GoogleVerifier } from '../src/services/google-verifier.service';

jest.setTimeout(120_000);

const PDF = join(__dirname, 'fixtures', 'sample-schedule.pdf');
const PNG = join(__dirname, 'fixtures', 'sample-schedule.png');

const FAKE: Record<string, GoogleProfile> = {
  a: { sub: 'i-a', email: 'e2e-import-a@g.bracu.ac.bd', emailVerified: true, name: 'Student A' },
  b: { sub: 'i-b', email: 'e2e-import-b@g.bracu.ac.bd', emailVerified: true, name: 'Student B' },
};
const fakeVerifier = {
  async verify(token: string) {
    if (!FAKE[token]) throw new UnauthorizedException('Invalid Google token');
    return FAKE[token];
  },
};

describe('Routine import API (PDF and picture)', () => {
  let app: INestApplication;
  let db: DataSource;
  let a: ReturnType<typeof request.agent>;
  let b: ReturnType<typeof request.agent>;
  let found: any[]; // the classes the preview found, sent back on confirm

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://meetly:meetly@localhost:5432/meetly';
    process.env.STUDENT_DOMAIN = 'g.bracu.ac.bd';
    process.env.FACULTY_DOMAIN = 'bracu.ac.bd';
    process.env.CURRENT_SEMESTER = 'FALL 2026';
    process.env.NODE_ENV = 'test';

    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleVerifier).useValue(fakeVerifier).compile();
    app = mod.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    db = app.get(DataSource);
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%'`);

    a = request.agent(app.getHttpServer());
    b = request.agent(app.getHttpServer());
    await a.post('/auth/google').send({ credential: 'a' }).expect(200);
    await b.post('/auth/google').send({ credential: 'b' }).expect(200);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%'`);
    await app.close();
  });

  const entryCount = async (agent = a) => (await agent.get('/routine/entries').expect(200)).body.entries.length;

  it('needs a login (401)', async () => {
    const s = request(app.getHttpServer());
    await s.post('/routine/import/preview').expect(401);
    await s.post('/routine/import/confirm').send({}).expect(401);
  });

  it('rejects a request with no file, and a file that is not a PDF or picture (400)', async () => {
    await a.post('/routine/import/preview').expect(400);
    // a text file pretending to be a PDF: we check the real content, not the name
    const res = await a.post('/routine/import/preview').attach('file', Buffer.from('this is just text, not a pdf at all'), 'routine.pdf').expect(400);
    expect(res.body.message).toMatch(/PDF/);
  });

  it('rejects a file that is too big (413)', async () => {
    await a.post('/routine/import/preview').attach('file', Buffer.alloc(9 * 1024 * 1024, 1), 'big.pdf').expect(413);
  });

  it('reads the PDF and shows what it found, without saving anything', async () => {
    const res = await a.post('/routine/import/preview').attach('file', PDF).expect(201);
    expect(res.body).toMatchObject({ source: 'pdf', session: 'FALL 2026', warnings: [] });
    expect(res.body.classes).toHaveLength(6);
    expect(res.body.classes.every((c: any) => c.conflict === null)).toBe(true);
    const cse425 = res.body.classes.find((c: any) => c.courseCode === 'CSE425');
    expect(cse425).toMatchObject({ section: '06', faculty: 'MMM', room: '09G-31T', days: ['SUN', 'TUE'], startMin: 480, endMin: 560 });
    found = res.body.classes;
    expect(await entryCount()).toBe(0); // preview saves nothing
  });

  it('reads a screenshot too, and reminds the student to check it', async () => {
    const res = await a.post('/routine/import/preview').attach('file', PNG).expect(201);
    expect(res.body.source).toBe('image');
    expect(res.body.classes.map((c: any) => [c.courseCode, c.days, c.startMin])).toEqual(
      found.map((c) => [c.courseCode, c.days, c.startMin]),
    );
    expect(res.body.warnings.join(' ')).toMatch(/check/i);
  });

  it('warns when the schedule is for a different semester', async () => {
    const prev = process.env.CURRENT_SEMESTER;
    process.env.CURRENT_SEMESTER = 'SPRING 2027';
    const res = await a.post('/routine/import/preview').attach('file', PDF).expect(201);
    process.env.CURRENT_SEMESTER = prev;
    expect(res.body.warnings[0]).toMatch(/FALL 2026.*SPRING 2027/);
  });

  it('imports the checked classes: one entry per class per day', async () => {
    const res = await a.post('/routine/import/confirm').send({ classes: found }).expect(201);
    expect(res.body).toEqual({ classes: 6, entries: 10 });
    expect(await entryCount()).toBe(10);
    const free = await a.get('/routine/free-time').expect(200);
    const tue = free.body.slots.filter((s: any) => s.day === 'TUE');
    expect(tue).toEqual([{ day: 'TUE', startMin: 560, endMin: 1110 }]); // free after the 8:00-9:20 class
  });

  it('the next preview marks every class as overlapping what is already there', async () => {
    const res = await a.post('/routine/import/preview').attach('file', PDF).expect(201);
    expect(res.body.classes.every((c: any) => typeof c.conflict === 'string')).toBe(true);
    expect(res.body.classes[0].conflict).toMatch(/Overlaps/);
  });

  it('importing again without "replace" is refused (409) and changes nothing', async () => {
    await a.post('/routine/import/confirm').send({ classes: found }).expect(409);
    expect(await entryCount()).toBe(10);
  });

  it('"replace" swaps the routine instead of doubling it', async () => {
    const res = await a.post('/routine/import/confirm').send({ classes: found, replace: true }).expect(201);
    expect(res.body.entries).toBe(10);
    expect(await entryCount()).toBe(10);
  });

  it('is all or nothing: a clash inside the import keeps your old routine untouched', async () => {
    const clashing = [
      { courseCode: 'AAA100', days: ['MON'], startMin: 600, endMin: 700 },
      { courseCode: 'BBB200', days: ['MON'], startMin: 650, endMin: 750 }, // overlaps AAA100
    ];
    const res = await a.post('/routine/import/confirm').send({ classes: clashing, replace: true }).expect(409);
    expect(res.body.message).toMatch(/overlaps/);
    expect(await entryCount()).toBe(10); // the replace did NOT go through
    const codes = (await a.get('/routine/entries')).body.entries.map((e: any) => e.courseCode);
    expect(codes).not.toContain('AAA100');
  });

  it('checks the data again on the server (400 for bad days, no classes, end before start)', async () => {
    await a.post('/routine/import/confirm').send({ classes: [] }).expect(400);
    await a.post('/routine/import/confirm').send({ classes: [{ courseCode: 'X1', days: ['XYZ'], startMin: 600, endMin: 700 }] }).expect(400);
    await a.post('/routine/import/confirm').send({ classes: [{ courseCode: 'X1', days: ['MON'], startMin: 700, endMin: 600 }] }).expect(400);
    expect(await entryCount()).toBe(10);
  });

  it('keeps students apart: B sees nothing of A, and B\'s import does not clash with A\'s', async () => {
    expect(await entryCount(b)).toBe(0);
    const pre = await b.post('/routine/import/preview').attach('file', PDF).expect(201);
    expect(pre.body.classes.every((c: any) => c.conflict === null)).toBe(true);
    await b.post('/routine/import/confirm').send({ classes: pre.body.classes }).expect(201);
    expect(await entryCount(b)).toBe(10);
    expect(await entryCount(a)).toBe(10);
  });
});
