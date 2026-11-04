import { z } from 'zod';

export const zipKinds = ['zip', 'draft', 'guide', 'proposal'] as const;
export type ZipKind = typeof zipKinds[number];
export const zipIdPattern = /^[a-z0-9][a-z0-9-]{0,119}$/;
const id = z.string().regex(zipIdPattern);
const https = z.string().regex(/^https:\/\/\S+$/);
const text = (max: number) => z.string().max(max);

/** One row of index.json: metadata read from the ZIP header, never the body. */
export const zipEntrySchema = z.object({
  id,
  number: z.number().int().nonnegative().nullable(),
  title: text(300).min(1),
  status: text(60),
  statusDetail: text(400).nullable(),
  category: text(120),
  owners: z.array(text(120)).max(40),
  created: text(40).nullable(),
  updatedAt: text(40).nullable(),
  license: text(200).nullable(),
  discussionsTo: https.nullable(),
  pullRequest: https.nullable(),
  kind: z.enum(zipKinds),
  format: z.enum(['rst', 'md']),
  source: https,
  official: https,
  summary: text(400),
  words: z.number().int().nonnegative(),
  digest: z.string().regex(/^[0-9a-f]{64}$/),
  /** Merged document this proposal changes, when it is not a new ZIP. */
  base: id.nullable().optional(),
  /** Present on previews rendered from an open pull request. */
  pull: z.object({
    number: z.number().int().positive(),
    title: text(300),
    author: text(100),
    draft: z.boolean(),
    url: z.string().regex(/^https:\/\/github\.com\/zcash\/zips\/pull\/\d+$/),
    headSha: z.string().regex(/^[0-9a-f]{40}$/),
    createdAt: text(40),
    updatedAt: text(40),
    change: z.enum(['new', 'update']),
    file: text(200),
    files: z.array(text(200)).max(20),
  }).optional(),
});
export type ZipEntry = z.infer<typeof zipEntrySchema>;

/** Inert document nodes: the renderer decides which tags and attributes become elements. */
export type ZipNode = string | {
  tag: string;
  children: ZipNode[];
  id?: string;
  href?: string;
  src?: string;
  alt?: string;
  colspan?: number;
  rowspan?: number;
  start?: number;
  attrs?: Record<string, string>;
};
export const zipNodeSchema: z.ZodType<ZipNode> = z.lazy(() => z.union([
  z.string(),
  z.object({
    tag: z.string().regex(/^[a-z][a-z0-9]{0,15}$/),
    children: z.array(zipNodeSchema),
    id: text(200).optional(),
    href: text(2000).optional(),
    src: text(300).optional(),
    alt: text(500).optional(),
    colspan: z.number().int().min(1).max(20).optional(),
    rowspan: z.number().int().min(1).max(20).optional(),
    start: z.number().int().min(0).optional(),
    attrs: z.record(z.string().regex(/^[a-z]{1,24}$/), text(40)).optional(),
  }),
]));
export const zipHeadingSchema = z.object({ id: text(200), title: text(300), level: z.number().int().min(2).max(4) });
export type ZipHeading = z.infer<typeof zipHeadingSchema>;
export const zipDocumentSchema = zipEntrySchema.extend({
  headings: z.array(zipHeadingSchema).max(500),
  body: z.array(zipNodeSchema).max(20000),
});
export type ZipDocument = z.infer<typeof zipDocumentSchema>;

export const zipMetaSchema = z.object({
  syncedAt: text(40),
  upstream: z.object({ repository: https, branch: text(60), commit: z.string().regex(/^[0-9a-f]{40}$/).nullable(), committedAt: text(40).nullable() }),
  counts: z.record(z.string(), z.number().int().nonnegative()),
  failures: z.array(z.object({ file: text(200), error: text(300) })).max(500),
  pulls: z.object({ listed: z.number().int().nonnegative(), rendered: z.number().int().nonnegative(), failures: z.array(z.object({ pull: z.number().int(), file: text(200).optional(), error: text(300) })).max(500) }).nullable().optional(),
  license: text(40),
  generator: text(120),
});
export type ZipMeta = z.infer<typeof zipMetaSchema>;

export type ZipsIndex = { state: 'snapshot' | 'fetched'; observedAt: string | null; error: boolean; meta: ZipMeta; entries: ZipEntry[] };
