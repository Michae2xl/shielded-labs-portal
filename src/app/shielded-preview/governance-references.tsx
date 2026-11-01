'use client';

import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import s from './governance-references.module.css';

type ReferenceControls = {
  checkedAt: string;
  checkedLabel: string;
  busy: boolean;
  failed: boolean;
  onRefresh: () => void;
  catalog: ReactNode;
};

const ReferenceContext = createContext<ReferenceControls | null>(null);

export function GovernanceReferenceProvider({ children, ...value }: ReferenceControls & { children: ReactNode }) {
  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}

export default function GovernanceReferences({ children }: { children?: ReactNode }) {
  const controls = useContext(ReferenceContext);
  const [open, setOpen] = useState(false);
  const id = useId();

  return <section className={s.references} aria-label="Sources and methodology">
    <div className={s.tools}>
      <button type="button" className={s.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3"/></svg>
        <span>Sources & methodology</span>
        <svg className={s.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {controls && <div className={s.update}>
        <span role="status">{controls.busy ? 'Checking sources…' : controls.failed ? 'Update unavailable' : <>Checked <time dateTime={controls.checkedAt}>{controls.checkedLabel}</time></>}</span>
        <button type="button" className={s.refresh} disabled={controls.busy} onClick={controls.onRefresh} aria-label="Refresh governance data" title="Refresh data">
          <svg className={controls.busy ? s.spinning : undefined} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/></svg>
        </button>
      </div>}
    </div>
    <div className={s.panel} id={id} hidden={!open}>
      {children}
      {controls && (children ? <details className={s.catalog}><summary>All governance data sources<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div>{controls.catalog}</div></details> : controls.catalog)}
    </div>
  </section>;
}
