/**
 * RequireAuth.jsx
 * ─────────────────────────────────────────────────
 * Wraps any route that requires an authenticated session.
 * Unauthenticated visitors are redirected to /login,
 * with the original location saved so they can be
 * sent back after signing in.
 * ─────────────────────────────────────────────────
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext.jsx';

export default function RequireAuth({ children }) {
    const { user, profile, loading, getDashboardPath } = useAuth();
    const location = useLocation();

    // Wait for the session to be restored before deciding
    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#14b8a6',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not authenticated → redirect to /login, remember where we came from
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Role-based dashboard enforcement
    if (profile && location.pathname.includes('/dashboard')) {
        const correctPath = getDashboardPath(profile);
        
        // If the user is trying to access a dashboard that is NOT theirs
        if (location.pathname !== correctPath && location.pathname !== '/dashboard') {
            return <Navigate to={correctPath} replace />;
        }
    }

    return children;
}
