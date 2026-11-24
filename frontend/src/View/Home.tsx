import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="panel">
      <h1>Hi, {user.name?.split(' ')[0] ?? 'there'} 🌸</h1>
      <p>Welcome to Meetly. Use the menu to look around.</p>
      <div className="soon-box">
        <strong>👯 Who is free with me</strong>
        <p className="muted small">Coming soon. After you add your routine and friends, you will see here who is free in your free time.</p>
      </div>
    </div>
  );
}