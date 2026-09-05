// Content-Security-Policy is deliberately permissive on script/style-src:
// Chakra UI/Emotion inject styles at runtime (needs 'unsafe-inline' on
// style-src) and Next.js itself needs 'unsafe-inline' for its hydration
// bootstrap script. frame-ancestors 'none' is the meaningful line here —
// it's what actually closes the clickjacking gap, backed up by the
// X-Frame-Options header below for older browsers that don't read CSP.
//
// 'unsafe-eval' is added only outside production: Next's dev-mode Fast
// Refresh runtime evaluates code as a string for hot-reload, which a
// strict script-src blocks outright. Production builds don't use eval,
// so production stays on the tighter policy.
const isDev = process.env.NODE_ENV !== 'production';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://xitwhhgvbermrotscrrj.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https: http://localhost:*",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Only takes effect over HTTPS (browsers ignore it on plain HTTP, so this
  // is a no-op in local dev) — enforces HTTPS for a year, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Was hostname: '**' — an open image proxy accepting any HTTPS host.
      // Scoped down to the actual Supabase project the app's images live
      // in (Storage-hosted images, once that migration lands).
      {
        protocol: 'https',
        hostname: 'xitwhhgvbermrotscrrj.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
