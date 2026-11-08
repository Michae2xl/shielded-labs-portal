export const governanceSections = ['Overview', 'How it works', 'Proposals', 'Grants', 'Voting', 'Results', 'ZCAP', 'ZIPs', 'Insights', 'Transparency'] as const;
export type GovernanceSection = typeof governanceSections[number];

/** URL form of a section name: `?view=governance&section=how-it-works`. */
export const governanceSectionSlug = (section: GovernanceSection) => section.toLowerCase().replace(/\s+/g, '-');
export function governanceSectionFromSlug(value: string | null | undefined): GovernanceSection | null {
  const slug = value?.trim().toLowerCase();
  return slug ? governanceSections.find(section => governanceSectionSlug(section) === slug) ?? null : null;
}
