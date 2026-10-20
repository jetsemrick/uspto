import type { ChartCell } from "@/lib/schemas/chart";
import type { LimitationSplit } from "@/lib/schemas/limitations";
import type { MatterDocuments } from "@/lib/ai/context";

const SYSTEM_EXAMINER = `You assist USPTO patent examiners evaluating whether claims would have been obvious under 35 U.S.C. §103.
Your role is a neutral assessment, not advocacy for either the examiner or the applicant. "Obviousness supported", "not supported", and "record incomplete" are equally valid outcomes.
Follow the Graham v. John Deere framework (scope and content of the prior art, differences between the claims and the prior art, level of ordinary skill) and KSR for any reason to combine, including whether a person of ordinary skill would have had a reasonable expectation of success.
Never treat a limitation as disclosed unless the reference text supports it with a direct quotation.
If a reference does not teach a limitation, say so plainly. Do not infer or fill gaps.`;

export function limitationSplitPrompt(docs: MatterDocuments): string {
  return `${SYSTEM_EXAMINER}

Split each independent claim into discrete limitations suitable for a claim chart (preamble separate where helpful).
List dependent claims with what each adds over its parent.

Documents:
${formatDocs(docs)}`;
}

export function claimChartPrompt(
  docs: MatterDocuments,
  split: LimitationSplit,
): string {
  return `${SYSTEM_EXAMINER}

Using ONLY the examiner-confirmed limitation split below, fill a claim chart.
For each limitation and each reference, return status supported | partial | missing.
When supported or partial, quote EXACT contiguous text from that reference's body and give a locator.
When missing, omit quote and explain briefly in readsOn why it is not taught.

Confirmed limitation split (JSON):
${JSON.stringify(split, null, 2)}

Documents:
${formatDocs(docs)}`;
}

export type ChartMappingContext = ChartCell & {
  referenceLabel: string;
  limitationText: string;
  claimNumber: number;
};

export type LimitationGap = {
  limitationId: string;
  limitationText: string;
  claimNumber: number;
};

export function evaluationPrompt(input: {
  docs: MatterDocuments;
  split: LimitationSplit;
  baseReferenceId: string;
  agreed: ChartMappingContext[];
  disagreed: ChartMappingContext[];
  unreviewed: ChartMappingContext[];
  gaps: LimitationGap[];
}): string {
  const base = input.docs.references.find((r) => r.id === input.baseReferenceId);
  return `${SYSTEM_EXAMINER}

Evaluate whether each independent claim would have been obvious over the references, using the examiner's review of the claim chart below.
Base reference for any combination: ${base?.label ?? input.baseReferenceId} — ${base?.title ?? ""}

How to treat the chart:
- Agreed mappings: the examiner agrees the quoted text teaches the limitation. These are the only teachings you may rely on.
- Disagreed mappings: the examiner does not agree the reference teaches the limitation. Treat the limitation as not taught by that reference.
- Unreviewed mappings: the examiner has not decided. Do not rely on them; if the outcome turns on one, the finding is insufficient-record.
- Gaps: limitations with no agreed teaching in any reference.

For each independent claim, return a claimAssessment:
- supported: every limitation has an agreed teaching, and a reason to combine with a reasonable expectation of success can be articulated from the references or the level of ordinary skill.
- not-supported: a limitation is not taught and nothing in the record suggests it, or the combination would teach away, change the principle of operation, or render the base reference unsatisfactory for its purpose.
- insufficient-record: the outcome depends on unreviewed mappings, or further search could reasonably change it.
A claim with any limitation in the gap list cannot be "supported".
Give a confidence and a short neutral summary.

Return sections with exactly these ids and headings:
- scope-and-content | Scope and content of the prior art
- differences | Differences between the claims and the prior art
- level-of-skill | Level of ordinary skill in the art
- combination | Reason to combine and expectation of success (state the strongest rationale and its weakest point)
- counterpoints | Considerations against obviousness (missing elements, teaching away, likely applicant arguments, and how strong each is)
- dependent-claims | Dependent claims (whether each stands or falls with its parent, or needs its own teaching)
- next-steps | Open questions and further search

Quote only agreed mappings. Do not present a gap as taught.

Agreed mappings (JSON):
${JSON.stringify(input.agreed, null, 2)}

Disagreed mappings (JSON):
${JSON.stringify(input.disagreed, null, 2)}

Unreviewed mappings (JSON):
${JSON.stringify(input.unreviewed, null, 2)}

Gaps (JSON):
${JSON.stringify(input.gaps, null, 2)}

Dependent claims (JSON):
${JSON.stringify(input.split.dependentClaims, null, 2)}

Application metadata: ${input.docs.applicationNumber} — ${input.docs.title}`;
}

export function reviseSectionPrompt(input: {
  sectionId: string;
  heading: string;
  currentBody: string;
  instruction: string;
  docs: MatterDocuments;
}): string {
  return `${SYSTEM_EXAMINER}

Rewrite ONLY the following evaluation section according to the examiner instruction. Keep the same section id and heading.
Preserve factual citations; do not add teachings that are not in the documents, and keep the assessment neutral.

Section id: ${input.sectionId}
Heading: ${input.heading}

Current text:
${input.currentBody}

Examiner instruction:
${input.instruction}

Documents (for citation accuracy):
${formatDocs(input.docs)}`;
}

function formatDocs(docs: MatterDocuments): string {
  const refs = docs.references
    .map((r) => `[${r.label} id=${r.id}] ${r.title}\n${r.body}`)
    .join("\n\n");
  return `Claims:\n${docs.claims}\n\nSpecification:\n${docs.specification}\n\nReferences:\n${refs}`;
}
