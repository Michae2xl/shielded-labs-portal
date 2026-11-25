import { emphasisParts, governanceIntro } from '@/lib/shielded-preview/governance-intro';
import s from './poll-site.module.css';

function Emphasized({ text }: { text: string }) {
  return <>{emphasisParts(text).map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part)}</>;
}

/** Opens the page: what Zcash governance covers, before the poll that is running. */
export default function GovernanceIntro() {
  return <section className={s.overview} aria-labelledby="governance-intro-heading">
    <h1 id="governance-intro-heading">{governanceIntro.title}</h1>
    <p className={s.overviewSummary}>{governanceIntro.summary}</p>
    <div className={s.overviewFunctions}>
      {governanceIntro.functions.map(item => <p key={item.lead}><strong>{item.lead}</strong> <Emphasized text={item.text}/></p>)}
    </div>
  </section>;
}
