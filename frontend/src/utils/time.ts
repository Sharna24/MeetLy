import { Day } from '../types/routine';

// BRAC University's week starts on Saturday (same order as the backend).
export const DAYS: { key: Day; label: string; short: string }[] = [
  { key: 'SAT', label: 'Saturday', short: 'Sat' },
  { key: 'SUN', label: 'Sunday', short: 'Sun' },
  { key: 'MON', label: 'Monday', short: 'Mon' },
  { key: 'TUE', label: 'Tuesday', short: 'Tue' },
  { key: 'WED', label: 'Wednesday', short: 'Wed' },
  { key: 'THU', label: 'Thursday', short: 'Thu' },
  { key: 'FRI', label: 'Friday', short: 'Fri' },
];

// 570 -> "9:30 am", 830 -> "1:50 pm"
export function formatMin(total: number): string {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// 100 -> "1h 40m", 90 -> "1h 30m", 45 -> "45m", 120 -> "2h"
export function durationText(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// <input type="time"> works with "09:30"; we store minutes. These two convert.
export function toInput(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
export function fromInput(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export interface Slot { label: string; start: number; end: number }

// The usual BRAC University class periods (80 minutes) and lab periods (3 hours).
// If your slot is different, choose "Custom" in the form and type the times.
export const CLASS_SLOTS: Slot[] = [
  { label: '8:00 am - 9:20 am', start: 480, end: 560 },
  { label: '9:30 am - 10:50 am', start: 570, end: 650 },
  { label: '11:00 am - 12:20 pm', start: 660, end: 740 },
  { label: '12:30 pm - 1:50 pm', start: 750, end: 830 },
  { label: '2:00 pm - 3:20 pm', start: 840, end: 920 },
  { label: '3:30 pm - 4:50 pm', start: 930, end: 1010 },
  { label: '5:00 pm - 6:20 pm', start: 1020, end: 1100 },
];
export const LAB_SLOTS: Slot[] = [
  { label: '8:00 am - 10:50 am', start: 480, end: 650 },
  { label: '11:00 am - 1:50 pm', start: 660, end: 830 },
  { label: '2:00 pm - 4:50 pm', start: 840, end: 1010 },
];