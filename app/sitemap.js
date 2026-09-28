import { getAllSchools, getCities, getBoards, slugify } from '@/lib/schools';
import { getAllGuides } from '@/lib/guides';

const SITE = 'https://theschoolalmanac.com';

export default function sitemap() {
  const now = new Date();
  const schools = getAllSchools().map((s) => ({
    url: `${SITE}/schools/${s.slug}`,
    lastModified: s.verified ? new Date(s.verified) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
  const cities = getCities().map((c) => ({
    url: `${SITE}/city/${slugify(c)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6,
  }));
  const boards = getBoards().map((b) => ({
    url: `${SITE}/curriculum/${slugify(b)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6,
  }));
  const guides = getAllGuides().map((g) => ({
    url: `${SITE}/guides/${g.slug}`,
    lastModified: g.updated ? new Date(g.updated) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    ...cities, ...boards, ...schools, ...guides,
  ];
}
