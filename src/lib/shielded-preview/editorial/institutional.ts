import roster from './board.json';
import type { ContentNode, EditorialDocument } from './types';

const date = '2026-10-28T00:00:00Z';
const p = (text: string): ContentNode => ({ tag: 'p', children: [text] });
const link = (label: string, href: string): ContentNode => ({ tag: 'p', children: [{ tag: 'a', href, children: [label] }] });
function entry(id: string, title: string, category: string, source: string, summary: string, body: ContentNode[]): EditorialDocument {
  return { dateKind: 'retrieved', id, title, category, source, summary, body, view: 'about', projects: [], author: 'Shielded Labs', publishedAt: date, updatedAt: date, observedAt: date, minutes: 1, headings: [] };
}
export const board = roster;
export const institutionalDocuments: EditorialDocument[] = [
  entry('contact', 'Contact', 'Contact', 'https://shieldedlabs.net/contact/', 'Questions, feedback, collaboration and support.', [
    p('Send questions, ideas and collaboration requests to Shielded Labs using the contact form in this portal.'),
    link('info@shieldedlabs.net', 'mailto:info@shieldedlabs.net'),
    p('Your name, email and message are forwarded to Shielded Labs’ existing contact service when you choose Send message.'),
    link('Shielded Labs on X', 'https://x.com/ShieldedLabs'),
  ]),
  entry('careers', 'Careers', 'Careers', 'https://shieldedlabs.net/jobs/', 'Work on the future of private money.', [
    p('Shielded Labs brings together protocol engineers, cryptographers and contributors working on Zcash.'),
    p('The listed Cryptographer position is marked expired on its role page. No open role has been verified in this content review.'),
    link('Cryptographer · closed listing', '?view=about&section=careers&record=cryptographer'),
    link('Meet the team', '?view=people'),
    link('Contact the team', '?view=about&section=contact'),
  ]),
  entry('cryptographer', 'Cryptographer', 'Closed position', 'https://shieldedlabs.net/job/cryptographer/', 'The source listing has expired.', [
    p('This listing has expired. The public Jobs page describes the role as helping develop and evaluate Zcash’s technical initiatives.'),
    p('The expired role page does not provide a current application process. Contact Shielded Labs to ask about future opportunities.'),
    link('Contact Shielded Labs', '?view=about&section=contact'),
  ]),
  ...roster.map(person => entry(`board-${person.id}`, person.name, 'Board of Directors', person.source, 'Shielded Labs Board of Directors.', [
    p(`${person.name} is listed on the Shielded Labs Board of Directors.`),
    link('Public profile on X', person.social),
    ...(person.name.startsWith('Jason') || person.name.startsWith('Zooko') ? [link('Team & community', '?view=people')] : []),
  ])),
];
