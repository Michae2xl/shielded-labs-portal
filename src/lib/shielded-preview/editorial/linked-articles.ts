import type { EditorialDocument, EditorialEntry } from './types';

/**
 * Articles published away from shieldedlabs.net. The portal keeps a short summary and the link,
 * not the text: the importer brings the full article and its artwork once the site publishes it.
 */
export const linkedArticles: EditorialDocument[] = [
  {
    id: 'the-network-sustainability-mechanism-nsm-activates-with-nu7',
    title: 'The Network Sustainability Mechanism (NSM) Activates with NU7',
    view: 'blog',
    category: 'News',
    projects: ['nsm'],
    author: 'Jason McGee',
    publishedAt: '2026-11-05T21:49:27Z',
    updatedAt: '2026-11-05T21:49:27Z',
    observedAt: '2026-11-05T22:35:00Z',
    source: 'https://x.com/aquietinvestor/status/2118460712096080208',
    summary: 'Jason McGee on the NSM activating with NU7: the share of fees removed from circulation, reissuance from 2031 and how coinholder sentiment shaped the design.',
    minutes: 3,
    headings: [],
    linked: { publisher: 'X', also: { label: 'Also on the Zcash Community Forum', href: 'https://forum.zcashcommunity.com/t/network-sustainability-mechanism-nsm/42703/335' } },
    body: [{ tag: 'p', children: ['According to the article, activation removes 60% of transaction fees from circulation, to be reissued through block rewards from 2031 within the 21 million supply cap. It also recounts how coinholder sentiment led to a design that keeps the halvings, in place of the original proposal to replace them.'] }],
  },
];

const titleKey = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Blog entries newest first, then everything else. A post the site has published replaces its linked entry. */
export function withLinkedArticles(imported: readonly EditorialEntry[], linked: readonly EditorialEntry[] = linkedArticles): EditorialEntry[] {
  const posts = imported.filter(entry => entry.view === 'blog');
  const published = new Set(posts.map(entry => titleKey(entry.title)));
  const blog = [...posts, ...linked.filter(entry => !published.has(titleKey(entry.title)))].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return [...blog, ...imported.filter(entry => entry.view !== 'blog')];
}
