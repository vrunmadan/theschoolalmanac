const SITE = 'https://theschoolalmanac.com';

// We WANT to be found by AI answer engines, so we explicitly welcome their
// crawlers (many sites accidentally block these) in addition to normal search.
export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      {
        userAgent: [
          'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
          'ClaudeBot', 'Claude-Web', 'anthropic-ai',
          'PerplexityBot', 'Perplexity-User',
          'Google-Extended', 'Applebot-Extended',
          'CCBot', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai',
        ],
        allow: '/',
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
