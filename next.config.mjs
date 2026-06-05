/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async rewrites() {
    return {
      fallback: [
        // Vite SPA in public/ — API routes under app/api take precedence
        { source: '/:path*', destination: '/index.html' },
      ],
    };
  },
};

export default nextConfig;
