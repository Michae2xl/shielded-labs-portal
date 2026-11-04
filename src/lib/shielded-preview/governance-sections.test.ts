import { describe, expect, it } from 'vitest';
import { governanceSectionFromSlug, governanceSectionSlug, governanceSections } from './governance-sections';

describe('Governance section URLs', () => {
  it('round-trips every section through its slug, case-insensitively', () => {
    for (const section of governanceSections) {
      expect(governanceSectionFromSlug(governanceSectionSlug(section))).toBe(section);
      expect(governanceSectionFromSlug(governanceSectionSlug(section).toUpperCase())).toBe(section);
    }
    expect(governanceSectionSlug('How it works')).toBe('how-it-works');
    expect(governanceSectionSlug('ZIPs')).toBe('zips');
  });
  it('keeps unknown or empty sections out', () => {
    expect(governanceSectionFromSlug('how it works')).toBeNull();
    expect(governanceSectionFromSlug('')).toBeNull();
    expect(governanceSectionFromSlug(null)).toBeNull();
    expect(governanceSectionFromSlug('zip')).toBeNull();
  });
});
