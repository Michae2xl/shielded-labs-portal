import type { ApplicationField } from './coinholder-proposals';

export type FieldGroupId = 'application' | 'team' | 'funding' | 'milestones' | 'risks';
export type FieldGroup = { id: FieldGroupId; label: string; fields: ApplicationField[] };

// Scalar answers already shown at the top of the record, or form administration.
const skip = /^(terms and conditions|application owners|organi[sz]ation( or individual)? name|how did you learn|requested grant amount|category|community forum posting)/i;
const rules: { id: FieldGroupId; label: string; test: RegExp }[] = [
  { id: 'team', label: 'Team', test: /^(project lead|additional team members|team)/i },
  { id: 'funding', label: 'Budget & funding', test: /cost|budget|funding|compensation|justification/i },
  { id: 'milestones', label: 'Milestones', test: /milestone/i },
  { id: 'risks', label: 'Risks & metrics', test: /risk|side effect|success metric/i },
];
const order: FieldGroupId[] = ['application', 'team', 'funding', 'milestones', 'risks'];
const labels: Record<FieldGroupId, string> = { application: 'Application', team: 'Team', funding: 'Budget & funding', milestones: 'Milestones', risks: 'Risks & metrics' };

/** A ZCG application form split into the sections its record lists: the summary on its own, the rest by subject. */
export function zcgGroups(fields: ApplicationField[]): { summary: ApplicationField | null; sections: FieldGroup[] } {
  const summary = fields.find(field => /^project summary$/i.test(field.heading)) ?? null;
  const buckets = new Map<FieldGroupId, ApplicationField[]>();
  for (const field of fields) {
    if (field === summary || skip.test(field.heading)) continue;
    const id = rules.find(rule => rule.test.test(field.heading))?.id ?? 'application';
    buckets.set(id, [...(buckets.get(id) ?? []), field]);
  }
  return { summary, sections: order.filter(id => buckets.has(id)).map(id => ({ id, label: labels[id], fields: buckets.get(id)! })) };
}
