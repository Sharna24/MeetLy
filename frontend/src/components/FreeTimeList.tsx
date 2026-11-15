import { FreeSlot, RoutineEntry } from '../types/routine';
import { DAYS, durationText, formatMin } from '../utils/time';

// Free time written out in words, day by day.
export default function FreeTimeList({ slots, entries }: { slots: FreeSlot[]; entries: RoutineEntry[] }) {
  return (
    <div>
      {DAYS.map((d) => {
        const daySlots = slots.filter((s) => s.day === d.key);
        const hasClasses = entries.some((e) => e.dayOfWeek === d.key);
        return (
          <div key={d.key} className="free-day">
            <div className="day-name">{d.label}</div>
            <div className="chips">
              {!hasClasses && <span className="muted">No classes: free all day</span>}
              {hasClasses && daySlots.length === 0 && <span className="muted">No free time</span>}
              {daySlots.map((s) => (
                <span key={s.startMin} className="chip">
                  {formatMin(s.startMin)} - {formatMin(s.endMin)} ({durationText(s.endMin - s.startMin)})
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}