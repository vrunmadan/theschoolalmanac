import ContactForm from '@/app/components/ContactForm';

export const metadata = {
  title: 'Contact & suggest a change',
  description: 'Add a missing school, correct a listing, report a curriculum that isn’t actually offered, request removal, or send feedback. Every change is verified before it goes live.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <main className="wrap" style={{ paddingBottom: 60, maxWidth: 680 }}>
      <p style={{ margin: '20px 0 6px' }}><a href="/">← All schools</a></p>
      <section className="hero" style={{ padding: '20px 0 12px' }}>
        <div className="eyebrow">Help us keep it accurate</div>
        <h1 style={{ fontSize: 30 }}>Contact &amp; suggest a change</h1>
        <p className="small muted" style={{ marginTop: 8 }}>
          Missing a school that runs Cambridge, IGCSE, IB or A-Levels? A listing that’s wrong — or one that no longer offers the curriculum? Tell us. Every submission is verified by a human before anything changes; we don’t auto-edit the directory.
        </p>
        <p className="small muted">You can also email us at <b>hello@theschoolalmanac.com</b>.</p>
      </section>
      <ContactForm />
      <p className="small muted" style={{ marginTop: 16 }}>
        A note on removals: we’ll correct or remove a listing that’s genuinely inaccurate, but a school can’t be removed simply to avoid verified parent reviews — keeping the directory neutral and complete is what makes it trustworthy.
      </p>
    </main>
  );
}
