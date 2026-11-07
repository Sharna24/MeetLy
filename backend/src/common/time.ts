// Helpers for times stored as "minutes after midnight" (8:00 am = 480).

// 570 -> "9:30 am", 830 -> "1:50 pm"
export function formatMinutes(total: number): string {
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Do two time ranges clash? Ranges that only touch (one ends exactly when the other starts) do NOT clash.
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}