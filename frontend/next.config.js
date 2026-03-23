/** @type {import('next').NextConfig} */
const BACKEND_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:8000';

const nextConfig = {
    // Proxy all /api/v1/* requests to the backend.
    // Browser never calls backend directly → no CORS issues.
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: `${BACKEND_URL}/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;
