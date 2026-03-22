'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api';

interface RouteGuardProps {
    children: React.ReactNode;
}

const PUBLIC_ROUTES = new Set(['/', '/login']);

export default function RouteGuard({ children }: RouteGuardProps) {
    const pathname = usePathname();
    const router = useRouter();

    const isPublicRoute = useMemo(() => {
        if (!pathname) return false;
        return PUBLIC_ROUTES.has(pathname);
    }, [pathname]);

    // Public routes are allowed immediately — no flash
    const [allowed, setAllowed] = useState(isPublicRoute);

    useEffect(() => {
        // Public routes: allow instantly, only redirect /login if authed
        if (isPublicRoute) {
            setAllowed(true);
            const authed = isAuthenticated();
            if (authed && pathname === '/login') {
                router.replace('/dashboard');
            }
            return;
        }

        // Protected routes: check auth
        setAllowed(false);
        const authed = isAuthenticated();

        if (!authed) {
            router.replace('/login');
            return;
        }

        setAllowed(true);
    }, [isPublicRoute, pathname, router]);

    if (!allowed) {
        return (
            <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--text-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}