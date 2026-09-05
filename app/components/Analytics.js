import Script from 'next/script';

// GA4, loaded only if NEXT_PUBLIC_GA_MEASUREMENT_ID is set — same graceful-degradation
// pattern as the Supabase-gated features (see lib/supabaseServer.js). No account was
// created on your behalf: create a free GA4 property at analytics.google.com (your
// existing Google Workspace account works), then set this env var in Netlify.
// IP anonymization is on by default in GA4; no cookie-consent banner is legally
// required in India today, but the Privacy Policy discloses this once it's active.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
