// Server component. Shows the school's photo when we have one. Renders
// nothing when school.photos is empty — no stock/generic placeholder, in
// keeping with the brand rule to flag uncertainty rather than fake it
// (see Brand Foundation: "not yet verified" beats a guess).
export default function PhotoBlock({ school }) {
    const photos = school.photos || [];
    if (!photos.length) return null;

  return (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
{/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[0]}
        alt={`${school.name} campus photo`}
        loading="lazy"
        style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }}
      />
        </div>
  );
}
