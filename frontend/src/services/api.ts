import axios from 'axios';

// withCredentials lets the browser send the login cookie to the backend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

// Turns an API error into a readable message.
export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(e)) {
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (!e.response) return 'Cannot reach the server. Is the backend running?';
  }
  return fallback;
}
