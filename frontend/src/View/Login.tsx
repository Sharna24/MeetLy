import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../services/api';

export default function Login() {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="card center">
      <h1>🌸 Meetly</h1>
      <p className="muted">Find out who is free, and hang out!</p>
      <p>Sign in with your BRAC University Google account</p>

      <div className="google-btn">
        <GoogleLogin
          onSuccess={async (res) => {
            setError('');
            try {
              await loginWithGoogle(res.credential!);
              navigate('/');
            } catch (e) {
              setError(errorMessage(e, 'Sign-in failed'));
            }
          }}
          onError={() => setError('Google sign-in was cancelled or failed')}
        />
      </div>

      {error && <p className="error">{error}</p>}
      <p className="muted small">Students: @g.bracu.ac.bd · Faculty: @bracu.ac.bd</p>
    </div>
  );
}
