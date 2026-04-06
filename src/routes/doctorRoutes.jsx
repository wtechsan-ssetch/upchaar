/**
 * doctorRoutes.jsx
 * ─────────────────────────────────────────────────
 * Defines routes for the Doctor Portal.
 *
 * Auth: Uses DoctorContext (Supabase Auth).
 *       Doctors sign in with Supabase credentials and
 *       their profile is stored in auth.user_metadata.
 *
 * Layout: DoctorLayout wraps all dashboard pages with
 *         the sidebar and top navigation.
 *
 * Route structure:
 *  /doctor/login      → Doctor sign-in page
 *  /doctor/register   → New doctor registration
 *  /doctor/*          → Protected doctor dashboard
 * ─────────────────────────────────────────────────
 */

import { Route } from 'react-router-dom';

// ── Doctor layout ─────────────────────────────────
import DoctorLayout from '@/doctor/layouts/DoctorLayout.jsx';

// ── Auth pages ────────────────────────────────────
import DoctorLogin from '@/doctor/pages/DoctorLogin.jsx';
import DoctorRegister from '@/doctor/pages/DoctorRegister.jsx';

// ── Dashboard pages ───────────────────────────────
import DoctorDashboard from '@/doctor/pages/DoctorDashboard.jsx';
import DoctorAppointments from '@/doctor/pages/DoctorAppointments.jsx';
import DoctorPatients from '@/doctor/pages/DoctorPatients.jsx';
import DoctorPrescriptions from '@/doctor/pages/DoctorPrescriptions.jsx';
import DoctorProfile from '@/doctor/pages/DoctorProfile.jsx';
import DoctorClinicPatients from '@/doctor/pages/DoctorClinicPatients.jsx';
import DoctorReleaseRequests from '@/doctor/pages/DoctorReleaseRequests.jsx';

/**
 * DoctorRoutes
 * Returns <Route> elements for the doctor portal.
 * Used inside the master <Routes> in routes/index.jsx.
 */
export function DoctorRoutes() {
    return (
        <>
            {/* Standalone auth pages (no layout wrapper) */}
            <Route path="/doctor/login" element={<DoctorLogin />} />
            <Route path="/doctor/register" element={<DoctorRegister />} />

            {/* Protected doctor routes — all share DoctorLayout */}
            <Route path="/doctor" element={<DoctorLayout />}>

                {/* Default redirect: /doctor → /doctor/dashboard */}
                <Route index element={<DoctorDashboard />} />
                <Route path="dashboard" element={<DoctorDashboard />} />

                {/* Doctor feature pages */}
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
                <Route path="clinics/:clinicName" element={<DoctorClinicPatients />} />
                <Route path="release" element={<DoctorReleaseRequests />} />
                <Route path="profile" element={<DoctorProfile />} />
            </Route>
        </>
    );
}
