import { z } from "zod";

export const claimFindingSchema = z.enum([
  "supported",
  "not-supported",
  "insufficient-record",
]);

export const confidenceSchema = z.enum(["low", "medium", "high"]);

export const claimAssessmentSchema = z.object({
  claimNumber: z.number().int().positive(),
  finding: claimFindingSchema.describe(
    "supported: prima facie obviousness is supported on this record; not-supported: it is not; insufficient-record: depends on unreviewed mappings or further search",
  ),
  confidence: confidenceSchema,
  summary: z
    .string()
    .describe("Two or three sentences explaining the finding in neutral terms"),
});

export const evaluationSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  body: z.string(),
});

export const obviousnessEvaluationSchema = z.object({
  claimAssessments: z.array(claimAssessmentSchema),
  sections: z.array(evaluationSectionSchema),
});

export const reviseSectionSchema = z.object({
  section: evaluationSectionSchema,
});

export type ClaimFinding = z.infer<typeof claimFindingSchema>;
export type ClaimAssessment = z.infer<typeof claimAssessmentSchema>;
export type EvaluationSection = z.infer<typeof evaluationSectionSchema>;
export type ObviousnessEvaluation = z.infer<typeof obviousnessEvaluationSchema>;

export const FINDING_LABELS: Record<ClaimFinding, string> = {
  supported: "Obviousness supported on this record",
  "not-supported": "Obviousness not supported on this record",
  "insufficient-record": "Record incomplete",
};

export const examinerDeterminationSchema = z.enum([
  "undecided",
  "obvious",
  "not-obvious",
  "search-further",
]);

export type ExaminerDetermination = z.infer<typeof examinerDeterminationSchema>;

export const DETERMINATION_LABELS: Record<ExaminerDetermination, string> = {
  undecided: "Not yet decided",
  obvious: "Obvious over the cited art",
  "not-obvious": "Not obvious over the cited art",
  "search-further": "Search further before deciding",
};
