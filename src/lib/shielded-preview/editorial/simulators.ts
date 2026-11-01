import type { EditorialDocument } from './types';

const observedAt = '2026-10-28T00:00:00Z';
export const simulators = [
  { id: 'crosslink-simulator', project: 'crosslink', title: 'Crosslink economics', source: 'https://aphelionz.github.io/crosslink-economics-simulator/', model: 'Crosslink Economics Simulator', summary: 'Explore how staking participation, delegation and commission affect the model.', guide: 'crosslink-faq', guideLabel: 'Staking & security FAQ' },
  { id: 'nsm-simulator', project: 'nsm', title: 'NSM issuance & supply', source: 'https://zooko.github.io/zcash-network-sustainability-simulator/', model: 'Zcash Network Sustainability Simulator', summary: 'Compare supply and issuance paths under different sustainability scenarios.', guide: 'nsm-guide', guideLabel: 'How the NSM works' },
  { id: 'fees-simulator', project: 'fees', title: 'Dynamic Fees lab', source: 'https://fees.shieldedinfra.net/', model: 'Dynamic Fees Simulator', summary: 'Explore how fee rules and network demand affect transactions and the mempool.', guide: 'fees-guide', guideLabel: 'Dynamic Fees overview' },
] as const;
export type Simulator = typeof simulators[number];
export const feeSections = [
  { id: 'enter-zip-317-and-actions', label: 'Fee calculator' },
  { id: 'proposal', label: 'Fee proposal' },
  { id: 'difficulty-as-price-oracle', label: 'Difficulty & price' },
  { id: '', label: 'Full lab' },
];
export const simulatorDocuments: EditorialDocument[] = simulators.map(tool => ({
  id: tool.id, title: tool.title, view: 'resources', category: 'Simulator', projects: [tool.project],
  source: tool.source, summary: tool.summary, author: tool.model, dateKind: 'retrieved',
  observedAt, publishedAt: observedAt, updatedAt: observedAt, minutes: 0, headings: [], body: [],
}));

// Only model parameters are forwarded; a portal URL can never choose a frame host.
export function simulatorSource(id: string, scenario = ''): string | null {
  const tool = simulators.find(item => item.id === id);
  if (!tool) return null;
  const url = new URL(tool.source);
  if (id === 'crosslink-simulator' && scenario.startsWith('?') && scenario.length < 1000) {
    const params = new URLSearchParams(scenario.slice(1));
    for (const [key, maximum] of [['ps', 100], ['c', 100], ['dz', 21_000_000], ['ts', 21_000_000]] as const) {
      const raw = params.get(key);
      const value = Number(raw);
      if (raw && Number.isFinite(value) && value >= 0 && value <= maximum) url.searchParams.set(key, String(value));
    }
    if (['1', 'true'].includes(params.get('adv') ?? '')) url.searchParams.set('adv', '1');
  }
  // The original NSM application decodes this scenario inside its own isolated
  // frame. Never decode or evaluate model code in the parent portal.
  if (id === 'nsm-simulator' && /^#z=[A-Za-z0-9_-]{1,8000}$/.test(scenario)) url.hash = scenario;
  if (id === 'fees-simulator') {
    const section = scenario.startsWith('#') ? feeSections.find(item => item.id === scenario.slice(1)) : undefined;
    url.hash = section?.id ?? feeSections[0].id;
  }
  return url.href;
}

export function internalSimulatorLink(url: URL): string | null {
  const tool = simulators.find(item => {
    const source = new URL(item.source);
    return url.protocol === source.protocol && url.host === source.host && url.pathname.replace(/\/$/, '') === source.pathname.replace(/\/$/, '');
  });
  if (!tool) return null;
  const scenario = tool.id === 'crosslink-simulator' ? url.search : url.hash;
  const verified = new URL(simulatorSource(tool.id, scenario)!);
  const params = new URLSearchParams({ view: 'resources', section: 'simulators', record: tool.id });
  if (verified.search || verified.hash) params.set('simulation', verified.search + verified.hash);
  return `?${params}`;
}
