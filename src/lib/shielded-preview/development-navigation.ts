export type ActivityLocation = {
  mode: 'days' | 'contributors';
  period: 35 | 84;
  includeForks: boolean;
  repo: string;
  contributor: string;
  query: string;
  selected: string | null;
  record: string | null;
};

export function readActivityLocation(params: URLSearchParams): ActivityLocation {
  return {
    mode: params.get('mode') === 'contributors' ? 'contributors' : 'days',
    period: params.get('period') === '84' ? 84 : 35,
    includeForks: params.get('forks') === '1',
    repo: params.get('section') ?? '',
    contributor: params.get('author') ?? '',
    query: params.get('q') ?? '',
    selected: params.get('cell'),
    record: params.get('record'),
  };
}

/** One URL retains the exploration context when opening and returning from a record. */
export function activityHref(state: Partial<ActivityLocation> = {}): string {
  const params = new URLSearchParams({ view: 'activity' });
  if (state.mode === 'contributors') params.set('mode', state.mode);
  if (state.period === 84) params.set('period', '84');
  if (state.includeForks) params.set('forks', '1');
  if (state.repo) params.set('section', state.repo);
  if (state.contributor) params.set('author', state.contributor);
  if (state.query) params.set('q', state.query);
  if (state.selected) params.set('cell', state.selected);
  if (state.record) params.set('record', state.record);
  return `?${params}`;
}
