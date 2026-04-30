/**
 * App.jsx
 * ─────────────────────────────────────────────────
 * Root application component for Upchar Health.
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
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Analytics } from '@vercel/analytics/react';

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
      <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f1f5f9">
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
                      <Analytics />
                    </ClinicProvider>
                  </MedicalProvider>
                </AdminProvider>
              </BlogProvider>
            </DoctorProvider>
          </PatientProvider>
        </AuthProvider>
      </SkeletonTheme>
    </Router>
  );
}

export default App;