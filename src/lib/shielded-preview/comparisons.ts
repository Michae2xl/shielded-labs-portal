// Reused from Michae2xl/openzcash main, observed 2026-10-25.
import { z } from "zod";
import data from "./governance-data/comparisons.json";

const https = z.url().refine(value => new URL(value).protocol === "https:");
export const comparisonsSchema = z.object({
  schemaVersion: z.literal(1), checkedAt: z.iso.date(),
  rounds: z.array(z.object({
    id: z.string(), title: z.string(), resultDate: z.iso.date(), note: z.string(),
    bodies: z.array(z.object({ id: z.string(), name: z.string(), unit: z.enum(["votes", "ZEC"]), decimals: z.number().int().min(0).max(8), rule: z.string(), participation: z.string(), sourceUrl: https, tallyUrl: https })),
    questions: z.array(z.object({ id: z.string(), title: z.string(), options: z.array(z.object({ id: z.string(), label: z.string(), abstention: z.boolean().optional() })), weights: z.record(z.string(), z.array(z.string().regex(/^\d+$/).nullable())) })),
  })),
}).superRefine(({ rounds, checkedAt }, context) => {
  if (new Set(rounds.map(round => round.id)).size !== rounds.length) context.addIssue({ code: "custom", message: "Duplicate round" });
  for (const round of rounds) {
    if (round.resultDate > checkedAt) context.addIssue({ code: "custom", message: "Unreviewed future result" });
    const bodyIds = round.bodies.map(body => body.id);
    if (new Set(bodyIds).size !== bodyIds.length || bodyIds.length < 2) context.addIssue({ code: "custom", message: "A comparison needs distinct bodies" });
    for (const body of round.bodies) if (body.unit === "votes" && body.decimals !== 0) context.addIssue({ code: "custom", message: "Member votes must be integers" });
    if (new Set(round.questions.map(question => question.id)).size !== round.questions.length) context.addIssue({ code: "custom", message: "Duplicate question" });
    for (const question of round.questions) {
      if (new Set(question.options.map(option => option.id)).size !== question.options.length) context.addIssue({ code: "custom", message: "Duplicate option" });
      if (Object.keys(question.weights).some(id => !bodyIds.includes(id))) context.addIssue({ code: "custom", message: "Unknown voting body" });
      for (const id of bodyIds) if (question.weights[id]?.length !== question.options.length) context.addIssue({ code: "custom", message: "Every option needs a weight or explicit null" });
    }
  }
});
export const comparisons = comparisonsSchema.parse(data);
export type ComparisonRound = typeof comparisons.rounds[number];
export type ComparisonQuestion = ComparisonRound["questions"][number];

/** Each body keeps its own units and denominator; null is never an abstention. */
export function questionResult(question: ComparisonQuestion, bodyId: string, excludeAbstentions: boolean) {
  const weights = question.weights[bodyId];
  const complete = !!weights && weights.length === question.options.length && weights.every(weight => weight !== null);
  const total = complete ? weights.reduce((sum, weight) => sum + BigInt(weight!), 0n) : null;
  const denominator = total === null ? null : weights.reduce((sum, weight, index) => sum + (excludeAbstentions && question.options[index].abstention ? 0n : BigInt(weight!)), 0n);
  const options = question.options.map((option, index) => {
    const weight = weights?.[index] ?? null;
    const included = !(excludeAbstentions && option.abstention);
    const percent = included && denominator !== null && denominator > 0n && weight !== null ? Number((BigInt(weight) * 1000n + denominator / 2n) / denominator) / 10 : null;
    return { ...option, weight, percent, included };
  });
  const candidates = complete ? options.filter(option => !option.abstention && option.weight !== null) : [];
  const max = candidates.reduce((highest, option) => BigInt(option.weight!) > highest ? BigInt(option.weight!) : highest, 0n);
  const leaders = max > 0n ? candidates.filter(option => BigInt(option.weight!) === max).map(option => option.id) : [];
  return { total: total?.toString() ?? null, denominator: denominator?.toString() ?? null, options, leaders };
}

export function formatVotingWeight(value: string | null, decimals: number) {
  if (value === null) return "Not available";
  const scale = 10n ** BigInt(decimals), number = BigInt(value);
  const integer = (number / scale).toLocaleString("en-US");
  const fraction = (number % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

/** Rounding must not erase a small vote or imply unanimity. Raw tallies stay visible. */
export function formatVoteShare(percent: number | null, weight: string | null, denominator: string | null) {
  if (percent === null || weight === null || denominator === null) return "—";
  if (percent < 0.1 && BigInt(weight) > 0n) return "<0.1%";
  if (percent === 100 && BigInt(weight) < BigInt(denominator)) return ">99.9%";
  return `${percent.toFixed(1)}%`;
}
