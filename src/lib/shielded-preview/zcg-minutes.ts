// Minutes of the ZCG committee's meetings, as the committee posts them in its forum category.
// The portal lists and links them. It does not summarise what was decided.
import { z } from 'zod';
import type { Source } from './governance-types';

export const minutesCategoryUrl = 'https://forum.zcashcommunity.com/c/grants/zomg-updates/34';
/** The first page of the category: the topics with the latest activity, where new minutes appear. */
export const minutesFeedUrl = `${minutesCategoryUrl}.json`;

const topicSchema = z.object({ id: z.number().int().positive(), title: z.string().min(1), slug: z.string().min(1), created_at: z.iso.datetime(), posts_count: z.number().int().positive() });
const categorySchema = z.object({ topic_list: z.object({ topics: z.array(topicSchema) }) });
export const meetingMinutesSchema = z.object({
  id: z.number().int().positive(), title: z.string().min(1), url: z.url(),
  posted: z.iso.datetime(),
  /** Day of the meeting, read from the title; null when the title names none. */
  meeting: z.iso.date().nullable(),
  replies: z.number().int().nonnegative(),
});
export type MeetingMinutes = z.infer<typeof meetingMinutesSchema>;

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const day = (year: number, month: number, date: number) => {
  const value = new Date(Date.UTC(year, month - 1, date));
  return month >= 1 && month <= 12 && value.getUTCMonth() === month - 1 && value.getUTCDate() === date ? value.toISOString().slice(0, 10) : null;
};
/** The meeting day named in a title: "10/23/2026", "10-8-2020", "3/9/21" or "April 27, 2026". */
export function meetingDay(title: string): string | null {
  const numeric = /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})\b/.exec(title);
  if (numeric) return day(Number(numeric[3]) + (numeric[3].length === 2 ? 2000 : 0), Number(numeric[1]), Number(numeric[2]));
  const named = /\b([A-Za-z]+) (\d{1,2}), (\d{4})\b/.exec(title);
  const month = named ? MONTHS.indexOf(named[1].toLowerCase()) : -1;
  return named && month >= 0 ? day(Number(named[3]), month + 1, Number(named[2])) : null;
}

/** The meeting minutes among the topics of a category page. */
export function minutesFromTopics(payload: unknown): MeetingMinutes[] {
  return categorySchema.parse(payload).topic_list.topics
    .filter(topic => /meeting\s+minutes/i.test(topic.title))
    .map(topic => meetingMinutesSchema.parse({
      id: topic.id, title: topic.title.trim(), url: `https://forum.zcashcommunity.com/t/${topic.slug}/${topic.id}`,
      posted: topic.created_at, meeting: meetingDay(topic.title), replies: topic.posts_count - 1,
    }));
}
/** Newest meeting first. A topic read again replaces its saved copy, so reply counts stay current. */
export function mergeMinutes(saved: readonly MeetingMinutes[], latest: readonly MeetingMinutes[]) {
  const held = (item: MeetingMinutes) => item.meeting ?? item.posted.slice(0, 10);
  return [...new Map([...saved, ...latest].map(item => [item.id, item])).values()].sort((a, b) => held(b).localeCompare(held(a)) || b.id - a.id);
}

export const emptyMinutesSource: Source<MeetingMinutes[] | null> = { data: null, state: 'unavailable', observedAt: null, url: minutesCategoryUrl };
const savedSchema = z.object({ observedAt: z.iso.datetime(), topics: z.array(topicSchema).min(1) });
/** The dated copy bundled with the portal, shown until a live read succeeds. A copy that cannot be read never implies an empty archive. */
export function minutesSnapshotSource(saved: unknown): Source<MeetingMinutes[] | null> {
  const parsed = savedSchema.safeParse(saved);
  if (!parsed.success) return emptyMinutesSource;
  const data = mergeMinutes([], minutesFromTopics({ topic_list: { topics: parsed.data.topics } }));
  return data.length ? { data, total: data.length, state: 'snapshot', observedAt: parsed.data.observedAt, url: minutesCategoryUrl } : emptyMinutesSource;
}
