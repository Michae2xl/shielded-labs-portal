import { groupContent } from './presentation';
import type { ContentNode, EditorialDocument } from './types';

type FaqTopic = { id: string; label: string; questions: string[] };
export const faqTopics: Record<string, FaqTopic[]> = {
  'crosslink-faq': [
    { id: 'basics', label: 'The basics', questions: [
      'is-zcash-moving-to-full-proof-of-stake', 'what-is-crosslink', 'why-is-finality-important',
      'how-is-crosslink-s-finality-different-from-the-finality-zcash-already-has',
    ] },
    { id: 'staking', label: 'Staking & rewards', questions: [
      'how-does-crosslink-staking-work', 'where-do-staking-rewards-come-from', 'how-much-yield-will-stakers-earn',
      'what-are-epoch-and-unbonding-periods', 'why-are-staking-and-unstaking-actions-batched',
      'what-is-stake-quantization-and-why-does-it-matter', 'why-is-there-an-unbonding-delay',
    ] },
    { id: 'security', label: 'Privacy & security', questions: [
      'does-crosslink-include-slashing', 'does-crosslink-compromise-privacy', 'is-crosslink-fully-shielded-staking',
      'does-crosslink-increase-zcash-s-attack-surface', 'what-happens-if-there-s-an-attack-or-consensus-failure',
      'has-crosslink-received-an-independent-security-review',
    ] },
    { id: 'development', label: 'Design & rollout', questions: [
      'why-are-they-called-finalizers-and-not-validators', 'why-were-the-parameters-changed-from-the-original-design',
      'what-is-tenderlink', 'why-is-time-to-market-an-important-goal-for-crosslink',
      'when-will-crosslink-be-completed', 'what-is-the-governance-process-for-crosslink',
    ] },
  ],
  'nsm-guide': [
    { id: 'basics', label: 'The basics', questions: [
      'what-is-the-network-sustainability-mechanism-nsm', 'why-is-the-nsm-important',
      'what-does-the-nsm-accomplish', 'what-s-the-urgency-for-implementing-this-now',
    ] },
    { id: 'uses', label: 'Uses & benefits', questions: [
      'what-are-the-immediate-benefits-and-use-cases-of-implementing-the-nsm', 'what-are-some-examples-of-future-use-cases',
      'what-other-ways-could-the-future-zec-be-spent', 'why-aren-t-we-talking-about-fees-and-other-long-term-burning-use-cases-now',
    ] },
    { id: 'issuance', label: 'Issuance & miners', questions: [
      'how-and-when-will-burned-zec-be-reintroduced-as-future-block-rewards',
      'what-is-the-reason-for-smoothing-the-issuance-curve', 'how-will-burning-transaction-fees-impact-miners',
    ] },
  ],
};

export function contentText(nodes: ContentNode[]): string {
  return nodes.map(node => typeof node === 'string' ? node : contentText(node.children)).join(' ');
}

export function faqContent(document: EditorialDocument) {
  const grouped = groupContent(document.body, 3);
  const topics = faqTopics[document.id] ?? [];
  return {
    intro: grouped.intro.filter(node => typeof node === 'string' || node.id !== 'frequently-asked-questions-faq'),
    questions: grouped.sections.map((section, index) => ({
      id: section.heading.id!,
      title: contentText(section.heading.children).trim(),
      body: section.body,
      number: index + 1,
      topic: topics.find(topic => topic.questions.includes(section.heading.id!))?.id ?? 'basics',
    })),
  };
}

export function matchesFaq(question: { title: string; body: ContentNode[] }, query: string): boolean {
  const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const text = normalize(`${question.title} ${contentText(question.body)}`);
  return normalize(query).trim().split(/\s+/).every(token => text.includes(token));
}
