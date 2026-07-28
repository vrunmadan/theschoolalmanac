// Server component. Renders an interactive Google Map + a free "Get directions"
// link. The interactive map uses Google's KEYLESS embed by default (no API key,
// no billing account, no cost). If NEXT_PUBLIC_MAPS_EMBED_KEY is ever set, it
// upgrades to the official Maps Embed API automatically.
const KEY = process.env.NEXT_PUBLIC_MAPS_EMBED_KEY;

function locQuery(s) {
  return [s.name, s.area, s.city, s.pincode, 'India'].filter(Boolean).join(', ');
}

export default function MapBlock({ school }) {
  const q = locQuery(school);
  const enc = encodeURIComponent(q);
  const directionsHref = school.gmaps || `https://www.google.com/maps/search/?api=1&query=${enc}`;
  const embedSrc = KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=${enc}&zoom=15`
    : `https://maps.google.com/maps?q=${enc}&z=15&output=embed`;
  const addr = school.address
    ? school.address + (school.pincode ? ` – ${school.pincode}` : '')
    : [school.area, school.city].filter(Boolean).join(', ');

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Location</h2>
        <a className="btn btn-primary" href={directionsHref} target="_blank" rel="noopener noreferrer">📍 Get directions</a>
      </div>
      {addr ? <p className="small muted" style={{ marginTop: 8 }}>{addr}</p> : null}
      <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
        <iframe
          title={`Map of ${school.name}`}
          loading="lazy"
          width="100%"
          height="300"
          style={{ border: 0, display: 'block' }}
          referrerPolicy="no-referrer-when-downgrade"
          src={embedSrc}
        />
      </div>
    </div>
  );
}
