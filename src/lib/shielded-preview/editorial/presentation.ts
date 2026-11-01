import type { ContentNode } from './types';

type HeadingNode = Exclude<ContentNode, string>;
export type ContentSection = { heading: HeadingNode; body: ContentNode[] };

/** Keep imported wording and links intact while grouping flat heading-based content. */
export function groupContent(nodes: ContentNode[], level: 2 | 3) {
  const intro: ContentNode[] = [];
  const sections: ContentSection[] = [];
  for (const node of nodes) {
    if (typeof node !== 'string' && node.tag === `h${level}`) {
      sections.push({ heading: node, body: [] });
    } else {
      const section = sections.at(-1);
      (section ? section.body : intro).push(node);
    }
  }
  return { intro, sections };
}
