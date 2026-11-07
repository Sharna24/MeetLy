// Settings for the routine feature. Change them here if your needs change.

// BRAC University's week starts on Saturday, so we keep that order everywhere.
export const DAYS = ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'] as const;
export type Day = (typeof DAYS)[number];

export const ENTRY_TYPES = ['class', 'lab', 'office_hours', 'other'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

// Times are stored as "minutes after midnight": 8:00 am = 480, 9:20 am = 560, 1:50 pm = 830.
// This makes comparing times and finding gaps simple arithmetic.
export const DAY_START_MIN = 8 * 60;        // free time is counted from 8:00 am...
export const DAY_END_MIN = 18 * 60 + 30;    // ...until 6:30 pm
export const MIN_FREE_MIN = 30;             // gaps shorter than 30 minutes are not "free time"
                                            // (BRAC has 10-minute breaks between classes)
export const DEFAULT_SEMESTER = 'FALL 2026';