export interface Commit { sha: string; title: string; author: string; login: string | null; date: string; url: string; avatarUrl?: string | null; profileUrl?: string | null; authorType?: string | null }
export type RepositoryRefreshError = 'rate-limited' | 'unavailable' | 'invalid-response';
export interface Repository { name: string; branch: string; fork: boolean; description: string; url: string; language: string | null; commits: Commit[]; fetchedAt: string; state?: 'live' | 'snapshot'; refreshError?: RepositoryRefreshError | null }
export interface Grant { grant: string; grantee: string; category: string; program: string; status: string; milestones: number; milestonesPaid: number; usd: number; zec: number; firstPaid: string; lastPaid: string }
export interface PortalData { repos: Repository[]; checkedAt: string; grants: Grant[]; grantsState: 'live' | 'unavailable'; grantsFetchedAt: string | null }
