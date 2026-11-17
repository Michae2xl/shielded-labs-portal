import type { BodyTurnout, TurnoutSnapshot } from '@/lib/shielded-preview/poll-turnout/turnout';
import { headerUrl, type AnswerWeight } from '@/lib/shielded-preview/poll-turnout/vote-chain';
import { formatCount, stampLabel } from '@/lib/shielded-preview/poll-turnout/view';
import officialBallot from '@/lib/shielded-preview/poll-turnout/nu71-questions.json';
import s from './poll-turnout.module.css';

const zec = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
const part = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

export function coinholderPhase(snapshot: TurnoutSnapshot) {
  switch (snapshot.phase) {
    case 'upcoming': return 'Voting upcoming';
    case 'open': return 'Voting open';
    case 'counting': return 'Awaiting tally';
    case 'closed': return snapshot.questions.length && snapshot.questions.every((q) => q.results?.length) ? 'Final results' : 'Tally unavailable';
  }
}

function Chevron() {
  return <svg className={s.qChevron} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>;
}

function AnswerBars({ answers }: { answers: AnswerWeight[] }) {
  const total = answers.reduce((sum, answer) => sum + answer.zec, 0);
  return (
    <div className={s.answerChart}>
      <div className={s.answerTotal}><span>Voting weight on this question</span><strong>{zec.format(total)} ZEC</strong></div>
      <ul aria-label="ZEC voting weight by answer">
        {answers.map((answer) => {
          const fraction = total ? answer.zec / total : 0;
          const percentage = fraction > 0 && fraction < 0.001 ? '<0.1%' : part.format(fraction);
          return <li key={answer.label}>
            <span className={s.answerName}>{answer.label}</span>
            <span className={s.answerValue}>{zec.format(answer.zec)} ZEC{total > 0 && <small> · {percentage}</small>}</span>
            <span className={s.answerTrack} aria-hidden="true"><i style={{ width: `${fraction * 100}%` }} /></span>
          </li>;
        })}
      </ul>
      <p>Percentages use all ZEC on this question, including abstentions.</p>
    </div>
  );
}

function ReadingTime({ at, stale }: { at?: string | null; stale?: boolean }) {
  if (!at) return <span className={s.readingTime}>Awaiting a reading</span>;
  return <span className={s.readingTime}>{stale ? 'Last available' : 'Observed'} <time dateTime={at}>{stampLabel(Date.parse(at))}</time></span>;
}

export function CoinholderCounts({ snapshot, body }: { snapshot: TurnoutSnapshot; body: BodyTurnout }) {
  const casts = snapshot.casts;
  const total = casts?.data ? Object.values(casts.data.questions).reduce((sum, n) => sum + n, 0) : null;
  return <dl className={s.coinCounts} aria-label="Coinholder activity across all questions">
    <div>
      <dt>Casts</dt><dd>{formatCount(total)}</dd>
      <dd><ReadingTime at={casts?.observedAt} stale={casts?.state === 'stale'} /></dd>
    </div>
    <div>
      <dt>Shares</dt><dd>{formatCount(body.value)}</dd>
      <dd><ReadingTime at={body.observedAt} stale={body.state === 'stale'} /></dd>
    </div>
  </dl>;
}

export function CoinholderVote({ snapshot }: { snapshot: TurnoutSnapshot }) {
  const phase = coinholderPhase(snapshot);
  const published = phase === 'Final results';
  const pending = phase === 'Tally unavailable';
  const statusText = {
    open: 'A cast is one vote commitment on one question. Its encrypted fragments arrive as shares. A wallet can make several casts. The final tally shows the ZEC behind each answer.',
    upcoming: 'When voting opens, coinholders can answer each question using their eligible ZEC.',
    counting: 'Voting has closed. Results will appear when the vote chain publishes the final ZEC amounts.',
    closed: pending ? 'Voting has closed. A complete tally for this round is currently unavailable.' : 'Each bar shows the ZEC behind one answer. The same ZEC can be used on different questions.',
  }[snapshot.phase];
  const chain = snapshot.bodies.find((body) => body.kind === 'vote-chain');

  const castCount = snapshot.casts?.data;

  return (
    <section className={s.questions} aria-labelledby="poll-turnout-questions">
      <header className={s.coinHead}>
        <div className={s.coinTitle}><h4 id="poll-turnout-questions">{published ? 'Coinholder results by question' : 'Coinholder activity by question'}</h4><span className={s.phaseBadge}>{phase}</span></div>
        <p className={s.questionHint}>{statusText}</p>
        {!published && <p className={s.observation}>
          {castCount && <a href={headerUrl(castCount.height)} target="_blank" rel="noopener noreferrer">Block for cast count ↗</a>}
          {castCount && chain && ' · '}
          {chain && <a href={chain.source.href} target="_blank" rel="noopener noreferrer">Share totals by question ↗</a>}
        </p>}
      </header>
      <ol>
        {snapshot.questions.map((question) => {
          const official = snapshot.round === officialBallot.round ? officialBallot.questions.find((q) => q.id === question.id) : undefined;
          return <li key={question.id}>
            <details className={s.question}>
              <summary className={s.questionSummary}>
                <span className={s.qNumber}>Q{question.id}</span>
                <span className={s.qLabel}>{question.label}</span>
                <span className={s.qMetric}>
                  {published && question.results
                    ? <>{zec.format(question.results.reduce((sum, answer) => sum + answer.zec, 0))} <small>ZEC</small></>
                    : <span className={s.qCounts}>
                      <span>{formatCount(castCount?.questions[question.id] ?? null)} <small>{castCount?.questions[question.id] === 1 ? 'cast' : 'casts'}</small></span>
                      <span>{formatCount(question.shares)} <small>{question.shares === 1 ? 'share' : 'shares'}</small></span>
                    </span>}
                </span>
                <Chevron />
              </summary>
              <div className={s.officialQuestion}>
                {published && question.results && <AnswerBars answers={question.results} />}
                {official ? <>
                  <span className={s.officialLabel}>Official question</span>
                  <h5>{official.title}</h5>
                  {official.paragraphs.map((paragraph, i) => <p key={i} className={i === official.paragraphs.length - 1 ? s.questionPrompt : undefined}>{paragraph}</p>)}
                  {!published && <ul className={s.answerOptions} aria-label="Answer options">{official.options.map((option) => <li key={option}>{option}</li>)}</ul>}
                  <a href={officialBallot.source} target="_blank" rel="noopener noreferrer">Official ballot source ↗</a>
                </> : <p>Official wording is unavailable for this question.</p>}
              </div>
            </details>
          </li>;
        })}
      </ol>
      {published && chain && <a className={s.resultSource} href={chain.source.href} target="_blank" rel="noopener noreferrer">View this round on the vote chain ↗</a>}
    </section>
  );
}
