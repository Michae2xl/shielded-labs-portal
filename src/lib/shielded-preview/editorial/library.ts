import importedCatalog from './catalog.json';
import { institutionalDocuments } from './institutional';
import { internalSimulatorLink, simulatorDocuments } from './simulators';
import type { EditorialEntry } from './types';

export const editorialCatalog: EditorialEntry[] = [
  ...importedCatalog as EditorialEntry[],
  ...institutionalDocuments,
  ...simulatorDocuments,
];
export const editorialCategories = ['All articles', 'News', 'Engineering Update', 'Governance', 'Security'];
export const categoryId = (value: string) => value === 'All articles' ? 'all' : value.toLowerCase().replace(/\s+/g, '-');
export const aboutSections = [
  { id: 'organization', label: 'Organization' }, { id: 'board', label: 'Board' }, { id: 'careers', label: 'Careers' }, { id: 'contact', label: 'Contact' }, { id: 'privacy', label: 'Privacy' },
];
export function editorialListHref(view: EditorialEntry['view'], section: string, query = '') {
  const params = new URLSearchParams({ view, section });
  if (query.trim()) params.set('q', query);
  return `?${params}`;
}
export function editorialHref(entry: EditorialEntry, section?: string, query = '') {
  const params = new URLSearchParams({ view: entry.view });
  params.set('section', section ?? (entry.view === 'about' ? entry.id.startsWith('board-') ? 'board' : entry.id === 'cryptographer' ? 'careers' : entry.id : entry.view === 'resources' ? entry.projects[0] ?? 'all' : 'all'));
  params.set('record', entry.id);
  if (query.trim()) params.set('q', query);
  return `?${params}`;
}
export function safeEditorialUrl(value: string): string | null {
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  if (value.startsWith('?view=') || value.startsWith('#')) return value;
  try {
    const url = new URL(value);
    if (!['https:', 'http:', 'mailto:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch { return null; }
}

// Resolve publisher links to the local record before rendering a document.
export function resolveEditorialLink(value: string): string | null {
  const safe = safeEditorialUrl(value);
  if (!safe || safe.startsWith('?') || safe.startsWith('#') || safe.startsWith('mailto:')) return safe;
  const url = new URL(safe);
  const simulator = internalSimulatorLink(url);
  if (simulator) return simulator;
  const matching = editorialCatalog.find(entry => {
    // Shared board/jobs source URLs describe several entries, not a single profile.
    if (entry.id.startsWith('board-') || entry.id === 'cryptographer') return false;
    const source = new URL(entry.source);
    return source.hostname === url.hostname && source.pathname.replace(/\/$/, '') === url.pathname.replace(/\/$/, '');
  });
  if (matching) {
    const hash = decodeURIComponent(url.hash.slice(1)).toLowerCase();
    const heading = matching.headings.find(item => item.id.toLowerCase() === hash);
    return editorialHref(matching) + (heading ? `#${encodeURIComponent(heading.id)}` : '');
  }
  if (url.hostname === 'shieldedlabs.github.io' && url.pathname.startsWith('/zebra-crosslink/')) {
    const book = editorialCatalog.find(item => item.id === 'crosslink-handbook');
    if (book) {
      const hash = decodeURIComponent(url.hash.slice(1));
      const heading = book.headings.find(item => item.id === hash);
      return editorialHref(book) + (heading ? `#${encodeURIComponent(heading.id)}` : '');
    }
  }
  if (url.hostname === 'github.com' && url.pathname.startsWith('/ShieldedLabs/zebra-crosslink/blob/main/')) {
    const book = editorialCatalog.find(item => item.id === 'crosslink-handbook');
    if (book) return editorialHref(book) + (url.pathname.endsWith('scoping.md') ? '#scope-for-crosslink' : '');
  }
  if (['shieldedlabs.net', 'www.shieldedlabs.net'].includes(url.hostname)) {
    const routes: Record<string, string> = { '/blog': 'blog', '/projects': 'projects', '/team': 'people', '/board': 'about&section=board', '/governance': 'governance', '/jobs': 'about&section=careers', '/contact': 'about&section=contact', '/job/cryptographer': 'about&section=careers&record=cryptographer' };
    const route = routes[url.pathname.replace(/\/$/, '')];
    if (route) return `?view=${route}`;
  }
  return safe;
}
export function searchEditorial(query: string): EditorialEntry[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  return editorialCatalog.filter(entry => {
    const text = `${entry.title} ${entry.author} ${entry.category} ${entry.summary} ${entry.projects.join(' ')} ${entry.headings.map(h => h.title).join(' ')}`.toLowerCase();
    return tokens.every(token => text.includes(token));
  });
}
