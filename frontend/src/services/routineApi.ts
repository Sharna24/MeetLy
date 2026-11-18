import { FreeTimeResponse, ImportPreview, ImportedClass, NewEntry, RoutineEntry } from '../types/routine';
import { api } from './api';

// All calls to the routine part of the backend live here, so pages stay clean.
export async function listEntries() {
  const r = await api.get<{ semester: string; entries: RoutineEntry[] }>('/routine/entries');
  return r.data;
}

export async function getFreeTime() {
  const r = await api.get<FreeTimeResponse>('/routine/free-time');
  return r.data;
}

export async function createEntries(data: NewEntry) {
  const r = await api.post<RoutineEntry[]>('/routine/entries', data);
  return r.data;
}

export async function updateEntry(id: string, data: Partial<Omit<RoutineEntry, 'id' | 'semester'>>) {
  const r = await api.patch<RoutineEntry>(`/routine/entries/${id}`, data);
  return r.data;
}

export async function deleteEntry(id: string) {
  await api.delete(`/routine/entries/${id}`);
}

// ---- Import from a PDF or picture ----

// Step 1: send the file, get back what the server found. Nothing is saved yet.
export async function previewImport(file: File) {
  const form = new FormData();
  form.append('file', file);
  const r = await api.post<ImportPreview>('/routine/import/preview', form);
  return r.data;
}

// Step 2: save the classes the student kept. replace = delete the current routine first.
export async function confirmImport(classes: ImportedClass[], replace: boolean) {
  const payload = classes.map(({ conflict, ...c }) => c); // "conflict" is only for showing in the preview
  const r = await api.post<{ classes: number; entries: number }>('/routine/import/confirm', { classes: payload, replace });
  return r.data;
}
