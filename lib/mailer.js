// Pluggable outbound mail. No email-sending provider is wired up yet (that's a
// separate decision — Resend, Postmark, or Google Workspace SMTP relay all
// work; needs an account + API key/credentials this codebase doesn't have).
//
// Until MAIL_PROVIDER is set, sendMail() logs the message and returns
// {delivered:false} instead of throwing — callers must handle that (e.g. the
// claim-confirmation flow returns the confirmation link in its own API
// response too, so a claim isn't silently lost while no provider is configured).
export async function sendMail({ to, subject, text, html }) {
  const provider = process.env.MAIL_PROVIDER;

  if (!provider) {
    console.log('[mailer] MAIL_PROVIDER not set — logging instead of sending:', {
      to, subject, text: text || html,
    });
    return { delivered: false, reason: 'no_provider_configured' };
  }

  if (provider === 'resend') {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM || 'The School Almanac <hello@theschoolalmanac.com>';
    if (!key) return { delivered: false, reason: 'resend_api_key_missing' };
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text, html: html || undefined }),
    });
    if (!res.ok) return { delivered: false, reason: `resend_error_${res.status}` };
    return { delivered: true };
  }

  // Add another provider here (e.g. 'smtp' via Workspace) when you pick one.
  return { delivered: false, reason: `unknown_provider:${provider}` };
}
