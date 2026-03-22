/**
 * routes/index.jsx
 * ─────────────────────────────────────────────────
 * Master routes file for Sanjiwani Health.
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

import { Routes, Route } from 'react-router-dom';

// ── Auth: unified login page + dashboard gate ─────
import LoginPage from '@/auth/LoginPage.jsx';
import DashboardGate from '@/auth/DashboardGate.jsx';

// ── Shared layout ─────────────────────────────────
import AppLayout from '@/layouts/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

// ── PUBLIC pages ──────────────────────────────────
import LandingPage from '@/pages/Landing';
import DashboardPage from '@/pages/Dashboard';
import DoctorsPage from '@/pages/Doctors';
import DoctorDetailPage from '@/pages/DoctorDetail.jsx';
import DiagnosticsPage from '@/pages/Diagnostics';
import HospitalsPage from '@/pages/Hospitals';
import RecordsPage from '@/pages/Records';
import EmergencyPage from '@/pages/Emergency';
import BlogsPage from '@/pages/Blogs.jsx';
import BlogPostPage from '@/pages/BlogPost.jsx';

// ── PATIENT pages ─────────────────────────────────
import PatientLogin from '@/patient/pages/PatientLogin.jsx';
import PatientRegister from '@/patient/pages/PatientRegister.jsx';
import PatientDashboard from '@/patient/pages/PatientDashboard.jsx';

// ── ADMIN pages ───────────────────────────────────
import AdminLogin from '@/admin/pages/AdminLogin.jsx';
import AdminLayout from '@/admin/layouts/AdminLayout.jsx';
import AdminDashboard from '@/admin/pages/AdminDashboard.jsx';
import DoctorManagement from '@/admin/pages/DoctorManagement.jsx';
import PatientManagement from '@/admin/pages/PatientManagement.jsx';
import AppointmentManagement from '@/admin/pages/AppointmentManagement.jsx';
import NotificationCenter from '@/admin/pages/NotificationCenter.jsx';
import ActivityLogs from '@/admin/pages/ActivityLogs.jsx';
import Settings from '@/admin/pages/Settings.jsx';
import FacilitiesManagement from '@/admin/pages/FacilitiesManagement.jsx';
import SupportAdminManagement from '@/admin/pages/SupportAdminManagement.jsx';
import BloggerManagement from '@/admin/pages/BloggerManagement.jsx';

// ── DOCTOR pages ──────────────────────────────────
import DoctorLayout from '@/doctor/layouts/DoctorLayout.jsx';
import DoctorLogin from '@/doctor/pages/DoctorLogin.jsx';
import DoctorRegister from '@/doctor/pages/DoctorRegister.jsx';
import DoctorDashboard from '@/doctor/pages/DoctorDashboard.jsx';
import DoctorAppointments from '@/doctor/pages/DoctorAppointments.jsx';
import DoctorPatients from '@/doctor/pages/DoctorPatients.jsx';
import DoctorPrescriptions from '@/doctor/pages/DoctorPrescriptions.jsx';
import DoctorProfile from '@/doctor/pages/DoctorProfile.jsx';

// ── BLOGGER pages ─────────────────────────────────
import BloggerLayout from '@/blog/layouts/BloggerLayout.jsx';
import BloggerLogin from '@/blog/pages/BloggerLogin.jsx';
import BloggerDashboard from '@/blog/pages/BloggerDashboard.jsx';
import PostEditor from '@/blog/pages/PostEditor.jsx';
import MyPosts from '@/blog/pages/MyPosts.jsx';
import BloggerProfile from '@/blog/pages/BloggerProfile.jsx';

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

            {/* Patient-facing feature pages */}
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path="/doctors" element={<ProtectedRoute><AppLayout><DoctorsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/doctors/:id" element={<ProtectedRoute><AppLayout><DoctorDetailPage /></AppLayout></ProtectedRoute>} />
            <Route path="/diagnostics" element={<AppLayout><DiagnosticsPage /></AppLayout>} />
            <Route path="/hospitals" element={<AppLayout><HospitalsPage /></AppLayout>} />
            <Route path="/records" element={<AppLayout><RecordsPage /></AppLayout>} />
            <Route path="/emergency" element={<AppLayout><EmergencyPage /></AppLayout>} />

            {/* Blog — public listing + post detail */}
            <Route path="/blogs" element={<AppLayout><BlogsPage /></AppLayout>} />
            <Route path="/blogs/:slug" element={<AppLayout><BlogPostPage /></AppLayout>} />


            {/* ═══════════════════════════════════════
                PATIENT ROUTES
                /patient/login      — Sign in
                /patient/register   — New account
                /patient/dashboard  — Protected dashboard
                ═══════════════════════════════════════ */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/register" element={<PatientRegister />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />


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
            <Route path="/doctor/register" element={<DoctorRegister />} />
            <Route path="/doctor" element={<DoctorLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
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

        </Routes>
    );
}
