import { FreeTimeResponse, NewEntry, RoutineEntry } from '../types/routine';
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