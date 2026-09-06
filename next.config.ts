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
  /**
   * www til apex.
   *
   * www.altiv.no pekte allerede på Vercel i DNS, men vertsnavnet var ikke lagt
   * inn i prosjektet. Da fantes det ikke sertifikat for det, og alle som skrev
   * www fikk en sikkerhetsadvarsel fra nettleseren i stedet for siden. Nå er
   * domenet lagt inn, og her bestemmes retningen: apex er den ekte adressen,
   * og alle canonical-tagger peker dit.
   *
   * Retningen står i koden med vilje. Vercels dialog for å legge til et
   * www-domene foreslår som standard motsatt vei, og et feilklikk der ville
   * sendt hver eneste canonical-adresse gjennom en videresending.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.altiv.no" }],
        destination: "https://altiv.no/:path*",
        permanent: true,
      },
    ];
  },

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
