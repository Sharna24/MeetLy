import { useCallback, useEffect, useRef, useState } from 'react';
import EntryForm from '../components/EntryForm';
import FreeTimeList from '../components/FreeTimeList';
import ImportPanel from '../components/ImportPanel';
import RoutineGrid from '../components/RoutineGrid';
import { errorMessage } from '../services/api';
import { getFreeTime, listEntries } from '../services/routineApi';
import { FreeTimeResponse, RoutineEntry } from '../types/routine';

export default function Routine() {
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [free, setFree] = useState<FreeTimeResponse | null>(null);
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // null = form closed, 'new' = adding a class, an entry = editing that entry
  const [editing, setEditing] = useState<RoutineEntry | 'new' | null>(null);
  const [importing, setImporting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Ask the backend for the classes AND the free time.
  const load = useCallback(async () => {
    try {
      const [list, freeTime] = await Promise.all([listEntries(), getFreeTime()]);
      setEntries(list.entries);
      setSemester(list.semester);
      setFree(freeTime);
      setError('');
    } catch (e) {
      setError(errorMessage(e, 'Could not load your routine'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // When the form opens, scroll it into view.
  useEffect(() => {
    if (editing || importing) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing, importing]);

  async function saved() {
    setEditing(null);
    setImporting(false);
    await load(); // reload so the grid and free time update
  }

  if (loading) return <p className="center muted">Loading your routine…</p>;

  return (
    <div className="wide">
      <div className="page-head">
        <h1>My routine <span className="badge">{semester}</span></h1>
        {editing === null && !importing && (
          <div className="head-actions">
            <button className="secondary" onClick={() => setImporting(true)}>📥 Import PDF / picture</button>
            <button onClick={() => setEditing('new')}>+ Add class</button>
          </div>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {importing && (
        <div ref={formRef}>
          <ImportPanel existingCount={entries.length} onImported={saved} onCancel={() => setImporting(false)} />
        </div>
      )}

      {editing !== null && (
        <div ref={formRef}>
          <EntryForm
            key={editing === 'new' ? 'new' : editing.id}
            entry={editing === 'new' ? undefined : editing}
            onSaved={saved}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {entries.length === 0 && editing === null && !importing && (
        <div className="panel center">
          <div className="big-emoji">📅</div>
          <h2>Add your first class</h2>
          <p>Import your BRAC class schedule (PDF or picture) in one step, or add classes one by one. Meetly then finds your free time.</p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button onClick={() => setImporting(true)}>📥 Import PDF / picture</button>
            <button className="secondary" onClick={() => setEditing('new')}>+ Add class</button>
          </div>
        </div>
      )}

      {free && (
        <div className="panel">
          <RoutineGrid
            entries={entries}
            freeSlots={free.slots}
            dayStartMin={free.dayStartMin}
            dayEndMin={free.dayEndMin}
            onSelect={(entry) => setEditing(entry)}
          />
          <div className="legend">
            <span><i className="dot class" /> Class</span>
            <span><i className="dot lab" /> Lab</span>
            <span><i className="dot office_hours" /> Office hours</span>
            <span><i className="dot free" /> Free time (at least {free.minFreeMinutes} minutes)</span>
            <span className="muted">Click a class to edit or delete it.</span>
          </div>
        </div>
      )}

      {free && entries.length > 0 && (
        <div className="panel">
          <h2>Your free time</h2>
          <FreeTimeList slots={free.slots} entries={entries} />
        </div>
      )}
    </div>
  );
}
