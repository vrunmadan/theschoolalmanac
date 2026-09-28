// Renders the block array authored in lib/guides.js. Kept deliberately
// generic (no per-guide markup) so every guide stays consistent, and kept
// as inline styles rather than new globals.css classes so this can ship
// without touching the shared stylesheet.
//
// 'board-links' and 'city-links' are resolved live against lib/schools.js
// at request time (this renders server-side, statically generated per
// guide) rather than being baked into the guide's own static text — so the
// counts a guide links out to stay correct as the directory grows, without
// anyone having to remember to update the copy.
import { getBoards, getCities, getSchoolsByBoardSlug, getSchoolsByCitySlug, slugify } from '@/lib/schools';

const headingStyle = { fontFamily: "'Fraunces',serif", color: 'var(--ink)' };

export default function ArticleBody({ sections }) {
  return (
    <div style={{ maxWidth: 680 }}>
      {sections.map((b, i) => {
        if (b.type === 'h2') {
          return (
            <h2 key={i} style={{ ...headingStyle, fontSize: 24, margin: '32px 0 12px' }}>
              {b.text}
            </h2>
          );
        }
        if (b.type === 'h3') {
          return (
            <h3 key={i} style={{ ...headingStyle, fontSize: 18, margin: '22px 0 8px' }}>
              {b.text}
            </h3>
          );
        }
        if (b.type === 'p') {
          return (
            <p key={i} style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink)', margin: '0 0 16px' }}>
              {b.text}
            </p>
          );
        }
        if (b.type === 'ul') {
          return (
            <ul key={i} style={{ margin: '0 0 16px', paddingLeft: 20 }}>
              {b.items.map((item, j) => (
                <li key={j} style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink)', marginBottom: 8 }}>
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === 'note') {
          return (
            <div key={i} className="note" style={{ margin: '4px 0 20px' }}>
              {b.text}
            </div>
          );
        }
        if (b.type === 'board-links') {
          const boards = getBoards();
          return (
            <div key={i} className="badges" style={{ margin: '4px 0 20px' }}>
              {boards.map((board) => {
                const slug = slugify(board);
                const count = getSchoolsByBoardSlug(slug).length;
                return (
                  <a key={board} className="chip" href={`/curriculum/${slug}`}>
                    {board} · {count}
                  </a>
                );
              })}
            </div>
          );
        }
        if (b.type === 'city-links') {
          const cities = getCities();
          return (
            <div key={i} className="badges" style={{ margin: '4px 0 20px' }}>
              {cities.map((city) => {
                const slug = slugify(city);
                const count = getSchoolsByCitySlug(slug).length;
                return (
                  <a key={city} className="chip" href={`/city/${slug}`}>
                    {city} · {count}
                  </a>
                );
              })}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
