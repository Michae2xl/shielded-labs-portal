/* eslint-disable @next/next/no-img-element */

// Use the original brand asset without redrawing or distorting the shield.
export function ShieldMark({ size = 34 }: { size?: number }) {
  return <img src="/logos/shielded-labs.png" width={size} height={size} alt="" />;
}
