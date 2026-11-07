import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { GoogleProfile, GoogleVerifier } from '../src/services/google-verifier.service';

const FAKE: Record<string, GoogleProfile> = {
  a: { sub: 'r-a', email: 'e2e-routine-a@g.bracu.ac.bd', emailVerified: true, name: 'Student A' },
  b: { sub: 'r-b', email: 'e2e-routine-b@g.bracu.ac.bd', emailVerified: true, name: 'Student B' },
};
const fakeVerifier = {
  async verify(token: string) {
    if (!FAKE[token]) throw new UnauthorizedException('Invalid Google token');
    return FAKE[token];
  },
};

describe('Routine API', () => {
  let app: INestApplication;
  let db: DataSource;
  let a: ReturnType<typeof request.agent>; // logged-in student A
  let b: ReturnType<typeof request.agent>; // logged-in student B

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
    await db.query(`DELETE FROM users WHERE email LIKE 'e2e-%'`); // entries are deleted with their user
    await app.close();
  });

  it('needs a login for every routine route (401)', async () => {
    const s = request(app.getHttpServer());
    await s.get('/routine/entries').expect(401);
    await s.get('/routine/free-time').expect(401);
    await s.post('/routine/entries').send({}).expect(401);
  });

  it('starts empty, and the whole week is free', async () => {
    const list = await a.get('/routine/entries').expect(200);
    expect(list.body).toEqual({ semester: 'FALL 2026', entries: [] });
    const free = await a.get('/routine/free-time').expect(200);
    expect(free.body.slots).toHaveLength(7);
    expect(free.body).toMatchObject({ dayStartMin: 480, dayEndMin: 1110, minFreeMinutes: 30 });
  });

  it('adds a class on two days at once (Sunday + Tuesday), tidying the text', async () => {
    const res = await a.post('/routine/entries')
      .send({ courseCode: ' cse425 ', section: '06', faculty: 'mmm', room: '09g-31t', days: ['SUN', 'TUE'], startMin: 480, endMin: 560 })
      .expect(201);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((e: any) => e.dayOfWeek)).toEqual(['SUN', 'TUE']);
    expect(res.body[0]).toMatchObject({ courseCode: 'CSE425', section: '06', faculty: 'MMM', room: '09G-31T', type: 'class', startMin: 480, endMin: 560 });
  });

  it('rejects a clashing class with 409 and saves nothing', async () => {
    // Sunday 8:30-9:50 clashes with 8:00-9:20. Monday has no clash, but nothing may be saved.
    const res = await a.post('/routine/entries')
      .send({ courseCode: 'CSE421', days: ['MON', 'SUN'], startMin: 510, endMin: 590 }).expect(409);
    expect(res.body.message).toContain('CSE421 overlaps with CSE425 on SUN');
    const list = await a.get('/routine/entries').expect(200);
    expect(list.body.entries).toHaveLength(2);
  });

  it('allows classes that touch end-to-start', async () => {
    await a.post('/routine/entries')
      .send({ courseCode: 'CSE421', section: '17', days: ['SUN'], startMin: 560, endMin: 640 }).expect(201);
  });

  it('rejects bad input (400)', async () => {
    const s = (body: object) => a.post('/routine/entries').send(body);
    await s({ courseCode: 'X', days: ['SUN'], startMin: 700, endMin: 600 }).expect(400);        // end before start
    await s({ courseCode: 'X', days: ['SUN'], startMin: 600, endMin: 600 }).expect(400);        // zero length
    await s({ courseCode: 'X', days: [], startMin: 600, endMin: 700 }).expect(400);             // no days
    await s({ courseCode: 'X', days: ['SUNDAY'], startMin: 600, endMin: 700 }).expect(400);     // bad day
    await s({ courseCode: '', days: ['THU'], startMin: 600, endMin: 700 }).expect(400);         // no code
    await s({ courseCode: 'X', days: ['THU'], startMin: 600, endMin: 5000 }).expect(400);       // time out of range
    await s({ courseCode: 'X', days: ['THU', 'THU'], startMin: 600, endMin: 700 }).expect(400); // repeated day
  });

  it('computes free time from the saved classes', async () => {
    const free = await a.get('/routine/free-time').expect(200);
    const sun = free.body.slots.filter((s: any) => s.day === 'SUN');
    // Sunday has 8:00-9:20 and 9:20-10:40 classes -> free from 10:40 (640) to 6:30 pm (1110)
    expect(sun).toEqual([{ day: 'SUN', startMin: 640, endMin: 1110 }]);
    const tue = free.body.slots.filter((s: any) => s.day === 'TUE');
    expect(tue).toEqual([{ day: 'TUE', startMin: 560, endMin: 1110 }]);
  });

  it('keeps each student\'s routine private', async () => {
    const mine = await a.get('/routine/entries').expect(200);
    const theirs = await b.get('/routine/entries').expect(200);
    expect(mine.body.entries.length).toBeGreaterThan(0);
    expect(theirs.body.entries).toEqual([]);

    const someId = mine.body.entries[0].id;
    await b.delete(`/routine/entries/${someId}`).expect(404);            // cannot delete another student's class
    await b.patch(`/routine/entries/${someId}`).send({ room: 'X' }).expect(404); // cannot edit it either
    expect((await a.get('/routine/entries')).body.entries.some((e: any) => e.id === someId)).toBe(true);
  });

  it('edits a class (room), and refuses an edit that creates a clash', async () => {
    const list = (await a.get('/routine/entries')).body.entries;
    const sun1 = list.find((e: any) => e.courseCode === 'CSE425' && e.dayOfWeek === 'SUN');
    const sun2 = list.find((e: any) => e.courseCode === 'CSE421' && e.dayOfWeek === 'SUN');

    const edited = await a.patch(`/routine/entries/${sun1.id}`).send({ room: ' 09g-99 ', faculty: '' }).expect(200);
    expect(edited.body).toMatchObject({ room: '09G-99', faculty: null });

    // stretch the first class over the second one -> 409
    await a.patch(`/routine/entries/${sun1.id}`).send({ endMin: 600 }).expect(409);
    // an edit that only touches its own time is fine
    await a.patch(`/routine/entries/${sun2.id}`).send({ endMin: 650 }).expect(200);
    // end before start -> 400
    await a.patch(`/routine/entries/${sun2.id}`).send({ startMin: 700 }).expect(400);
    // bad id -> 400
    await a.patch('/routine/entries/not-a-uuid').send({}).expect(400);
  });

  it('deletes a class', async () => {
    const list = (await a.get('/routine/entries')).body.entries;
    const target = list.find((e: any) => e.courseCode === 'CSE425' && e.dayOfWeek === 'TUE');
    await a.delete(`/routine/entries/${target.id}`).expect(200);
    const after = (await a.get('/routine/entries')).body.entries;
    expect(after.find((e: any) => e.id === target.id)).toBeUndefined();
    await a.delete(`/routine/entries/${target.id}`).expect(404); // already gone
  });
});
