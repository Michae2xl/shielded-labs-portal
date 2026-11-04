import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import documents from '@/lib/shielded-preview/editorial/documents.json';
import type { ContentNode } from '@/lib/shielded-preview/editorial/types';
import { DocumentBody, OrganizationBody } from './editorial';

describe('Organization source content', () => {
  it('retains every official paragraph and heading exactly once, including source anchors', () => {
    const nodes = documents.find(document => document.id === 'organization')!.body as ContentNode[];
    const onFollow = () => {};
    const markup = renderToStaticMarkup(createElement(OrganizationBody, { nodes, onFollow }));
    for (const node of nodes) {
      const original = renderToStaticMarkup(createElement(DocumentBody, { nodes: [node], onFollow }));
      expect(markup.split(original)).toHaveLength(2);
    }
    expect(markup).toContain('aria-labelledby="mission"');
    expect(markup).toContain('aria-labelledby="values"');
  });
});
