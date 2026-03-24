import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import RouteGuard from '@/components/auth/RouteGuard';
import AuthSimulationOverlay from '@/components/auth/AuthSimulationOverlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Quantora — Network Risk Intelligence',
    description: 'Internal fraud intelligence dashboard for real-time transaction network analysis.',
    icons: {
        icon: '/icon.svg',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} antialiased`}>
                <ThemeProvider>
                    <RouteGuard>{children}</RouteGuard>
                    <AuthSimulationOverlay />
                </ThemeProvider>
            </body>
        </html>
    );
}
