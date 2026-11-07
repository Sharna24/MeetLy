import { Outlet } from 'react-router-dom';

// Frame for the pages before the app: login and profile setup (a centered card, no menu).
export default function AuthLayout() {
  return (
    <div className="auth-page">
      <Outlet />
    </div>
  );
}