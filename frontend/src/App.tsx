import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SetupProfile from './pages/SetupProfile';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/setup-profile" element={<ProtectedRoute allowIncomplete><SetupProfile /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    </Routes>
  );
}
