'use client';

import { usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';
import SimulationOverlay from '@/components/SimulationOverlay';

const PUBLIC_ROUTES = new Set(['/', '/login']);

export default function AuthSimulationOverlay() {
    const pathname = usePathname();

    // Only render on authenticated (non-public) pages
    if (!pathname || PUBLIC_ROUTES.has(pathname) || !isAuthenticated()) {
        return null;
    }

    return <SimulationOverlay />;
}
