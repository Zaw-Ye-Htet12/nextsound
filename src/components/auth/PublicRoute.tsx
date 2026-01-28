
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/common';

const PublicRoute = () => {
    const { user, loading } = useAuth();

    // If auth state is still loading, show a loader or nothing
    if (loading) {
        return <Loader />;
    }

    // If user is authenticated, redirect to home
    if (user) {
        return <Navigate to="/" replace />;
    }

    // If not authenticated, render the child routes
    return <Outlet />;
};

export default PublicRoute;
