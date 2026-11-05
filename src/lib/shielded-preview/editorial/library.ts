import importedCatalog from './catalog.json';
import { institutionalDocuments } from './institutional';
import { withLinkedArticles } from './linked-articles';
import { internalSimulatorLink, simulatorDocuments } from './simulators';
import type { EditorialEntry } from './types';
import { projects } from '../content';
import { projectHref } from '../project-navigation';
import { bundledZips, zipHref } from '../zips/library';

export const editorialCatalog: EditorialEntry[] = [
  ...withLinkedArticles(importedCatalog as EditorialEntry[]),
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
  if (entry.view === 'resources' && entry.projects[0]) {
    const params = new URLSearchParams(projectHref(entry.projects[0], entry.category === 'FAQ' ? 'faq' : 'resources', entry.id).slice(1));
    if (query.trim()) params.set('q', query);
    return `?${params}`;
  }
  const params = new URLSearchParams({ view: entry.view });
  params.set('section', section ?? (entry.view === 'about' ? entry.id.startsWith('board-') ? 'board' : entry.id === 'cryptographer' ? 'careers' : entry.id : entry.view === 'resources' ? entry.projects[0] ?? 'all' : 'all'));
  params.set('record', entry.id);
  if (query.trim()) params.set('q', query);
  return `?${params}`;
}

/** Keep saved resource URLs working after the library moved into each project. */
export function legacyProjectResourceHref(value: string): string | null {
  const url = new URL(value, 'https://portal.example');
  const view = url.searchParams.get('view');
  if (view !== 'resources' && view !== 'projects') return null;
  const entry = editorialCatalog.find(item => item.view === 'resources' && item.id === url.searchParams.get('record'));
  let anchor = '';
  try { anchor = decodeURIComponent(url.hash.slice(1)); } catch { /* Keep malformed anchors inert. */ }
  const faq = entry?.category.includes('FAQ') && (entry.category === 'FAQ' || anchor === 'frequently-asked-questions-faq' || entry.headings.some(heading => heading.id === anchor && heading.level === 3));
  if (view === 'projects' && !(faq && url.searchParams.get('section') === 'resources' && url.searchParams.get('project') === entry?.projects[0])) return null;
  const project = projects.find(item => item.id === url.searchParams.get('section'));
  const href = entry ? faq ? projectHref(entry.projects[0], 'faq', entry.id) : editorialHref(entry) : project ? projectHref(project, 'resources') : '?view=projects';
  const params = new URLSearchParams(href.slice(1));
  for (const key of ['q', 'topic', 'simulation']) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }
  return `?${params}${url.hash}`;
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

// Chapter links from the imported print edition need their section, not the book's start.
const handbookChapters: Record<string, string> = {
  'user/build-and-usage.html': 'building-zebra-crosslink',
  'user/nix.html': 'nix-support',
  'design.html': 'crosslink-design',
  'design/scoping.html': 'scope-for-crosslink',
  'design/security-properties.html': 'crosslink-security-properties',
  'design/five-component-model.html': 'the-five-component-model',
  'design/userled-emergency-hardforks.html': 'user-led-emergency-hardforks',
  'design/nutshell.html': 'crosslink-design-in-a-nutshell',
  'terminology.html': 'terminology',
  'design/terminology.html': 'terminology',
  'design/cl2-construction.html': 'the-crosslink-2-construction',
  'design/analysis/construction.html': 'the-crosslink-2-construction',
  'design/analysis/history/2025-12-11-mech-design/proposal.html': 'proposal-mechanism-design-audit-of-crosslink-zebra',
  'implementation.html': 'crosslink-implementation',
  'design/analysis/cl2-security-analysis.html': 'security-analysis-of-crosslink-2',
  'design/security-analysis.html': 'security-analysis-of-crosslink-2',
};
const SOURCE_FOOTNOTE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A ZIP on the official site or in the repository opens in the portal's own library. */
function zipLibraryHref(url: URL): string | null {
  if (url.hostname === 'zips.z.cash' && ['', '/'].includes(url.pathname)) return '?view=governance&section=zips';
  const official = url.hostname === 'zips.z.cash' ? /^\/(zip-\d{4}|draft-[a-z0-9-]+)(?:\.(?:html|rst|md))?\/?$/i.exec(url.pathname) : null;
  // Only the default branch is the current text; a pinned commit stays where it points.
  const repository = url.hostname === 'github.com' ? /^\/zcash\/zips\/blob\/(?:main|master)\/zips\/(zip-\d{4}|draft-[a-z0-9-]+)\.(?:rst|md)$/i.exec(url.pathname) : null;
  const id = (official ?? repository)?.[1].toLowerCase();
  return id && bundledZips.entries.some(entry => entry.id === id) ? zipHref(id, url.hash) : null;
}

/** True when a reference stays inside the portal, so links can show the right arrow. */
export const opensInPortal = (href: string) => Boolean(resolveEditorialLink(href)?.startsWith('?view='));
/**
 * Where a cited source opens: the local document that holds its text, otherwise the source itself.
 * A list page such as Projects or Team has nothing to check a citation against.
 */
export function sourceHref(href: string): string {
  const resolved = resolveEditorialLink(href);
  return resolved?.startsWith('?view=') && /[?&]record=/.test(resolved) ? resolved : href;
}
export const sourceOpensInPortal = (href: string) => sourceHref(href).startsWith('?view=');
/** Attributes for a link that leaves the portal; a portal link needs none and navigates in place. */
export const leavingLink = (href: string) => /^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

// Resolve publisher links to the local record before rendering a document.
export function resolveEditorialLink(value: string): string | null {
  const safe = safeEditorialUrl(value);
  if (!safe || safe.startsWith('#') || safe.startsWith('mailto:')) return safe;
  if (safe.startsWith('?')) return legacyProjectResourceHref(safe) ?? safe;
  const url = new URL(safe);
  let anchor = '';
  try { anchor = decodeURIComponent(url.hash.slice(1)); } catch { return safe; }
  const simulator = internalSimulatorLink(url);
  if (simulator) return simulator;
  const zip = zipLibraryHref(url);
  if (zip) return zip;
  const matching = editorialCatalog.find(entry => {
    // Shared board/jobs source URLs describe several entries, not a single profile.
    if (entry.id.startsWith('board-') || entry.id === 'cryptographer') return false;
    const source = new URL(entry.source);
    return source.hostname === url.hostname && source.pathname.replace(/\/$/, '') === url.pathname.replace(/\/$/, '');
  });
  if (matching) {
    const heading = matching.headings.find(item => item.id.toLowerCase() === anchor.toLowerCase());
    // These markers point at footnotes the source page itself no longer has, so they stay plain text.
    if (anchor && !heading) return SOURCE_FOOTNOTE.test(anchor) ? null : safe;
    const href = matching.category.includes('FAQ') && (heading?.level === 3 || heading?.id === 'frequently-asked-questions-faq')
      ? projectHref(matching.projects[0], 'faq', matching.id) : editorialHref(matching);
    return href + (heading ? `#${encodeURIComponent(heading.id)}` : '');
  }
  if (url.hostname === 'shieldedlabs.github.io' && (url.pathname.startsWith('/zebra-crosslink/') || url.pathname === '/terminology.html')) {
    const book = editorialCatalog.find(item => item.id === 'crosslink-handbook');
    if (book) {
      const chapter = url.pathname.replace(/^\/(?:zebra-crosslink\/)?/, '');
      // An anchor the print edition lacks still opens its chapter, which holds the rule it names.
      const heading = book.headings.find(item => item.id === anchor) ?? book.headings.find(item => item.id === handbookChapters[chapter]);
      if (heading) return `${editorialHref(book)}#${encodeURIComponent(heading.id)}`;
      if (!anchor && ['', 'index.html'].includes(chapter)) return editorialHref(book);
      // Some source files and chapters are absent from the print import.
      return safe;
    }
  }
  const bookSource = url.hostname === 'github.com' ? /^\/ShieldedLabs\/zebra-crosslink\/blob\/main\/book\/src\/(.+)\.md$/.exec(url.pathname) : null;
  if (bookSource && handbookChapters[`${bookSource[1]}.html`]) {
    const book = editorialCatalog.find(item => item.id === 'crosslink-handbook');
    if (book) return `${editorialHref(book)}#${encodeURIComponent(handbookChapters[`${bookSource[1]}.html`])}`;
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
