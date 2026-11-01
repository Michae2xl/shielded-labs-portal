/* eslint-disable @next/next/no-img-element */
import s from './portal.module.css';

// Use the original brand asset without redrawing or distorting the shield.
export function ShieldMark({ size = 34 }: { size?: number }) {
  return <img src="/logos/shielded-labs.png" width={size} height={size} alt="" />;
}

export function ShieldSculpture() {
  return <div className={s.sculpture}>
    <img className={s.originalShield} src="/logos/shielded-labs.png" width="144" height="144" alt="Shielded Labs" />
  </div>;
}
