import { TextItem } from '../common/text-items';
import { Day } from '../config/routine.config';

// Reads the BRAC University "Class Schedule" table from pieces of text with positions.
//
// Why positions? In the table a class is just a cell. Plain text loses WHICH day column the
// cell is in. So we rebuild the grid:
//   1. find the day names in the header row -> they tell us the x position of each column
//   2. find the time labels in the first column ("8:00 am - 9:20 am") -> the rows
//   3. put every piece of cell text into its (row, column)
//   4. read "CSE425-06 -MMM-09G-31T" as course, section, faculty, room

export interface ParsedClass {
  courseCode: string;
  section: string | null;
  faculty: string | null;
  room: string | null;
  type: 'class' | 'lab';
  days: Day[];
  startMin: number;
  endMin: number;
}

export interface ParseResult {
  classes: ParsedClass[];
  warnings: string[];
  session: string | null; // e.g. "FALL 2026", if the page says it
}

const DAY_NAMES: { full: string; day: Day }[] = [
  { full: 'SATURDAY', day: 'SAT' },
  { full: 'SUNDAY', day: 'SUN' },
  { full: 'MONDAY', day: 'MON' },
  { full: 'TUESDAY', day: 'TUE' },
  { full: 'WEDNESDAY', day: 'WED' },
  { full: 'THURSDAY', day: 'THU' },
  { full: 'FRIDAY', day: 'FRI' },
];

const cx = (i: TextItem) => i.x + i.w / 2;
const cy = (i: TextItem) => i.y + i.h / 2;
const median = (n: number[]) => {
  const s = [...n].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// Group pieces of text into lines (top to bottom), each line ordered left to right.
// Pieces on the same line can differ a little in height (a hyphen is tiny), so we compare
// with a tolerance instead of exact positions.
function toLines(list: TextItem[], tol: number): TextItem[][] {
  const sorted = [...list].sort((a, b) => cy(a) - cy(b));
  const lines: TextItem[][] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(cy(last[0]) - cy(it)) <= tol) last.push(it);
    else lines.push([it]);
  }
  return lines.map((l) => l.sort((a, b) => a.x - b.x));
}

// "SUNDAY" -> SUN. Also accepts "Sun", "SUN". Anything else -> null.
function toDay(text: string): Day | null {
  const t = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (t.length < 3) return null;
  const hit = DAY_NAMES.find((d) => d.full.startsWith(t)); // SUN, SUND, SUNDAY all match
  return hit ? hit.day : null;
}

// "9:30" + "am"  ->  570
function toMinutes(clock: string, meridiem: 'am' | 'pm'): number {
  const [h, m] = clock.split(':').map(Number);
  return (h % 12) * 60 + m + (meridiem === 'pm' ? 720 : 0);
}

// Reads "8:00 am - 9:20 am", also "11:00 am - 12:20 pm" and "11:00-12:20 pm".
const RANGE_RE = /(\d{1,2}:\d{2})\s*([ap]\.?m\.?)?\s*[-–—]\s*(\d{1,2}:\d{2})\s*([ap]\.?m\.?)/gi;
const mer = (s: string) => (s.toLowerCase().startsWith('a') ? 'am' : 'pm') as 'am' | 'pm';

// A class cell: CODE - SECTION - FACULTY - ROOM, for example "CSE425-06 -MMM-09G-31T".
// The room is letters/digits joined by hyphens: "09G-31T", "10E-27L", "UB40101".
const CLASS_RE = /([A-Z]{2,4}\s?\d{3,4}[A-Z]?)\s*-\s*(\d{1,2})\s*-\s*([A-Za-z]{2,8})\s*-?\s*([A-Za-z0-9]{1,8}(?:\s*-\s*[A-Za-z0-9]{1,8})*)?/g;

// A photo of a screen is often a little tilted. The day names (SUNDAY... SATURDAY) should sit on
// one level line, so we find the slope of the best line through them and rotate everything
// back until that line is level.
function deskew(items: TextItem[]): TextItem[] {
  const lineH = median(items.map((i) => i.h));
  const days = items.map((i) => ({ i, day: toDay(i.text) })).filter((d) => d.day);
  let bestSlope = 0;
  let bestCount = 0;
  for (const a of days) {
    for (const b of days) {
      const dx = cx(b.i) - cx(a.i);
      if (a.day === b.day || dx < lineH * 6) continue;
      const slope = (cy(b.i) - cy(a.i)) / dx;
      if (Math.abs(Math.atan(slope)) > (12 * Math.PI) / 180) continue;
      const inliers = days.filter((k) => Math.abs(cy(k.i) - (cy(a.i) + slope * (cx(k.i) - cx(a.i)))) <= lineH * 0.7);
      const count = new Set(inliers.map((k) => k.day)).size;
      if (count > bestCount || (count === bestCount && Math.abs(slope) < Math.abs(bestSlope))) {
        bestCount = count;
        bestSlope = slope;
      }
    }
  }
  const angle = Math.atan(bestSlope);
  if (bestCount < 3 || Math.abs(angle) < 0.002) return items; // nothing to fix
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return items.map((it) => {
    const x = cx(it) * cos + cy(it) * sin;
    const y = -cx(it) * sin + cy(it) * cos;
    return { ...it, x: x - it.w / 2, y: y - it.h / 2 };
  });
}

// OCR sometimes adds or swaps a letter in a course code ("CSEA421L" for "CSE421L").
// Course codes on one page share a few prefixes (CSE, EEE...). If a 4-letter prefix is used only
// once and dropping a letter gives a prefix that other classes use, we assume it was misread.
function repairCodes(found: { cls: { courseCode: string } }[]) {
  const prefixOf = (code: string) => /^[A-Z]+/.exec(code)![0];
  // which course codes use each prefix (counted once per code, so a class on two days counts once)
  const codesByPrefix = new Map<string, Set<string>>();
  for (const f of found) {
    const p = prefixOf(f.cls.courseCode);
    codesByPrefix.set(p, (codesByPrefix.get(p) ?? new Set()).add(f.cls.courseCode));
  }
  for (const f of found) {
    const p = prefixOf(f.cls.courseCode);
    if (p.length !== 4 || (codesByPrefix.get(p)?.size ?? 0) > 1) continue;
    const fix = [p.slice(0, 3), p.slice(1)].find((c) => codesByPrefix.has(c));
    if (fix) f.cls.courseCode = fix + f.cls.courseCode.slice(4);
  }
}

export function parseSchedule(rawItems: TextItem[]): ParseResult {
  const warnings: string[] = [];
  const clean = deskew(rawItems.filter((i) => i.text.trim() !== ''));

  // The page may say which session this is.
  const allText = [...clean].sort((a, b) => cy(a) - cy(b) || a.x - b.x).map((i) => i.text).join(' ');
  const sess = /\b(FALL|SPRING|SUMMER)\s+(20\d{2})\b/i.exec(allText);
  const session = sess ? `${sess[1].toUpperCase()} ${sess[2]}` : null;

  // ---- 1. Header row: find the line with the most day names ----
  const dayItems = clean.map((i) => ({ i, day: toDay(i.text) })).filter((d) => d.day);
  const lineTol = Math.max(median(clean.map((i) => i.h)) * 0.8, 3);
  let best: typeof dayItems = [];
  for (const d of dayItems) {
    const sameLine = dayItems.filter((o) => Math.abs(cy(o.i) - cy(d.i)) <= lineTol);
    const distinct = new Set(sameLine.map((o) => o.day)).size;
    if (distinct > new Set(best.map((o) => o.day)).size) best = sameLine;
  }
  const columns = new Map<Day, number>(); // day -> x centre
  for (const d of best) if (!columns.has(d.day!)) columns.set(d.day!, cx(d.i));
  if (columns.size < 3) {
    return { classes: [], warnings: ['Could not find the weekly table (the SUNDAY, MONDAY... header row). Use a clear, straight screenshot of the whole Class Schedule table.'], session };
  }
  const headerY = median(best.map((d) => cy(d.i)));
  const headerH = median(best.map((d) => d.i.h));
  const cols = [...columns.entries()].map(([day, x]) => ({ day, x })).sort((a, b) => a.x - b.x);
  const spacing = median(cols.slice(1).map((c, k) => c.x - cols[k].x));
  const firstColLeft = cols[0].x - spacing / 2; // everything left of this is the time column

  // Which day column does an x position belong to? (null = the time column)
  const columnOf = (x: number): Day | null => {
    if (x < firstColLeft) return null;
    let nearest = cols[0];
    for (const c of cols) if (Math.abs(c.x - x) < Math.abs(nearest.x - x)) nearest = c;
    return Math.abs(nearest.x - x) <= spacing * 0.75 ? nearest.day : null;
  };

  const body = clean.filter((i) => cy(i) > headerY + headerH * 0.8);
  const lineH = median(clean.map((i) => i.h));

  // ---- 2. Time column: find the row labels ----
  const timeItems = toLines(body.filter((i) => cx(i) < firstColLeft), Math.max(lineH * 0.6, 2)).flat();
  let joined = '';
  const spans: { start: number; end: number; item: TextItem }[] = [];
  for (const it of timeItems) {
    const start = joined.length;
    joined += it.text + ' ';
    spans.push({ start, end: joined.length, item: it });
  }
  const rows: { startMin: number; endMin: number; y: number }[] = [];
  for (const m of joined.matchAll(RANGE_RE)) {
    const endMer = mer(m[4]);
    let start = toMinutes(m[1], m[2] ? mer(m[2]) : endMer);
    const end = toMinutes(m[3], endMer);
    if (!m[2] && start >= end) start = toMinutes(m[1], endMer === 'pm' ? 'am' : 'pm');
    if (end <= start) continue;
    const from = m.index!;
    const to = from + m[0].length;
    const own = spans.filter((s) => s.start < to && s.end > from).map((s) => cy(s.item));
    rows.push({ startMin: start, endMin: end, y: own.reduce((a, b) => a + b, 0) / own.length });
  }
  if (rows.length === 0) {
    return { classes: [], warnings: ['Could not read the time labels (like "8:00 am - 9:20 am") in the first column.'], session };
  }
  rows.sort((a, b) => a.y - b.y);

  // Where does the table end? The page may have other text under it (a note, the exam table).
  // Cell text stays close to the last row label; anything much lower is not part of the table.
  const pitch = rows.length > 1 ? (rows[rows.length - 1].y - rows[0].y) / (rows.length - 1) : 0;
  const tableBottom = rows[rows.length - 1].y + Math.max(0.75 * pitch, 4 * lineH);

  // Row borders sit halfway between neighbouring row-label centres.
  const rowOf = (y: number) => {
    let k = 0;
    for (let r = 1; r < rows.length; r++) if (y >= (rows[r - 1].y + rows[r].y) / 2) k = r;
    return k;
  };

  // ---- 3. Put cell text into (row, day) ----
  const cells = new Map<string, TextItem[]>();
  for (const it of body) {
    if (cy(it) > tableBottom || it.w > spacing * 1.4) continue; // below the table, or too wide for a cell
    const day = columnOf(cx(it));
    if (!day) continue;
    const key = `${rowOf(cy(it))}|${day}`;
    cells.set(key, [...(cells.get(key) ?? []), it]);
  }

  // ---- 4. Read each cell ----
  const found: { row: number; day: Day; cls: Omit<ParsedClass, 'days'> }[] = [];
  const cellLineTol = Math.max(lineH * 0.6, 2);
  for (const [key, list] of cells) {
    const [rowStr, day] = key.split('|');
    const row = rows[Number(rowStr)];

    // join the pieces into lines (top to bottom, left to right), then into one string
    const text = toLines(list, cellLineTol)
      .map((l) => l.map((i) => i.text).join(' '))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Safety check: cell text sits level with its row's time label. If it is far from the label, the
    // real label was probably not read (OCR), and using this row's time would be WRONG. Better to
    // ask the student to add that class by hand than to guess a time.
    const cellMid = list.reduce((sum, i) => sum + cy(i), 0) / list.length;
    if (Math.abs(cellMid - row.y) > lineH * 2.5) {
      if (/[A-Za-z]{2,}\s?\d{3}/.test(text)) warnings.push(`Could not find the time for this class, please add it by hand: "${text}"`);
      continue;
    }

    let matched = false;
    for (const m of text.matchAll(CLASS_RE)) {
      matched = true;
      const code = m[1].replace(/\s/g, '').toUpperCase();
      const faculty = m[3].toUpperCase();
      const room = (m[4] ?? '').replace(/\s+/g, '').toUpperCase();
      const isLab = /\d[A-Z]$/.test(code) || row.endMin - row.startMin >= 150;
      found.push({
        row: Number(rowStr),
        day: day as Day,
        cls: {
          courseCode: code,
          section: m[2].padStart(2, '0'),
          faculty: faculty === 'TBA' || faculty === 'TBD' ? null : faculty,
          room: room || null,
          type: isLab ? 'lab' : 'class',
          startMin: row.startMin,
          endMin: row.endMin,
        },
      });
    }
    if (!matched && /[A-Za-z]{2,}\s?\d{3}/.test(text)) {
      warnings.push(`Could not read this cell, please add it by hand: "${text}"`);
    }
  }

  repairCodes(found);

  // ---- 5. Merge the same class on several days into one ----
  const merged = new Map<string, ParsedClass>();
  for (const f of found) {
    const k = [f.cls.courseCode, f.cls.section, f.cls.faculty, f.cls.room, f.cls.startMin, f.cls.endMin].join('|');
    const existing = merged.get(k);
    if (existing) {
      if (!existing.days.includes(f.day)) existing.days.push(f.day);
    } else merged.set(k, { ...f.cls, days: [f.day] });
  }
  const order = DAY_NAMES.map((d) => d.day);
  const classes = [...merged.values()]
    .map((c) => ({ ...c, days: [...c.days].sort((a, b) => order.indexOf(a) - order.indexOf(b)) }))
    .sort((a, b) => a.startMin - b.startMin || a.courseCode.localeCompare(b.courseCode));

  const uniqueWarnings = [...new Set(warnings)]; // the same class on two days warns once
  if (classes.length === 0 && uniqueWarnings.length === 0) uniqueWarnings.push('No classes were found in the table.');
  return { classes, warnings: uniqueWarnings, session };
}
