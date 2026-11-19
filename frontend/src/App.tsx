import { Navigate, Route, Routes } from 'react-router-dom';
import ComingSoon from './components/ComingSoon';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SetupProfile from './pages/SetupProfile';
import ProtectedRoute from './routes/ProtectedRoute';
import { navItems } from './routes/navItems';
import Routine from './pages/Routine';
import AdminLayout from './layouts/AdminLayout';
import AccountsPage from './pages/adminpages/AccountsPage';
import FacultyVerificationPage from './pages/adminpages/FacultyVerificationPage';
import ReportsPage from './pages/adminpages/ReportsPage';
import { AdminRoute } from './routes/AdminRoute';
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
      {/* Admin area: admin role required, collapsible admin sidebar */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/verification" replace />} />
        <Route path="verification" element={<FacultyVerificationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
      </Route>
      {/* The app: login required, menu on the side */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="routine" element={<Routine />} />
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
