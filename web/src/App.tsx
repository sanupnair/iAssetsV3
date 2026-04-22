import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useUIStore }  from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { lightTheme, darkTheme } from '@/theme';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import OrganizationsPage  from '@/pages/control-panel/organizations/OrganizationsPage';
import BranchesPage       from '@/pages/control-panel/branches/BranchesPage';
import LocationsPage      from '@/pages/control-panel/locations/LocationsPage';
import DepartmentsPage    from '@/pages/control-panel/departments/DepartmentsPage';
import DesignationsPage   from '@/pages/control-panel/designations/DesignationsPage';
import RolesPage          from '@/pages/control-panel/roles/RolesPage';
import UsersPage          from '@/pages/control-panel/users/UsersPage';

// ── Protected Route ───────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const themeMode = useUIStore((s) => s.themeMode);

  const theme = useMemo(() => {
    if (themeMode === 'dark') return darkTheme;
    return lightTheme;
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/control-panel/organizations" replace />} />

          {/* Control Panel */}
          <Route path="control-panel">
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="branches"      element={<BranchesPage />} />
            <Route path="locations"     element={<LocationsPage />} />
            <Route path="departments"   element={<DepartmentsPage />} />
            <Route path="designations"  element={<DesignationsPage />} />
            <Route path="roles"         element={<RolesPage />} />
            <Route path="users"         element={<UsersPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}