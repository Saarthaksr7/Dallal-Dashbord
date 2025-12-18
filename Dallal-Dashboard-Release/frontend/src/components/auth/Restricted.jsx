import React from 'react';
import { useAuthStore } from '../../store/auth';

const Restricted = ({ to = 'admin', children, fallback = null }) => {
    const user = useAuthStore((state) => state.user);

    // If user is not authenticated or doesn't have the role
    // Simple check: if to='admin', user.role must be 'admin'
    // Could be expanded for multiple roles
    if (!user || user.role !== to) {
        return fallback;
    }

    return <>{children}</>;
};

export default Restricted;
