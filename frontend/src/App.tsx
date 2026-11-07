import { Navigate, Route, Routes } from 'react-router-dom';
import ComingSoon from './components/ComingSoon';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/Mainlayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SetupProfile from './pages/SetupProfile';
import ProtectedRoute from './routes/ProtectedRoute';
import { navItems } from './routes/navItems';

export default function App() {
  return (
    <Routes>
      {/* Before the app: centered card, no menu */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/setup-profile"
          element={<ProtectedRoute allowIncomplete><SetupProfile /></ProtectedRoute>}
        />
      </Route>

      {/* The app: login required, menu on the side */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />

        {/* Pages not built yet get a "coming soon" page. Replace the element when you build one. */}
        {navItems
          .filter((item) => item.placeholder)
          .map((item) => (
            <Route key={item.path} path={item.path.slice(1)} element={<ComingSoon item={item} />} />
          ))}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}