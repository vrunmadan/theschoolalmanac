'use client';
import { useMemo, useState } from 'react';
import SchoolCard from './SchoolCard';

export default function Directory({ schools, cities, boards }) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [board, setBoard] = useState('');
  const list = useMemo(() => {
    const l = schools.filter((s) => {
      if (city && s.city !== city) return false;
      if (board && !(s.boards || []).includes(board)) return false;
      if (q) {
        const hay = (s.name + ' ' + (s.area || '') + ' ' + (s.boards || []).join(' ')).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    return [...l].sort((a, b) => a.name.localeCompare(b.name));
  }, [schools, q, city, board]);

  return (
    <>
      <div className="controls">
        <div className="search"><input placeholder="Search school or locality — e.g. Whitefield, IB, TISB"
          value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="filter" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>{cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="filter" value={board} onChange={(e) => setBoard(e.target.value)}>
          <option value="">All curricula</option>{boards.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>
      <p className="small muted"><b>{list.length}</b> schools</p>
      <div className="grid">
        {list.map((s) => <SchoolCard key={s.id} s={s} />)}
      </div>
    </>
  );
}
