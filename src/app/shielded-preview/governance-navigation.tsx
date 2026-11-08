'use client';

import s from './governance-navigation.module.css';
import GovernanceGlyph, { type GovernanceGlyphKind } from './governance-glyph';
import { governanceSectionSlug, governanceSections, type GovernanceSection } from '@/lib/shielded-preview/governance-sections';

export { governanceSections };
export type { GovernanceSection };
const glyphs: Record<GovernanceSection, GovernanceGlyphKind> = { Overview: 'overview', 'How it works': 'process', Proposals: 'proposals', Grants: 'grants', Voting: 'voting', Results: 'results', ZCAP: 'zcap', ZIPs: 'zips', Insights: 'insights', Transparency: 'transparency' };

export default function GovernanceNavigation({ value, onChange }: {
  value: GovernanceSection; onChange: (section: GovernanceSection) => void;
}) {
  return <nav className={s.navigation} aria-label="Governance sections">
    {governanceSections.map(section => <a key={section}
      href={`?view=governance&section=${governanceSectionSlug(section)}`}
      aria-current={value === section ? 'page' : undefined}
      onClick={event => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); onChange(section);
      }}><GovernanceGlyph kind={glyphs[section]}/><span>{section}</span></a>)}
  </nav>;
}
