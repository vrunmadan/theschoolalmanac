export const metadata = {
  title: 'Privacy Policy',
  description: 'What The School Almanac collects, why, and how to exercise your rights over it.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 760 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '20px 0 12px' }}>
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 30 }}>Privacy Policy</h1>
        <p className="small muted" style={{ marginTop: 8 }}>Last updated: [FILL IN DATE OF PUBLISH].</p>
      </section>

      <div className="card" style={{ lineHeight: 1.7 }}>
        <p><b>[FILL IN: legal operating entity name and, if registered, CIN/registration
          number]</b> ("<b>The School Almanac</b>," "we," "us") operates
          theschoolalmanac.com. This policy explains what personal data we collect, why,
          how long we keep it, and how you can exercise your rights over it.</p>

        <h2 style={{ fontSize: 20 }}>1. What we collect</h2>
        <ul>
          <li><b>Contact / correction requests</b> (<code>/contact</code>): name, email,
            role, school name, and your message. Stored in a private Supabase bucket,
            readable only by us via an access-key-gated admin endpoint.</li>
          <li><b>Parent reviews</b>: the email or phone you enter to verify you're a real
            parent is never stored as-is — it is one-way hashed (SHA-256 with a private
            salt) before it touches our database, so we cannot recover it and it cannot be
            reversed to identify you. Your rating, free-text comments, and any fee figures
            you report are stored and published anonymously ("Verified Parent") once a
            human verifies your parent status against supporting documentation you provide
            separately (e.g. a fee receipt or admission letter, sent to
            hello@theschoolalmanac.com and not retained longer than needed to verify).</li>
          <li><b>School claims</b>: the name, role and email of whoever claims a school
            listing on the school's behalf, so we can grant dashboard access.</li>
          <li><b>Standard web analytics</b>: aggregate, non-identifying traffic data via
            Google Search Console, and, once configured, Google Analytics 4 (page views,
            approximate location, device type — IP-anonymized by default). We use this to
            understand which pages and cities are useful, never to identify an individual
            visitor or sell data about you.</li>
        </ul>

        <h2 style={{ fontSize: 20 }}>2. What we never do</h2>
        <ul>
          <li>We never sell parent data, to schools or anyone else.</li>
          <li>We never let a school buy visibility into who reviewed them — reviews are
            published anonymously and reviewer identity is hashed, not stored in the clear.</li>
          <li>We never publish a fee figure we haven't sourced from a school or a verified
            parent, tagged with which.</li>
        </ul>

        <h2 style={{ fontSize: 20 }}>3. Legal basis and retention</h2>
        <p>We process contact-form and review data to operate the service you're
          requesting (providing a directory entry, publishing your review) and on the
          basis of your consent when you submit a form. We keep contact-form submissions
          and claim records for as long as they're operationally relevant, and hashed
          reviewer identifiers for as long as the associated review is published.</p>

        <h2 style={{ fontSize: 20 }}>4. Your rights</h2>
        <p>You can ask us to correct or delete a review, contact submission, or claim
          associated with you by emailing <b>hello@theschoolalmanac.com</b> from the same
          address you used, or via <a href="/contact">the contact form</a>. Because reviewer
          identity is hashed rather than stored directly, we can only locate your record if
          you tell us which email/phone you originally used to submit it.</p>

        <h2 style={{ fontSize: 20 }}>5. Grievance Officer</h2>
        <p>In accordance with India's Information Technology (Intermediary Guidelines and
          Digital Media Ethics Code) Rules, 2021, complaints about content on this site
          (including a review you believe is false, defamatory, or violates our
          <a href="/terms"> Terms</a>) can be directed to:</p>
        <p style={{ marginLeft: 16 }}>
          <b>[FILL IN: Grievance Officer full name]</b><br />
          Email: <b>[FILL IN — e.g. grievance@theschoolalmanac.com, or hello@theschoolalmanac.com]</b><br />
          [FILL IN: postal address for the grievance officer, as required by the Rules]
        </p>
        <p>We acknowledge complaints within 24 hours and aim to resolve them within 15
          days (or faster for content the Rules classify as requiring expedited action).
          See our <a href="/terms">Terms of Service</a> for the full moderation and
          right-of-reply process for schools.</p>

        <h2 style={{ fontSize: 20 }}>6. Changes to this policy</h2>
        <p>If this policy changes materially, we'll update the date above and, for
          significant changes, note it on the homepage.</p>

        <h2 style={{ fontSize: 20 }}>7. Contact</h2>
        <p>Questions about this policy: <b>hello@theschoolalmanac.com</b>.</p>
      </div>
    </main>
  );
}
