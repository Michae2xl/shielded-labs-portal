import type { Project } from './content';
import publications from './project-publications.json';

export type PublicationReference = {
  source: string;
  documentId?: string;
  anchor?: string;
  publishedAt?: string;
};
export type PublicationExcerpt = PublicationReference & {
  text: string | null;
  detail?: string;
  ellipsisStart?: boolean;
  ellipsisEnd?: boolean;
  window?: string;
  steps?: string[];
};
export type PublicationRecord = PublicationReference & {
  title: string;
  href?: string;
  date?: string;
  dateLabel?: 'Completed' | 'Published';
};
export type ProjectPublication = {
  presentation: PublicationExcerpt & { text: string };
  badge?: PublicationExcerpt & { text: string };
  progress: PublicationExcerpt & { text: string };
  next: PublicationExcerpt;
  recordsHeading: string;
  records: PublicationRecord[];
  summaryReferences?: boolean;
};

// Exact source wording, including the source's own uncertainty and target language.
// A null next-step text is absence in the cited reference, not a project cancellation.
export const projectPublications = publications.projects as Record<Project['id'], ProjectPublication>;
export const projectCopyReviewedAt = publications.reviewedAt;

export function publicationQuote(excerpt: PublicationExcerpt): string | null {
  return excerpt.text === null ? null : `${excerpt.ellipsisStart ? '…' : ''}${excerpt.text}${excerpt.ellipsisEnd ? '…' : ''}`;
}
