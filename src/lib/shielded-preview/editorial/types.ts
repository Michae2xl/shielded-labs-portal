export type EditorialView = 'blog' | 'resources' | 'about';
export type ContentNode = string | {
  tag: string;
  children: ContentNode[];
  id?: string;
  href?: string;
  src?: string;
  alt?: string;
  colspan?: number;
  rowspan?: number;
};
export type EditorialEntry = {
  id: string;
  title: string;
  view: EditorialView;
  category: string;
  projects: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  observedAt: string;
  source: string;
  summary: string;
  minutes: number;
  headings: { id: string; title: string; level: number }[];
  dateKind?: 'retrieved';
  notice?: string;
  image?: { src: string; alt: string; width: number; height: number; source: string };
  /** Published away from shieldedlabs.net: a short summary and the links, until its full text is supplied. */
  linked?: { publisher: string; also?: { label: string; href: string }; fullText?: boolean };
};
export type EditorialDocument = EditorialEntry & { body: ContentNode[] };
