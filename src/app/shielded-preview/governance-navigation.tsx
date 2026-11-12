'use client';

import type { MouseEvent } from 'react';
import Image from 'next/image';
import s from './governance-navigation.module.css';
import GovernanceGlyph, { type GovernanceGlyphKind } from './governance-glyph';
import { ShieldMark } from './shield';
import { governanceSectionSlug, governanceSections, type GovernanceSection } from '@/lib/shielded-preview/governance-sections';
import { GOVERNANCE_PATH, labsAddress } from '@/lib/shielded-preview/portals';

export { governanceSections };
export type { GovernanceSection };
const glyphs: Record<GovernanceSection, GovernanceGlyphKind> = { Overview: 'overview', 'How it works': 'process', Proposals: 'proposals', Grants: 'grants', Voting: 'voting', Results: 'results', ZCAP: 'zcap', ZIPs: 'zips', Insights: 'insights', Transparency: 'transparency' };

/**
 * The governance sections. On a wide screen they are a sidebar in the manner of OpenZcash: the portal's name on
 * top, one compact row per section with its icon, and the way to Shielded Labs at the foot. On a small screen
 * they are a grid of buttons under the portal bar. The name is a plain link: the frame opens it in place.
 */
export default function GovernanceNavigation({ value, onChange }: {
  value: GovernanceSection; onChange: (section: GovernanceSection) => void;
}) {
  function open(event: MouseEvent<HTMLAnchorElement>, section: GovernanceSection) {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onChange(section);
  }
  const sections = () => governanceSections.map(section => <a key={section}
    href={`?view=governance&section=${governanceSectionSlug(section)}`}
    aria-current={value === section ? 'page' : undefined}
    onClick={event => open(event, section)}><GovernanceGlyph kind={glyphs[section]}/><span>{section}</span></a>);
  return <>
    <aside className={s.sidebar} aria-label="Governance sidebar">
      <a className={s.brand} href={GOVERNANCE_PATH}>
        <Image src="/logos/zcash.svg" width={30} height={30} alt=""/><span>Zcash Governance</span>
      </a>
      <nav className={s.list} aria-label="Governance sections">{sections()}</nav>
      <div className={s.foot}>
        <a className={s.labs} href={labsAddress('?view=overview')}><span>Maintained by</span><span className={s.labsName}><ShieldMark size={18}/><strong>Shielded Labs</strong></span></a>
      </div>
    </aside>
    <nav className={s.navigation} aria-label="Governance sections">{sections()}</nav>
  </>;
}
