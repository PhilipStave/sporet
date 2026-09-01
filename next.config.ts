import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Vercel gives us HSTS and nothing else, so everything below was missing in
 * production. The two that matter most for a CRM: frame-ancestors stops
 * another site from putting Altiv in an invisible iframe and harvesting the
 * clicks of someone who is logged in, and form-action stops a page from
 * posting our forms somewhere else.
 *
 * The script rule keeps 'unsafe-inline' because Next.js inlines its own
 * hydration scripts and this app has no nonce plumbing; adding nonces means
 * touching every route. The rest of the policy still holds without it —
 * object-src, base-uri, form-action and frame-ancestors are what actually
 * stop the common attacks, and none of them depend on the script rule.
 *
 * connect-src has to allow Supabase, which the browser talks to directly for
 * auth and data. Stripe is not listed on purpose: checkout is a redirect from
 * our own server, so nothing Stripe-related runs in the browser.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Belt and braces next to frame-ancestors, for older browsers.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the full URL only to ourselves; other sites get the origin.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // We ask for none of these, so no page of ours should be able to.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
