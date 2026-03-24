'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Bell, Settings, BarChart3, GitBranch, List, Brain, Plug, Landmark, LogOut, ShieldCheck, Sun, Moon, Menu, X } from 'lucide-react';
import { logoutUser, getStoredUser, type AuthUser } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';

const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Risk Intelligence', href: '/network', icon: Network },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Transactions', href: '/transactions', icon: List },
    { label: 'Algorithm', href: '/algorithm', icon: Brain },
    { label: 'API Integration', href: '/api-integration', icon: Plug },
    { label: 'Bank Input', href: '/bank-input', icon: Landmark },
    { label: 'Alerts', href: '/alerts', icon: Bell },
    { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setUser(getStoredUser());
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    function isActive(href: string) {
        if (href === '/') return pathname === '/';
        return pathname === href || pathname?.startsWith(href + '/');
    }

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="h-14 flex items-center justify-between border-b border-[var(--border)]">
                <Link href="/" className="flex-1 h-full flex items-center gap-2.5 px-4 hover:bg-[var(--surface)] transition-colors duration-150">
                    <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                        <div className="w-3 h-3 bg-[var(--bg)] rounded-[2px]" />
                    </div>
                    <span className="text-[var(--text-primary)] font-semibold text-sm tracking-tight">Quantora</span>
                </Link>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-2 mr-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                    <X size={16} />
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-3 left-3 z-[60] p-2 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition-all"
                aria-label="Open menu"
            >
                <Menu size={16} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-[70]"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:relative z-[80] lg:z-auto
                w-52 flex-shrink-0 h-full border-r border-[var(--border)] bg-[var(--bg)] flex flex-col
                transition-transform duration-200 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {sidebarContent}

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5">
                {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] font-mono transition-all duration-150 ${active
                                ? 'bg-[var(--surface)] text-[var(--text-primary)] font-semibold border border-[var(--border)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-transparent'
                                }`}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full" />
                            )}
                            <Icon size={13} strokeWidth={active ? 2 : 1.5} />
                            {label}
                        </Link>
                    );
                })}

                {/* Admin Console — only for admins */}
                {user?.role === 'admin' && (
                    <>
                        <div className="pt-2 pb-1 px-3">
                            <div className="border-t border-[var(--border)]" />
                        </div>
                        <Link
                            href="/admin"
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[11px] font-mono transition-all duration-150 ${pathname === '/admin'
                                ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20'
                                : 'text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent'
                                }`}
                        >
                            {pathname === '/admin' && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber-400 rounded-full" />
                            )}
                            <ShieldCheck size={13} strokeWidth={pathname === '/admin' ? 2 : 1.5} />
                            Admin Console
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-[var(--border)] space-y-2">
                {user && (
                    <div className="flex items-center gap-2 px-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-violet-600'
                            }`}>
                            {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
                                {user.full_name || user.email}
                            </p>
                            <span className={`inline-flex items-center gap-0.5 text-[7px] font-mono uppercase tracking-widest ${user.role === 'admin' ? 'text-amber-400' : 'text-blue-400'
                                }`}>
                                {user.role === 'admin' ? <ShieldCheck size={7} /> : null}
                                {user.role}
                            </span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-all"
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? <Sun size={11} /> : <Moon size={11} />}
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                    <button
                        onClick={logoutUser}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-mono text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                    >
                        <LogOut size={11} />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
        </>
    );
}
