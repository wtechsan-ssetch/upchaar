/**
 * App.jsx
 * ─────────────────────────────────────────────────
 * Root application component for Upchaar Health.
 *
 * Architecture:
 * ┌─ BrowserRouter
 * │  ├─ AuthProvider        → Unified auth (MUST be inside Router for useNavigate)
 * │  │   ├─ PatientProvider
 * │  │   ├─ DoctorProvider
 * │  │   ├─ BlogProvider
 * │  │   └─ AdminProvider
 * │  └─ AppRoutes
 *
 * NOTE: AuthProvider is now inside <Router> so that any component using
 * useNavigate() (e.g. the Landing Header's sign-out button) can safely
 * access the router context.
 * ─────────────────────────────────────────────────
 */

import { BrowserRouter as Router } from 'react-router-dom';

// ── Portal-specific context providers ────────────
import { PatientProvider } from '@/patient/context/PatientContext.jsx';
import { DoctorProvider } from '@/doctor/context/DoctorContext.jsx';
import { BlogProvider } from '@/blog/context/BlogContext.jsx';
import { AdminProvider } from '@/admin/context/AdminContext.jsx';
import { MedicalProvider } from '@/medical/context/MedicalContext.jsx';
import { ClinicProvider } from '@/clinic/context/ClinicContext.jsx';

// ── Unified auth context (must be inside <Router>) ─
import { AuthProvider } from '@/auth/AuthContext.jsx';

// ── Master routes ─────────────────────────────────
import { AppRoutes } from '@/routes/index.jsx';

function App() {
  return (
    <Router>
      {/*
        AuthProvider is INSIDE <Router> so that components that use
        useAuth() + useNavigate() (e.g. Landing Header sign-out) work correctly.
      */}
      <AuthProvider>
        <PatientProvider>
          <DoctorProvider>
            <BlogProvider>
              <AdminProvider>
                <MedicalProvider>
                  <ClinicProvider>
                    <AppRoutes />
                  </ClinicProvider>
                </MedicalProvider>
              </AdminProvider>
            </BlogProvider>
          </DoctorProvider>
        </PatientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;