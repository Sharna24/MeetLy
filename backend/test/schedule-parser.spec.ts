import { readFileSync } from 'fs';
import { join } from 'path';
import { TextItem } from '../src/common/text-items';
import { OcrReader } from '../src/services/ocr-reader';
import { readPdf } from '../src/services/pdf-reader';
import { parseSchedule } from '../src/services/schedule-parser';

jest.setTimeout(120_000);

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', name));

// What the sample schedule (a made-up student, see test/fixtures) must read as.
const EXPECTED = [
  { courseCode: 'CSE421L', section: '17', faculty: null, room: '10E-27L', type: 'lab', days: ['SAT'], startMin: 480, endMin: 650 },
  { courseCode: 'CSE425', section: '06', faculty: 'MMM', room: '09G-31T', type: 'class', days: ['SUN', 'TUE'], startMin: 480, endMin: 560 },
  { courseCode: 'CSE421', section: '17', faculty: 'ANWE', room: '09A-02C', type: 'class', days: ['MON', 'WED'], startMin: 570, endMin: 650 },
  { courseCode: 'CSE360', section: '06', faculty: 'SRU', room: '09D-17C', type: 'class', days: ['MON', 'WED'], startMin: 660, endMin: 740 },
  { courseCode: 'CSE360L', section: '06', faculty: null, room: '12B-19L', type: 'lab', days: ['SUN'], startMin: 660, endMin: 830 },
  { courseCode: 'CSE470', section: '15', faculty: 'PLN', room: '10B-17C', type: 'class', days: ['THU', 'SAT'].sort((a, b) => ['SAT', 'THU'].indexOf(a) - ['SAT', 'THU'].indexOf(b)), startMin: 660, endMin: 740 },
];

// Turns every item by an angle, like a photo taken with a slightly tilted phone.
function tilt(items: TextItem[], degrees: number): TextItem[] {
  const a = (degrees * Math.PI) / 180;
  return items.map((i) => {
    const x = i.x + i.w / 2;
    const y = i.y + i.h / 2;
    return { ...i, x: x * Math.cos(a) - y * Math.sin(a) - i.w / 2, y: x * Math.sin(a) + y * Math.cos(a) - i.h / 2 };
  });
}

describe('reading a BRAC class schedule', () => {
  it('reads every class from the PDF: days, times, rooms, labs', async () => {
    const result = parseSchedule(await readPdf(fixture('sample-schedule.pdf')));
    expect(result.warnings).toEqual([]);
    expect(result.session).toBe('FALL 2026');
    expect(result.classes).toEqual(EXPECTED);
  });

  it('ignores the note and the exam table under the class table', async () => {
    const result = parseSchedule(await readPdf(fixture('sample-schedule.pdf')));
    expect(result.classes.map((c) => c.courseCode)).not.toContain('COURSE');
    expect(result.classes).toHaveLength(6);
  });

  it('still reads a tilted picture (3 degrees)', async () => {
    const items = tilt(await readPdf(fixture('sample-schedule.pdf')), 3);
    expect(parseSchedule(items).classes).toEqual(EXPECTED);
    expect(parseSchedule(tilt(items, -7)).classes).toEqual(EXPECTED); // and back the other way
  });

  it('never guesses a time: a class whose time label is missing is reported, not invented', async () => {
    const items = await readPdf(fixture('sample-schedule.pdf'));
    const label = items.find((i) => i.text.startsWith('9:30'))!;
    // remove the "9:30 am - 10:50 am" label: its first line, and the "am" line under it
    const without = items.filter((i) => !(i === label || (i.text === 'am' && i.x < 120 && Math.abs(i.y - (label.y + 10)) < 6)));
    const result = parseSchedule(without);
    expect(result.classes.map((c) => c.courseCode)).not.toContain('CSE421'); // dropped, not given a wrong time
    expect(result.warnings).toHaveLength(1); // the same class on Mon and Wed is reported once
    expect(result.warnings[0]).toMatch(/CSE421/);
    expect(result.classes.find((c) => c.courseCode === 'CSE425')).toMatchObject({ startMin: 480, endMin: 560 });
  });

  it('repairs an OCR slip in a course code (CSEA470 -> CSE470)', async () => {
    const items = (await readPdf(fixture('sample-schedule.pdf'))).map((i) => (i.text.startsWith('CSE470') ? { ...i, text: 'CSEA' + i.text.slice(3) } : i));
    const result = parseSchedule(items);
    expect(result.classes.map((c) => c.courseCode)).toContain('CSE470');
    expect(result.classes.map((c) => c.courseCode)).not.toContain('CSEA470');
  });

  it('gives a clear message when the page has no schedule table', () => {
    const result = parseSchedule([{ text: 'Hello world', x: 10, y: 10, w: 60, h: 10 }]);
    expect(result.classes).toEqual([]);
    expect(result.warnings[0]).toMatch(/weekly table/);
    expect(parseSchedule([]).classes).toEqual([]);
  });

  it('warns when a cell looks like a class but cannot be read', async () => {
    const items = (await readPdf(fixture('sample-schedule.pdf'))).map((i) => (i.text.startsWith('CSE425-06') ? { ...i, text: i.text.replace('-06', ' hello') } : i));
    expect(parseSchedule(items).warnings.join(' ')).toMatch(/CSE425/);
  });
});

describe('reading a picture (OCR)', () => {
  const ocr = new OcrReader();
  afterAll(() => ocr.close());

  it('reads a screenshot of the schedule', async () => {
    const result = parseSchedule(await ocr.read(fixture('sample-schedule.png')));
    expect(result.warnings).toEqual([]);
    expect(result.classes).toEqual(EXPECTED);
  });

  it('reads a JPEG of the schedule (lossy compression)', async () => {
    const jpg = await require('sharp')(fixture('sample-schedule.png')).jpeg({ quality: 70 }).toBuffer();
    const result = parseSchedule(await ocr.read(jpg));
    expect(result.classes).toEqual(EXPECTED);
  });

  it('gives a message, not a crash, for a picture with no schedule', async () => {
    const blank = await require('sharp')({ create: { width: 800, height: 500, channels: 3, background: '#ffffff' } }).png().toBuffer();
    const result = parseSchedule(await ocr.read(blank));
    expect(result.classes).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});