import { sources, team } from './content';
import { activityHref } from './development-navigation';
import { developmentCommits, developmentDays, isMergeCommit, repositoryLabels, windowCommits, type ObservedCommit } from './development-metrics';
import { personId, type Person } from './directory';
import { editorialCatalog, editorialHref, editorialListHref } from './editorial/library';
import type { Repository } from './types';
import { bundledZips, zipHref, zipLabel } from './zips/library';
import type { ZipEntry } from './zips/types';

type Profile = {
  /** Account linked from the person's entry on the official team page. */
  x?: string;
  /** Account confirmed by this person's commits or ZIP pull requests. */
  github?: string;
  /** Author names on those commits, including commits with no linked account. */
  commitNames?: string[];
  /** Name used on articles and ZIPs when it differs from the team page. */
  byline?: string;
  /** Record of the person's entry on the Board page. */
  board?: string;
  /** Published biography, word for word, from the Epoch announcement. */
  bio?: string;
};

const profiles: Record<string, Profile> = {
  'jason-mcgee-stramaglia': { x: 'aquietinvestor', github: 'aquietinvestor', byline: 'Jason McGee', board: 'board-jason-mcgee-stramaglia' },
  'zooko-wilcox': { x: 'zooko', board: 'board-zooko-wilcox' },
  'nate-wilcox': { x: 'nate_zec', github: 'shielded-nate' },
  'mark-henderson': { x: 'shieldedmark', github: 'sl-mrh', commitNames: ['Mark Henderson'] },
  'sam-smith': { x: 'SamHsmith2', github: 'SamHSmith', commitNames: ['Sam H. Smith'] },
  'andrew-reece': { x: 'azmreece', github: 'azmr', commitNames: ['Andrew Reece'] },
  'phillip-trudeau-tavara': { github: 'pmttavara', commitNames: ['Phillip Trudeau-Tavara'] },
  'shoaib-ahmed': { x: 'sufialhussaini', github: 'hu55a1n1', commitNames: ['Shoaib Ahmed'] },
  'ulrich-habock': {
    x: 'UHaboeck',
    bio: 'Ulrich is a leading expert at the forefront of current research in zero-knowledge proofs and post-quantum cryptography. He joins from StarkWare, where he worked as a cryptographer, following earlier work as an applied cryptographer at Polygon Labs (Polygon Zero). He is the author of logUp, the logarithmic-derivative lookup argument now used widely across the STARK ecosystem, and a co-author of the Circle STARKs paper with StarkWare’s Shahar Papini and David Levit, which introduced an efficient approach to STARKs over the Mersenne-31 field. His work on FRI, Brakedown, and zero-knowledge techniques for STARKs is also widely referenced by practitioners. Before moving into applied cryptography, Ulrich worked in academia and teaching. He studied at the University of Vienna and is currently based in Europe.',
  },
  'luke-edwards': {
    bio: 'Luke joins from Aztec, where he worked on the cryptography engineering team beginning in 2022 and most recently served as its technical lead. At Aztec, he worked on the cryptographic systems underlying the protocol and on bringing advanced zero-knowledge techniques into production. He holds a PhD in Applied Mathematics from the University of Arizona and a BS in Mathematics from Penn State. Earlier in his career, he worked as a systems engineer at Raytheon and as a graduate researcher at Los Alamos National Laboratory. He is based in the United States.',
  },
  'suyash-bagad': {
    x: 'BagadSuyash',
    bio: 'Suyash also joins from Aztec, where he worked on the barretenberg cryptography library and the PLONK family of proof systems, including performance improvements for various cryptographic primitives in ZK circuits. He holds both a B.Tech and M.Tech from IIT Bombay, where his graduate research focused on privacy-preserving proofs of reserves for Monero and MimbleWimble. He is based in Europe.',
  },
  'robert-fegler': {},
};

/** Anyone can write a name in a ZIP header, so a proposal counts only when one of these accounts opened it. */
const teamAccounts = new Set(Object.values(profiles).flatMap(profile => profile.github ? [profile.github.toLowerCase()] : []));
const ACTIVITY_PERIODS = [35, 84] as const;
const ARTICLES_SHOWN = 5;
const COMMITS_SHOWN = 3;

/** The shortest Code activity period that lists these commits, so the link never opens on an empty list. */
function activityPeriod(commits: ObservedCommit[], checkedAt?: string) {
  if (!checkedAt) return null;
  return ACTIVITY_PERIODS.find(period => windowCommits(commits, developmentDays(checkedAt, period)).length > 0) ?? null;
}

/** The team member behind a commit identity, when the account or Git author name is a confirmed one. */
export function teamMemberFor(identity: { login: string | null; name: string }) {
  const login = identity.login?.toLowerCase();
  return team.find(member => {
    const profile = profiles[personId(member)];
    return profile && ((login && profile.github?.toLowerCase() === login) || profile.commitNames?.includes(identity.name));
  }) ?? null;
}

/** Open proposals first, newest first, then the merged documents in their usual order. */
function personZips(byline: string, entries: readonly ZipEntry[]) {
  const named = entries.filter(entry => entry.owners.some(owner => owner.includes(byline)));
  const proposals = named
    .filter(entry => entry.kind === 'proposal' && entry.pull && teamAccounts.has(entry.pull.author.toLowerCase()))
    .sort((a, b) => (b.pull?.createdAt ?? '').localeCompare(a.pull?.createdAt ?? ''));
  return [...proposals, ...named.filter(entry => entry.kind !== 'proposal')];
}

/** Everything shown on a profile comes from that person's own records, and an absent record leaves no section. */
export function personProfile(person: Person, repositories: Repository[] = [], checkedAt?: string, zips: readonly ZipEntry[] = bundledZips.entries) {
  const profile = profiles[personId(person)] ?? {};
  const byline = profile.byline ?? person.name;
  const articles = editorialCatalog
    .filter(entry => entry.view === 'blog' && entry.author.includes(byline))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const login = profile.github?.toLowerCase();
  const names = profile.commitNames ?? [];
  const commits = developmentCommits(repositories).filter(commit => !isMergeCommit(commit) && ((login && commit.login?.toLowerCase() === login) || names.includes(commit.author)));
  const period = activityPeriod(commits, checkedAt);
  return {
    accounts: [
      ...(profile.x ? [{ label: 'X', handle: `@${profile.x}`, href: `https://x.com/${profile.x}` }] : []),
      ...(profile.github ? [{ label: 'GitHub', handle: profile.github, href: `https://github.com/${profile.github}` }] : []),
    ],
    sourceNote: [
      `Name, role${profile.x ? ', photo and X account' : ' and photo'} come from the official team page.`,
      ...(profile.github ? ['The GitHub account comes from their commits or pull requests.'] : []),
    ].join(' '),
    boardHref: profile.board ? `?view=about&section=board&record=${profile.board}` : null,
    bio: profile.bio ? { text: profile.bio, source: sources.epoch, project: 'epoch' } : null,
    articles: {
      latest: articles.slice(0, ARTICLES_SHOWN).map(entry => ({ title: entry.title, date: entry.publishedAt, href: editorialHref(entry) })),
      total: articles.length,
      allHref: editorialListHref('blog', 'all', byline),
    },
    zips: personZips(byline, zips).map(entry => ({ id: entry.id, label: zipLabel(entry), title: entry.title, status: entry.status, opened: entry.pull?.createdAt ?? null, href: zipHref(entry.id) })),
    // The commit data is a sample of each repository, so a profile lists dated commits rather than a total.
    activity: commits.length ? {
      latest: commits.slice(0, COMMITS_SHOWN).map(commit => ({
        sha: commit.sha,
        title: commit.title,
        date: commit.date,
        repositories: commit.repositories.map(name => repositoryLabels[name] ?? name).join(' · '),
        href: activityHref({ record: `commit:${commit.sha}` }),
      })),
      href: period ? activityHref({ query: names[0] ?? profile.github, period }) : null,
    } : null,
  };
}
