export const metadata = {
  title: 'Terms of Service',
  description: 'The rules for using The School Almanac, submitting a review, and claiming a school listing — including our moderation and right-of-reply process.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 760 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '20px 0 12px' }}>
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 30 }}>Terms of Service</h1>
        <p className="small muted" style={{ marginTop: 8 }}>Last updated: [FILL IN DATE OF PUBLISH].</p>
      </section>

      <div className="card" style={{ lineHeight: 1.7 }}>
        <p>By using theschoolalmanac.com ("the Site"), operated by
          <b> [FILL IN: legal operating entity name]</b>, you agree to these terms. If you
          don't agree, please don't use the Site.</p>

        <h2 style={{ fontSize: 20 }}>1. What the Site is</h2>
        <p>A directory of international-curriculum schools in India, with editorial and
          school-stated facts, and — where enabled — verified-parent reviews. Content
          mixes our own editorial summaries, facts a school has claimed and stated, and
          user-generated content from parents. We flag which is which; see each page's
          "Last Verified" note.</p>

        <h2 style={{ fontSize: 20 }}>2. Reviews are user-generated content</h2>
        <p>Reviews are written by individual parents, not by us. We require a rating on
          seven fixed parameters and verify (see below) that a reviewer is a genuine parent
          of a student at the school before a review counts toward a public score, but we
          do not independently fact-check the substance of free-text comments or claimed
          fee figures. <b>We do not endorse, and are not responsible for, the content of
          any individual review.</b> Ranking and public scores are computed only from
          verified reviews meeting our published methodology — see the "verified parent
          reviews" section on each school's page — and can never be purchased by a school.</p>

        <h2 style={{ fontSize: 20 }}>3. Reviewer verification</h2>
        <p>A review is provisional ("pending") until a parent's status is verified against
          supporting documentation (e.g. a fee receipt, admission letter, or ID showing an
          address match) submitted separately. Only verified reviews count toward a
          school's public score, shown once a school has at least five. We use automated
          checks (matching a reviewer's declared email domain against a school's own staff
          domain, and detecting unusual bursts of same-direction reviews) to catch
          self-reviews and coordinated review campaigns, in addition to human verification.</p>

        <h2 style={{ fontSize: 20 }}>4. Right of reply, disputes, and takedown</h2>
        <p>A school that believes a published review is false, defamatory, or violates
          these Terms can:</p>
        <ul>
          <li><b>Reply publicly.</b> A claimed, verified school listing can post one public
            response to any review, shown alongside it.</li>
          <li><b>Dispute it.</b> Email <b>hello@theschoolalmanac.com</b> with the school
            name, the review in question, and the specific grounds for dispute (not simply
            "we disagree with this rating"). We acknowledge disputes within 24 hours.</li>
          <li><b>Escalate to our Grievance Officer</b> (see our <a href="/privacy">Privacy
            Policy</a>) for content-removal requests under applicable law. We aim to
            resolve grievances within 15 days.</li>
        </ul>
        <p>We will remove or amend a review found, on investigation, to be fabricated,
          from a non-parent, or in breach of these Terms. We will not remove a genuine
          verified review simply because a school disagrees with it — that would defeat
          the purpose of a neutral, parent-first directory, which is the entire premise of
          the Site.</p>

        <h2 style={{ fontSize: 20 }}>5. Prohibited content</h2>
        <p>When submitting a review or contact-form message, you agree not to post content
          that is defamatory, harassing, discriminatory, contains another named individual's
          personal information, is knowingly false, or that you were paid or incentivized
          by any party (including the school itself) to post without disclosing that fact.</p>

        <h2 style={{ fontSize: 20 }}>6. School listings and claims</h2>
        <p>A school representative can claim their listing to add school-stated facts and
          fees, which we publish clearly source-tagged as school-stated (as distinct from
          parent-reported). Claiming a listing does not grant any ability to alter, hide,
          or influence ranking or reviews. We reserve the right to verify a claim manually
          and to revoke a claim found to be fraudulent.</p>

        <h2 style={{ fontSize: 20 }}>7. No professional advice</h2>
        <p>Content on the Site is informational and does not constitute educational,
          legal, or financial advice. Verify fees, admissions requirements, and any figure
          on this Site directly with the school before relying on it.</p>

        <h2 style={{ fontSize: 20 }}>8. Limitation of liability</h2>
        <p>The Site is provided "as is." To the maximum extent permitted by law, we are
          not liable for decisions made in reliance on user-generated content, school-
          stated facts, or editorial summaries on the Site. [FILL IN: have this section
          reviewed by counsel before publishing — liability limitation language is
          jurisdiction-specific and this is a starting draft, not a final clause.]</p>

        <h2 style={{ fontSize: 20 }}>9. Changes</h2>
        <p>We may update these Terms; continued use after a change constitutes acceptance.
          Material changes will be noted on the homepage.</p>

        <h2 style={{ fontSize: 20 }}>10. Contact</h2>
        <p><b>hello@theschoolalmanac.com</b>. See our <a href="/privacy">Privacy Policy</a>
          for our Grievance Officer's contact details.</p>
      </div>
    </main>
  );
}
