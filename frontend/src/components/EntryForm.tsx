import { FormEvent, useState } from 'react';
import { createEntries, deleteEntry, updateEntry } from '../services/routineApi';
import { errorMessage } from '../services/api';
import { Day, EntryType, RoutineEntry } from '../types/routine';
import { CLASS_SLOTS, DAYS, LAB_SLOTS, fromInput, toInput } from '../utils/time';

interface Props {
  entry?: RoutineEntry;   // give an entry to EDIT it; leave it out to ADD a new class
  onSaved: () => void;    // called after saving or deleting (the page reloads its data)
  onCancel: () => void;
}

export default function EntryForm({ entry, onSaved, onCancel }: Props) {
  const editing = Boolean(entry);

  const [courseCode, setCourseCode] = useState(entry?.courseCode ?? '');
  const [section, setSection] = useState(entry?.section ?? '');
  const [faculty, setFaculty] = useState(entry?.faculty ?? '');
  const [room, setRoom] = useState(entry?.room ?? '');
  const [type, setType] = useState<EntryType>(entry?.type ?? 'class');
  const [days, setDays] = useState<Day[]>(entry ? [entry.dayOfWeek] : []);
  const [startMin, setStartMin] = useState(entry?.startMin ?? 480);
  const [endMin, setEndMin] = useState(entry?.endMin ?? 560);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const slots = type === 'lab' ? LAB_SLOTS : CLASS_SLOTS;
  const presetIndex = slots.findIndex((s) => s.start === startMin && s.end === endMin); // -1 = custom

  function toggleDay(d: Day) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function choosePreset(value: string) {
    if (value === 'custom') return; // keep the typed times
    const s = slots[Number(value)];
    setStartMin(s.start);
    setEndMin(s.end);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!courseCode.trim()) return setError('Enter the course code, for example CSE425');
    if (days.length === 0) return setError('Choose at least one day');
    if (endMin <= startMin) return setError('The end time must be after the start time');

    setBusy(true);
    try {
      if (entry) {
        await updateEntry(entry.id, {
          courseCode, section, faculty, room, type, dayOfWeek: days[0], startMin, endMin,
        });
      } else {
        await createEntries({ courseCode, section, faculty, room, type, days, startMin, endMin });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not save the class'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry || !window.confirm(`Delete ${entry.courseCode} on ${entry.dayOfWeek}?`)) return;
    setBusy(true);
    try {
      await deleteEntry(entry.id);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the class'));
      setBusy(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{editing ? `Edit ${entry!.courseCode} (${entry!.dayOfWeek})` : 'Add a class'}</h2>

      <div className="form-grid">
        <label>Course code
          <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CSE425" />
        </label>
        <label>Section
          <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. 06" />
        </label>
        <label>Faculty initial
          <input value={faculty} onChange={(e) => setFaculty(e.target.value)} placeholder="e.g. MMM" />
        </label>
        <label>Room
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 09G-31T" />
        </label>
        <label>Type
          <select value={type} onChange={(e) => setType(e.target.value as EntryType)}>
            <option value="class">Class</option>
            <option value="lab">Lab</option>
            <option value="office_hours">Office hours</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <div>
        <strong>{editing ? 'Day' : 'Days (a class often meets twice a week)'}</strong>
        <div className="days">
          {editing ? (
            <select value={days[0]} onChange={(e) => setDays([e.target.value as Day])}>
              {DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          ) : (
            DAYS.map((d) => (
              <label key={d.key} className={`day-chip ${days.includes(d.key) ? 'on' : ''}`}>
                <input type="checkbox" checked={days.includes(d.key)} onChange={() => toggleDay(d.key)} />
                {d.short}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="form-grid">
        <label>Time slot
          <select value={presetIndex >= 0 ? String(presetIndex) : 'custom'} onChange={(e) => choosePreset(e.target.value)}>
            {slots.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            <option value="custom">Custom time</option>
          </select>
        </label>
        <label>Starts
          <input type="time" value={toInput(startMin)} onChange={(e) => e.target.value && setStartMin(fromInput(e.target.value))} />
        </label>
        <label>Ends
          <input type="time" value={toInput(endMin)} onChange={(e) => e.target.value && setEndMin(fromInput(e.target.value))} />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add class'}</button>
        <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        {editing && <button type="button" className="danger" onClick={remove} disabled={busy}>Delete</button>}
      </div>
    </form>
  );
}