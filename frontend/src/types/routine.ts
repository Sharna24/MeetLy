export type Day = 'SAT' | 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
export type EntryType = 'class' | 'lab' | 'office_hours' | 'other';

// One meeting of one class on one day (same shape the backend sends).
export interface RoutineEntry {
  id: string;
  semester: string;
  courseCode: string;
  section: string | null;
  faculty: string | null;
  room: string | null;
  type: EntryType;
  dayOfWeek: Day;
  startMin: number; // minutes after midnight: 8:00 am = 480
  endMin: number;
}

export interface FreeSlot {
  day: Day;
  startMin: number;
  endMin: number;
}

export interface FreeTimeResponse {
  semester: string;
  dayStartMin: number;
  dayEndMin: number;
  minFreeMinutes: number;
  slots: FreeSlot[];
}

// What we send when adding a class (it can meet on several days).
export interface NewEntry {
  courseCode: string;
  section?: string;
  faculty?: string;
  room?: string;
  type: EntryType;
  days: Day[];
  startMin: number;
  endMin: number;
}