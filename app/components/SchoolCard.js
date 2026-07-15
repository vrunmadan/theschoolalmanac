import { fmtFee } from '@/lib/schools';

function FeeBlock({ s }) {
  const fee = fmtFee(s.tuition_num);
  const src = s.tuition
    ? (s.tuition.length > 46 ? s.tuition.slice(0, 44) + '...' : s.tuition)
    : null;
  return (
    <div>
      <div className="lbl">Annual tuition (Gr 9-10)</div>
      <div className="amt" style={fee ? undefined : { color: 'var(--slate)', fontSize: 16 }}>
        {fee || 'Not yet verified'}
      </div>
      {src ? <div className="src">{src}</div> : null}
    </div>
  );
}

function ListingNote() {
  return (
    <div className="note small" style={{ margin: 0 }}>
      Listed - details being verified. <b>Are you this school? Claim and verify.</b>
    </div>
  );
}

export default function SchoolCard({ s }) {
  const listing = s.tier === 'listing';
  return (
    <a className="card" href={`/schools/${s.slug}`} style={{ color: 'inherit' }}>
      <div>
        <h3>{s.name}</h3>
        <div className="loc">{s.area || s.city} - {s.city}</div>
      </div>
      <div className="badges">
        {(s.boards || []).slice(0, 4).map((b) => <span key={b} className="chip">{b}</span>)}
        {s.type ? <span className="chip type">{s.type}</span> : null}
      </div>
      {listing ? <ListingNote /> : <FeeBlock s={s} />}
      <div className="foot">
        {listing
          ? <span className="small muted">Listing</span>
          : <span className="vbadge"><span className="vdot" />Verified {s.verified}</span>}
        <span className="small muted">View</span>
      </div>
    </a>
  );
}
