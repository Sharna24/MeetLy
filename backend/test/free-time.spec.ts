import { computeFreeSlots } from '../src/services/free-time.service';

// Times in minutes after midnight. 8:00 am = 480, 9:20 am = 560, 9:30 am = 570, 11:00 am = 660.
const entry = (dayOfWeek: any, startMin: number, endMin: number) => ({ dayOfWeek, startMin, endMin });

describe('computeFreeSlots', () => {
  it('a day with no classes is free from 8:00 am to 6:30 pm', () => {
    const slots = computeFreeSlots([]).filter((s) => s.day === 'FRI');
    expect(slots).toEqual([{ day: 'FRI', startMin: 480, endMin: 1110 }]);
  });

  it('finds the gaps around a class', () => {
    // Sunday: class 8:00-9:20 and class 11:00-12:20
    const slots = computeFreeSlots([entry('SUN', 480, 560), entry('SUN', 660, 740)]).filter((s) => s.day === 'SUN');
    expect(slots).toEqual([
      { day: 'SUN', startMin: 560, endMin: 660 },   // 9:20 - 11:00
      { day: 'SUN', startMin: 740, endMin: 1110 },  // 12:20 - 6:30 pm
    ]);
  });

  it('ignores the 10-minute break between back-to-back classes', () => {
    // 8:00-9:20 then 9:30-10:50: the 10-minute gap is not free time
    const slots = computeFreeSlots([entry('MON', 480, 560), entry('MON', 570, 650)]).filter((s) => s.day === 'MON');
    expect(slots).toEqual([{ day: 'MON', startMin: 650, endMin: 1110 }]);
  });

  it('keeps a gap of exactly 30 minutes, drops one of 29', () => {
    const exactly = computeFreeSlots([entry('TUE', 480, 600), entry('TUE', 630, 1110)]).filter((s) => s.day === 'TUE');
    expect(exactly).toEqual([{ day: 'TUE', startMin: 600, endMin: 630 }]);
    const tooShort = computeFreeSlots([entry('TUE', 480, 600), entry('TUE', 629, 1110)]).filter((s) => s.day === 'TUE');
    expect(tooShort).toEqual([]);
  });

  it('handles classes that overlap each other and classes outside the day window', () => {
    const slots = computeFreeSlots([
      entry('WED', 480, 700), entry('WED', 600, 650),   // second class is inside the first
      entry('WED', 1200, 1300),                          // after 6:30 pm: should not create a slot past 6:30
    ]).filter((s) => s.day === 'WED');
    expect(slots).toEqual([{ day: 'WED', startMin: 700, endMin: 1110 }]);
  });

  it('a long lab uses up the time', () => {
    // Saturday lab 8:00 am - 10:50 am
    const slots = computeFreeSlots([entry('SAT', 480, 650)]).filter((s) => s.day === 'SAT');
    expect(slots).toEqual([{ day: 'SAT', startMin: 650, endMin: 1110 }]);
  });

  it('returns days in week order starting with Saturday', () => {
    const days = computeFreeSlots([]).map((s) => s.day);
    expect(days).toEqual(['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI']);
  });
});
