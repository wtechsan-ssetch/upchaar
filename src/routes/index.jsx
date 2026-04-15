/**
 * routes/index.jsx
 * ─────────────────────────────────────────────────
 * Master routes file for Upchaar Health.
 *
 * React Router v6 requires that only <Route> elements
 * (or React.Fragments containing Routes) appear as
 * children of <Routes>. Custom component wrappers do
 * NOT work — so all routes are defined inline here.
 *
 * Organization: Routes are grouped by section with
 * comments. Each section maps to a feature folder.
 *
 * Sections:
 *  PUBLIC      → /, /doctors, /hospitals, /blogs, etc.
 *  PATIENT     → /patient/login, /patient/register, /patient/dashboard
 *  ADMIN       → /admin/login, /admin/*
 *  DOCTOR      → /doctor/login, /doctor/register, /doctor/*
 *  BLOGGER     → /blogger/login, /blogger/*
 *
 * To add a new section:
 *  1. Create the pages under src/your-section/pages/
 *  2. Import them here
 *  3. Add <Route> elements in the appropriate group below
 * ─────────────────────────────────────────────────
 */

import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// ── Shared layout & guards (always needed, not lazy) ──
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import RequireAuth from '@/components/RequireAuth.jsx';

// ── Auth ──────────────────────────────────────────────
const LoginPage      = lazy(() => import('@/auth/LoginPage.jsx'));
const DashboardGate  = lazy(() => import('@/auth/DashboardGate.jsx'));

// ── PUBLIC pages ──────────────────────────────────────
const LandingPage     = lazy(() => import('@/pages/Landing'));
const DashboardPage   = lazy(() => import('@/pages/Dashboard'));
const DoctorsPage     = lazy(() => import('@/pages/Doctors'));
const DoctorDetailPage = lazy(() => import('@/pages/DoctorDetail.jsx'));
const DiagnosticsPage = lazy(() => import('@/pages/Diagnostics'));
const HospitalsPage   = lazy(() => import('@/pages/Hospitals'));
const RecordsPage     = lazy(() => import('@/pages/Records'));
import EmergencyPage   from '@/pages/Emergency';
// const EmergencyPage   = lazy(() => import('@/pages/Emergency'));
const BlogsPage       = lazy(() => import('@/pages/Blogs.jsx'));
const BlogPostPage    = lazy(() => import('@/pages/BlogPost.jsx'));
const TermsPage       = lazy(() => import('@/pages/Terms.jsx'));

// ── PATIENT pages ─────────────────────────────────────
const PatientLogin     = lazy(() => import('@/patient/pages/PatientLogin.jsx'));
const PatientRegister  = lazy(() => import('@/patient/pages/PatientRegister.jsx'));
const PatientDashboard = lazy(() => import('@/patient/pages/PatientDashboard.jsx'));

// ── ADMIN pages ───────────────────────────────────────
const AdminLogin              = lazy(() => import('@/admin/pages/AdminLogin.jsx'));
const AdminLayout             = lazy(() => import('@/admin/layouts/AdminLayout.jsx'));
const AdminDashboard          = lazy(() => import('@/admin/pages/AdminDashboard.jsx'));
const DoctorManagement        = lazy(() => import('@/admin/pages/DoctorManagement.jsx'));
const PatientManagement       = lazy(() => import('@/admin/pages/PatientManagement.jsx'));
const AppointmentManagement   = lazy(() => import('@/admin/pages/AppointmentManagement.jsx'));
const NotificationCenter      = lazy(() => import('@/admin/pages/NotificationCenter.jsx'));
const ActivityLogs            = lazy(() => import('@/admin/pages/ActivityLogs.jsx'));
const Settings                = lazy(() => import('@/admin/pages/Settings.jsx'));
const FacilitiesManagement    = lazy(() => import('@/admin/pages/FacilitiesManagement.jsx'));
const SupportAdminManagement  = lazy(() => import('@/admin/pages/SupportAdminManagement.jsx'));
const BloggerManagement       = lazy(() => import('@/admin/pages/BloggerManagement.jsx'));

// ── DOCTOR pages ──────────────────────────────────────
const DoctorLayout       = lazy(() => import('@/doctor/layouts/DoctorLayout.jsx'));
const DoctorLogin        = lazy(() => import('@/doctor/pages/DoctorLogin.jsx'));
const DoctorDashboard    = lazy(() => import('@/doctor/pages/DoctorDashboard.jsx'));
const DoctorAppointments = lazy(() => import('@/doctor/pages/DoctorAppointments.jsx'));
const DoctorPatients     = lazy(() => import('@/doctor/pages/DoctorPatients.jsx'));
const DoctorPrescriptions = lazy(() => import('@/doctor/pages/DoctorPrescriptions.jsx'));
const DoctorProfile      = lazy(() => import('@/doctor/pages/DoctorProfile.jsx'));
const DoctorClinicPatients = lazy(() => import('@/doctor/pages/DoctorClinicPatients.jsx'));
const DoctorReleaseRequests = lazy(() => import('@/doctor/pages/DoctorReleaseRequests.jsx'));

// ── BLOGGER pages ─────────────────────────────────────
const BloggerLayout   = lazy(() => import('@/blog/layouts/BloggerLayout.jsx'));
const BloggerLogin    = lazy(() => import('@/blog/pages/BloggerLogin.jsx'));
const BloggerDashboard = lazy(() => import('@/blog/pages/BloggerDashboard.jsx'));
const PostEditor      = lazy(() => import('@/blog/pages/PostEditor.jsx'));
const MyPosts         = lazy(() => import('@/blog/pages/MyPosts.jsx'));
const BloggerProfile  = lazy(() => import('@/blog/pages/BloggerProfile.jsx'));

// ── MEDICAL & CLINIC pages ───────────
const MedicalDashboard = lazy(() => import('@/medical/pages/MedicalDashboard.jsx'));
const ClinicDashboard = lazy(() => import('@/clinic/pages/ClinicDashboard.jsx'));

// ── Minimal loading fallback ───────────────────────────
const PageLoader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #e2e8f0',
            borderTopColor: '#14b8a6',
            animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

/**
 * AppRoutes
 * The single <Routes> tree for the entire application.
 * Imported once in App.jsx inside <BrowserRouter>.
 *
 * NOTE: React Router v6 does not support custom component
 * wrappers as children of <Routes>. All <Route> elements
 * must be declared directly inside <Routes> or inside a
 * plain React.Fragment.
 */
export function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
        <Routes>

            {/* ═══════════════════════════════════════
                AUTH ROUTES
                Unified login/register for all types.
                /dashboard → DashboardGate (auth guard)
                ═══════════════════════════════════════ */}

            {/* Single login page: Sign In + Sign Up tabs */}
            <Route path="/login" element={<LoginPage />} />
            {/* /register opens the Sign Up tab directly */}
            <Route path="/register" element={<LoginPage />} />
            {/* Route guard: redirects to role-specific dashboard */}
            <Route path="/dashboard" element={<DashboardGate />} />

            {/* ═══════════════════════════════════════
                PUBLIC ROUTES
                Accessible to all visitors (no auth).
                ═══════════════════════════════════════ */}

            {/* Home / Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Feature pages share the AppLayout (sidebar/topbar) */}
            <Route path="/doctors" element={<ProtectedRoute><AppLayout><DoctorsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/doctors/:id" element={<ProtectedRoute><AppLayout><DoctorDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/diagnostics" element={<AppLayout><DiagnosticsPage /></AppLayout>} />
            <Route path="/hospitals" element={<AppLayout><HospitalsPage /></AppLayout>} />
            <Route path="/records" element={<AppLayout><RecordsPage /></AppLayout>} />
            <Route path="/emergency" element={<EmergencyPage />} />

            {/* Blog: public, no nav/sidebar */}
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/:slug" element={<BlogPostPage />} />
            <Route path="/terms" element={<TermsPage />} />


            {/* ═══════════════════════════════════════
                PATIENT ROUTES
                /patient/login      — Sign in
                /patient/register   — New account
                /patient/dashboard  — Protected dashboard
                ═══════════════════════════════════════ */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route path="/patient/dashboard" element={<RequireAuth><AppLayout><PatientDashboard /></AppLayout></RequireAuth>} />


            {/* ═══════════════════════════════════════
                ADMIN ROUTES
                /admin/login   — Standalone login page
                /admin/*       — Protected via AdminLayout
                Roles: super_admin (full), support_admin (limited)
                ═══════════════════════════════════════ */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="doctors" element={<DoctorManagement />} />
                <Route path="patients" element={<PatientManagement />} />
                <Route path="appointments" element={<AppointmentManagement />} />
                <Route path="notifications" element={<NotificationCenter />} />
                <Route path="logs" element={<ActivityLogs />} />
                <Route path="settings" element={<Settings />} />
                {/* Super Admin only — guarded inside AdminLayout by role check */}
                <Route path="facilities" element={<FacilitiesManagement />} />
                <Route path="support-admins" element={<SupportAdminManagement />} />
                <Route path="bloggers" element={<BloggerManagement />} />
            </Route>


            {/* ═══════════════════════════════════════
                DOCTOR ROUTES
                /doctor/login     — Sign in
                /doctor/register  — New doctor signup
                /doctor/*         — Protected via DoctorLayout
                Auth: Supabase Auth (DoctorContext)
                ═══════════════════════════════════════ */}
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor" element={<DoctorLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
                <Route path="clinics/:clinicName" element={<DoctorClinicPatients />} />
                <Route path="release" element={<DoctorReleaseRequests />} />
                <Route path="profile" element={<DoctorProfile />} />
            </Route>


            {/* ═══════════════════════════════════════
                BLOGGER ROUTES
                /blogger/login  — Sign in
                /blogger/*      — Protected via BloggerLayout
                Auth: Supabase Auth (BlogContext)
                Role: 'blogger' in controllers table
                ═══════════════════════════════════════ */}
            <Route path="/blogger/login" element={<BloggerLogin />} />
            <Route path="/blogger" element={<BloggerLayout />}>
                <Route index element={<BloggerDashboard />} />
                <Route path="dashboard" element={<BloggerDashboard />} />
                <Route path="write" element={<PostEditor />} />
                <Route path="edit/:id" element={<PostEditor />} />
                <Route path="posts" element={<MyPosts />} />
                <Route path="profile" element={<BloggerProfile />} />
            </Route>

            {/* ═══════════════════════════════════════
                MEDICAL & CLINIC ROUTES
                ═══════════════════════════════════════ */}
            <Route path="/medical/dashboard" element={<RequireAuth><MedicalDashboard /></RequireAuth>} />
            <Route path="/clinic/dashboard" element={<RequireAuth><ClinicDashboard /></RequireAuth>} />

        </Routes>
        </Suspense>
    );
}
