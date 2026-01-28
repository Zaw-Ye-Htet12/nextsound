
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader } from '@/common';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    // If auth state is still loading, show a loader
    if (loading) {
        return <Loader />;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
