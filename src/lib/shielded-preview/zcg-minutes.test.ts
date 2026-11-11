import { describe, expect, it } from 'vitest';
import saved from './governance-data/zcg-minutes.json';
import { meetingDay, mergeMinutes, minutesFromTopics, minutesSnapshotSource } from './zcg-minutes';

const topic = (id: number, title: string, created = '2026-10-25T14:03:21.123Z', posts = 3) => ({ id, title, slug: `topic-${id}`, created_at: created, posts_count: posts, fancy_title: title, views: 10 });
const category = (...topics: unknown[]) => ({ topic_list: { more_topics_url: null, topics } });

describe('ZCG meeting minutes', () => {
  it('reads the meeting day from the title, in the formats the committee has used', () => {
    expect(meetingDay('Zcash Community Grants Meeting Minutes 10/23/2026')).toBe('2026-10-23');
    expect(meetingDay('Zcash Community Grants Meeting Minutes 05/25/2026')).toBe('2026-05-25');
    expect(meetingDay('Zcash Community Grants Meeting Minutes April 27, 2026')).toBe('2026-04-27');
    expect(meetingDay('Zcash Community Grants Meeting Minutes: October 2, 2023')).toBe('2023-10-02');
    expect(meetingDay('MGRC Update 10-8-2020 and Meeting Minutes')).toBe('2020-10-08');
    expect(meetingDay('ZOMG Meeting Minutes 3/9/21')).toBe('2021-03-09');
    expect(meetingDay('Meeting Minutes 13/40/2026')).toBeNull();
    expect(meetingDay('Meeting Minutes of the committee')).toBeNull();
  });
  it('keeps only meeting minutes from the category, with the link, the day posted and the replies', () => {
    const rows = minutesFromTopics(category(topic(58488, 'Zcash Community Grants Meeting Minutes 10/23/2026'), topic(58069, 'ZCG-Funded V12 Credits for AI Security Scans: Applications Open'), topic(56384, 'Zcash Community Grants Meeting  Minutes 6/22/2026', '2026-06-24T10:00:00.000Z', 1)));
    expect(rows).toEqual([
      { id: 58488, title: 'Zcash Community Grants Meeting Minutes 10/23/2026', url: 'https://forum.zcashcommunity.com/t/topic-58488/58488', posted: '2026-10-25T14:03:21.123Z', meeting: '2026-10-23', replies: 2 },
      { id: 56384, title: 'Zcash Community Grants Meeting  Minutes 6/22/2026', url: 'https://forum.zcashcommunity.com/t/topic-56384/56384', posted: '2026-06-24T10:00:00.000Z', meeting: '2026-06-22', replies: 0 },
    ]);
    expect(() => minutesFromTopics({ topics: [] })).toThrow();
  });
  it('adds what a new read brings to the saved archive, newest meeting first, without repeating a topic', () => {
    const old = minutesFromTopics(category(topic(1, 'Meeting Minutes 1/5/2026', '2026-01-07T10:00:00.000Z'), topic(2, 'Meeting Minutes 2/2/2026', '2026-02-03T10:00:00.000Z', 2)));
    const latest = minutesFromTopics(category(topic(3, 'Meeting Minutes 3/2/2026', '2026-03-03T10:00:00.000Z'), topic(2, 'Meeting Minutes 2/2/2026', '2026-02-03T10:00:00.000Z', 6)));
    const merged = mergeMinutes(old, latest);
    expect(merged.map(row => row.id)).toEqual([3, 2, 1]);
    expect(merged[1].replies).toBe(5);
  });
  it('reads the saved archive, and treats a broken copy as no data instead of an empty archive', () => {
    const source = minutesSnapshotSource(saved);
    expect(source.state).toBe('snapshot');
    expect(source.data!.length).toBe(saved.topics.length);
    expect(new Set(source.data!.map(row => row.id)).size).toBe(source.data!.length);
    const days = source.data!.map(row => row.meeting ?? row.posted.slice(0, 10));
    expect(days).toEqual([...days].sort().reverse());
    expect(source.data!.filter(row => row.meeting === null)).toEqual([]);
    expect(minutesSnapshotSource({ observedAt: saved.observedAt, topics: [] })).toMatchObject({ data: null, state: 'unavailable' });
    expect(minutesSnapshotSource(undefined)).toMatchObject({ data: null, state: 'unavailable' });
  });
});
