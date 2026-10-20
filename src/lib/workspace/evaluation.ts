import type { MatterDocuments } from "@/lib/ai/context";
import type { ChartMappingContext, LimitationGap } from "@/lib/ai/prompts";
import { quoteExistsInBody } from "@/lib/quote-verify";
import {
  DETERMINATION_LABELS,
  FINDING_LABELS,
  type ClaimAssessment,
  type EvaluationSection,
  type ExaminerDetermination,
} from "@/lib/schemas/evaluation";
import type { LimitationSplit } from "@/lib/schemas/limitations";
import type { ReviewedCell } from "@/lib/types/workspace";

export function partitionChart(
  docs: MatterDocuments,
  split: LimitationSplit,
  cells: ReviewedCell[],
): {
  agreed: ChartMappingContext[];
  disagreed: ChartMappingContext[];
  unreviewed: ChartMappingContext[];
  gaps: LimitationGap[];
} {
  const refs = new Map(docs.references.map((r) => [r.id, r]));
  const limitations = new Map(
    split.independentClaims.flatMap((ic) => ic.limitations).map((l) => [l.id, l]),
  );

  const agreed: ChartMappingContext[] = [];
  const disagreed: ChartMappingContext[] = [];
  const unreviewed: ChartMappingContext[] = [];

  for (const cell of cells) {
    if (cell.status === "missing") continue;
    const ref = refs.get(cell.referenceId);
    const lim = limitations.get(cell.limitationId);
    if (!ref || !lim) continue;
    const context: ChartMappingContext = {
      limitationId: cell.limitationId,
      referenceId: cell.referenceId,
      status: cell.status,
      quote: cell.quote,
      locator: cell.locator,
      readsOn: cell.readsOn,
      referenceLabel: ref.label,
      limitationText: lim.text,
      claimNumber: lim.claimNumber,
    };
    if (cell.review === "disagreed") {
      disagreed.push(context);
    } else if (cell.review === "pending") {
      unreviewed.push(context);
    } else if (cell.quote && quoteExistsInBody(cell.quote, ref.body)) {
      agreed.push(context);
    } else {
      disagreed.push(context);
    }
  }

  const taught = new Set(agreed.map((a) => a.limitationId));
  const gaps: LimitationGap[] = [...limitations.values()]
    .filter((l) => !taught.has(l.id))
    .map((l) => ({ limitationId: l.id, limitationText: l.text, claimNumber: l.claimNumber }));

  return { agreed, disagreed, unreviewed, gaps };
}

export function claimsWithGaps(gaps: LimitationGap[]): number[] {
  return [...new Set(gaps.map((g) => g.claimNumber))];
}

export function applyGapGuardrail(
  assessments: ClaimAssessment[],
  gapClaims: number[],
): ClaimAssessment[] {
  return assessments.map((a) =>
    a.finding === "supported" && gapClaims.includes(a.claimNumber)
      ? {
          ...a,
          finding: "insufficient-record",
          summary: `${a.summary} [Adjusted: at least one limitation of this claim has no agreed teaching.]`,
        }
      : a,
  );
}

export function reviewSnapshot(cells: ReviewedCell[]): string {
  return cells.map((c) => `${c.limitationId}|${c.referenceId}|${c.review}`).join(",");
}

export function formatEvaluationText(input: {
  docs: MatterDocuments;
  assessments: ClaimAssessment[];
  determinations: Record<number, ExaminerDetermination>;
  sections: EvaluationSection[];
}): string {
  const header = [
    `Obviousness evaluation (35 U.S.C. §103) — ${input.docs.applicationNumber}`,
    input.docs.title,
    "AI-assisted analysis. The determination for each claim is the examiner's.",
  ].join("\n");

  const claims = input.assessments
    .map((a) =>
      [
        `Claim ${a.claimNumber}`,
        `  AI assessment: ${FINDING_LABELS[a.finding]} (${a.confidence} confidence)`,
        `  ${a.summary}`,
        `  Examiner determination: ${DETERMINATION_LABELS[input.determinations[a.claimNumber] ?? "undecided"]}`,
      ].join("\n"),
    )
    .join("\n\n");

  const sections = input.sections.map((s) => `${s.heading}\n\n${s.body}`).join("\n\n---\n\n");

  return [header, claims, sections].filter(Boolean).join("\n\n===\n\n");
}
