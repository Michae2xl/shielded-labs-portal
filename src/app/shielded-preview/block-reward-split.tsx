import { blockRewardSplit, blockRewardSummary } from '@/lib/shielded-preview/block-reward-split';
import s from './block-reward-split.module.css';

/** One whole in three parts: a tall segmented bar with each share on its block and the names in the legend below. */
export default function BlockRewardSplit() {
  return <figure className={s.figure}>
    <figcaption><strong>Block reward split</strong><span>Current rule, until the 2028 halving</span></figcaption>
    <div className={s.bar} role="img" aria-label={blockRewardSummary()}>
      {blockRewardSplit.map(part => <span key={part.id} data-part={part.id} style={{ flexGrow: part.share }} title={`${part.share}% of each block reward goes to ${part.recipient}`}>{`${part.share}%`}</span>)}
    </div>
    <ul className={s.legend} aria-hidden="true">{blockRewardSplit.map(part => <li key={part.id} data-part={part.id}>{part.label}</li>)}</ul>
  </figure>;
}
