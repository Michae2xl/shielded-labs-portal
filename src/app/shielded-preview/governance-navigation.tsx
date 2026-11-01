'use client';

import s from './governance-navigation.module.css';
import GovernanceGlyph, { type GovernanceGlyphKind } from './governance-glyph';

export const governanceSections = ['Overview', 'Proposals', 'Grants', 'Voting', 'Results', 'ZCAP', 'Insights'] as const;

export type GovernanceSection = typeof governanceSections[number];
const glyphs: Record<GovernanceSection, GovernanceGlyphKind> = { Overview: 'overview', Proposals: 'proposals', Grants: 'grants', Voting: 'voting', Results: 'results', ZCAP: 'zcap', Insights: 'insights' };

export default function GovernanceNavigation({ value, onChange }: {
  value: GovernanceSection; onChange: (section: GovernanceSection) => void;
}) {
  return <nav className={s.navigation} aria-label="Governance sections">
    {governanceSections.map(section => <a key={section}
      href={`?view=governance&section=${section.toLowerCase()}`}
      aria-current={value === section ? 'page' : undefined}
      onClick={event => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); onChange(section);
      }}><GovernanceGlyph kind={glyphs[section]}/><span>{section}</span></a>)}
  </nav>;
}
