import { FreeSlot, RoutineEntry } from '../types/routine';
import { DAYS, durationText, formatMin } from '../utils/time';

const PX_PER_MIN = 0.9; // how tall one minute is on screen

interface Props {
  entries: RoutineEntry[];
  freeSlots: FreeSlot[];
  dayStartMin: number;
  dayEndMin: number;
  onSelect: (entry: RoutineEntry) => void; // called when a class is clicked
}

// The weekly picture: 7 day columns, time going down, classes as coloured blocks,
// free time as dashed green blocks.
export default function RoutineGrid({ entries, freeSlots, dayStartMin, dayEndMin, onSelect }: Props) {
  const height = (dayEndMin - dayStartMin) * PX_PER_MIN;

  // Turn a time into a vertical position (and keep it inside the grid).
  const y = (min: number) => (Math.min(Math.max(min, dayStartMin), dayEndMin) - dayStartMin) * PX_PER_MIN;

  const hourMarks: number[] = [];
  for (let m = Math.ceil(dayStartMin / 60) * 60; m <= dayEndMin; m += 60) hourMarks.push(m);

  return (
    <div className="rgrid-wrap">
      <div className="rgrid">
        <div className="rgrid-head">
          <div />
          {DAYS.map((d) => (
            <div key={d.key} className="rgrid-dayhead">{d.short}</div>
          ))}
        </div>

        <div className="rgrid-body" style={{ height }}>
          <div className="rgrid-times">
            {hourMarks.map((m) => (
              <span key={m} style={{ top: y(m) }}>{formatMin(m)}</span>
            ))}
          </div>

          {DAYS.map((d) => (
            <div key={d.key} className="rgrid-col" style={{ backgroundSize: `100% ${60 * PX_PER_MIN}px` }}>
              {freeSlots
                .filter((s) => s.day === d.key)
                .map((s) => {
                  const top = y(s.startMin);
                  const h = y(s.endMin) - top;
                  return (
                    <div
                      key={`${s.startMin}-${s.endMin}`}
                      className="rfree"
                      style={{ top, height: h }}
                      title={`Free ${formatMin(s.startMin)} - ${formatMin(s.endMin)}`}
                    >
                      {h >= 30 && <span>Free {durationText(s.endMin - s.startMin)}</span>}
                    </div>
                  );
                })}

              {entries
                .filter((e) => e.dayOfWeek === d.key)
                .map((e) => {
                  const top = y(e.startMin);
                  const h = y(e.endMin) - top;
                  if (h <= 0) return null;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`rentry ${e.type}`}
                      style={{ top, height: h }}
                      onClick={() => onSelect(e)}
                      title={`${e.courseCode} ${formatMin(e.startMin)} - ${formatMin(e.endMin)} (click to edit)`}
                    >
                      <strong>{e.courseCode}{e.section ? `-${e.section}` : ''}</strong>
                      {e.room && <span>{e.room}</span>}
                      {e.faculty && <span>{e.faculty}</span>}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}