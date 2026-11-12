import Image from 'next/image';
import { GOVERNANCE_PATH, labsAddress } from '@/lib/shielded-preview/portals';
import { ShieldMark } from '@/app/shielded-preview/shield';
import s from './governance-portal.module.css';

/** The bar small screens show in place of the sidebar: the portal's name, and the way to the portal of the organization that maintains it. The frame opens the name's link in place. */
export default function GovernanceHeader() {
  return <header className={s.bar}>
    <div className={s.barInner}>
      <a className={s.brand} href={GOVERNANCE_PATH} aria-label="Zcash Governance, front page">
        <Image className={s.mark} src="/logos/zcash.svg" width={28} height={28} alt=""/>
        <span className={s.name}><span>Zcash</span><strong>Governance</strong></span>
      </a>
      <a className={s.labs} href={labsAddress('?view=overview')}><ShieldMark size={22}/><strong>Shielded Labs</strong></a>
    </div>
  </header>;
}
