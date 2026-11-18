import { DragEvent, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/api';
import { confirmImport, previewImport } from '../services/routineApi';
import { ImportPreview } from '../types/routine';
import { DAYS, formatMin } from '../utils/time';

interface Props {
  existingCount: number;          // how many classes are in the routine now
  onImported: () => void;         // called after saving (the page reloads its data)
  onCancel: () => void;
}

const MAX_MB = 8;

// Import a routine from a PDF or a picture in 3 steps:
//   1. choose (or drop, or paste) a file   2. check what was found   3. press Import
export default function ImportPanel({ existingCount, onImported, onCancel }: Props) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);       // which found classes to keep
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    setError('');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`That file is bigger than ${MAX_MB} MB.`);
    if (!/^(application\/pdf|image\/(png|jpeg|webp))$/.test(file.type)) {
      return setError('Please choose a PDF, or a PNG or JPG picture.');
    }
    setBusy('reading');
    try {
      const result = await previewImport(file);
      setPreview(result);
      setPicked(result.classes.map((c) => !c.conflict)); // classes that clash start unticked
      setReplace(false);
    } catch (e) {
      setError(errorMessage(e, 'Could not read that file'));
    } finally {
      setBusy(null);
    }
  }

  // Paste a screenshot with Ctrl+V while this panel is open.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file && !preview && !busy) readFile(file);
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  const chosen = preview ? preview.classes.filter((_, i) => picked[i]) : [];
  const clashes = !replace && chosen.some((c) => c.conflict);

  async function save() {
    if (!preview || chosen.length === 0) return;
    setBusy('saving');
    setError('');
    try {
      await confirmImport(chosen, replace);
      onImported();
    } catch (e) {
      setError(errorMessage(e, 'Could not save the classes'));
      setBusy(null);
    }
  }

  function reset() {
    setPreview(null);
    setError('');
    if (fileInput.current) fileInput.current.value = '';
  }

  return (
    <div className="panel">
      <h2>Import your routine</h2>

      {!preview && (
        <>
          <div
            className={`dropzone ${dragging ? 'over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !busy && fileInput.current?.click()}
          >
            {busy === 'reading' ? (
              <>
                <div className="big-emoji">🔍</div>
                <p><strong>Reading your file…</strong></p>
                <p className="muted small">A picture can take 10 to 30 seconds the first time.</p>
              </>
            ) : (
              <>
                <div className="big-emoji">📄</div>
                <p><strong>Drop your class schedule here</strong>, or click to choose a file</p>
                <p className="muted small">PDF, PNG or JPG, up to {MAX_MB} MB. You can also paste a screenshot with Ctrl+V.</p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              hidden
              accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
            />
          </div>
          <ul className="tips muted small">
            <li><strong>Best:</strong> open your Class Schedule page, print it, and choose <em>Save as PDF</em>. A PDF is read exactly.</li>
            <li>A <strong>screenshot</strong> of the whole table also works. Keep it straight and sharp.</li>
            <li>Your file is only read to find your classes. It is not saved.</li>
          </ul>
        </>
      )}

      {preview && (
        <>
          <p>
            Found <strong>{preview.classes.length}</strong> {preview.classes.length === 1 ? 'class' : 'classes'}
            {preview.session ? <> for <span className="badge">{preview.session}</span></> : null}.
            Untick any that are wrong, then press Import.
          </p>

          {preview.warnings.length > 0 && (
            <ul className="warn-list">
              {preview.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}

          <div className="import-table">
            {preview.classes.map((c, i) => (
              <label key={`${c.courseCode}-${c.days.join('')}-${c.startMin}`} className={`import-row ${picked[i] ? '' : 'off'}`}>
                <input
                  type="checkbox"
                  checked={picked[i] ?? false}
                  onChange={() => setPicked((cur) => cur.map((v, k) => (k === i ? !v : v)))}
                />
                <div className="import-main">
                  <strong>{c.courseCode}{c.section ? `-${c.section}` : ''}</strong>
                  {c.type === 'lab' && <span className="tag lab">Lab</span>}
                  <span className="muted"> {[c.faculty, c.room].filter(Boolean).join(' · ')}</span>
                </div>
                <div className="import-when">
                  {c.days.map((d) => DAYS.find((x) => x.key === d)!.short).join(', ')}
                  <br />
                  <span className="muted">{formatMin(c.startMin)} - {formatMin(c.endMin)}</span>
                </div>
                {c.conflict && <div className="import-clash">{c.conflict}</div>}
              </label>
            ))}
          </div>

          {existingCount > 0 && (
            <div className="mode">
              <label><input type="radio" checked={!replace} onChange={() => setReplace(false)} /> Add these to my routine ({existingCount} classes now)</label>
              <label><input type="radio" checked={replace} onChange={() => setReplace(true)} /> Replace my whole routine with these</label>
            </div>
          )}
          {clashes && <p className="error">Some ticked classes overlap your current routine. Untick them, or choose Replace.</p>}
        </>
      )}

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        {preview && (
          <button onClick={save} disabled={busy !== null || chosen.length === 0 || clashes}>
            {busy === 'saving' ? 'Importing…' : `Import ${chosen.length} ${chosen.length === 1 ? 'class' : 'classes'}`}
          </button>
        )}
        {preview && <button className="secondary" onClick={reset} disabled={busy !== null}>Choose another file</button>}
        <button className="secondary" onClick={onCancel} disabled={busy !== null}>Cancel</button>
      </div>
    </div>
  );
}
