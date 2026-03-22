/**
 * DashboardGate.jsx  (src/auth/DashboardGate.jsx)
 * ─────────────────────────────────────────────────
 * Route guard for the /dashboard URL.
 *
 * Behavior:
 *  - If user is NOT logged in → redirect to /login
 *  - If user IS logged in     → redirect to their role-specific
 *    dashboard based on profile_type:
 *
 *      patient   → /patient/dashboard
 *      doctor    → /doctor/dashboard
 *      clinic    → /clinic/dashboard
 *      medical   → /medical/dashboard
 *      hospital  → /hospital/dashboard
 *
 * This way /dashboard is never a "real" page —
 * it always bounces the user to the right place.
 * ─────────────────────────────────────────────────
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function DashboardGate() {
    const { user, profile, loading } = useAuth();

    // Show spinner while session is being restored on page load
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
            </div>
        );
    }

    // Not logged in → go to login
    if (!user || !profile) {
        return <Navigate to="/login" replace />;
    }

    // Logged in → redirect to the correct dashboard
    const dashboardRoutes = {
        patient: '/',                    // Patients land on the public landing page
        doctor: '/doctor/dashboard',
        clinic: '/clinic/dashboard',
        medical: '/medical/dashboard',
        hospital: '/hospital/dashboard',
    };

    const destination = dashboardRoutes[profile.profile_type] || '/';
    return <Navigate to={destination} replace />;
}
