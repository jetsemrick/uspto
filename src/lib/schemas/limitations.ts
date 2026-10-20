import { z } from "zod";

export const limitationSchema = z.object({
  id: z.string().describe("Stable id, e.g. claim-1-lim-a"),
  claimNumber: z.number().int().positive(),
  text: z.string().describe("Verbatim limitation text from the claim"),
  order: z.number().int().nonnegative(),
});

export const dependentClaimNoteSchema = z.object({
  claimNumber: z.number().int().positive(),
  adds: z.string().describe("What this dependent claim adds over its parent"),
  parentClaimNumber: z.number().int().positive(),
});

export const limitationSplitSchema = z.object({
  independentClaims: z.array(
    z.object({
      claimNumber: z.number().int().positive(),
      preamble: z.string().optional(),
      limitations: z.array(limitationSchema),
    }),
  ),
  dependentClaims: z.array(dependentClaimNoteSchema),
  notes: z
    .string()
    .optional()
    .describe("Brief notes on claim construction choices"),
});

export type LimitationSplit = z.infer<typeof limitationSplitSchema>;
export type Limitation = z.infer<typeof limitationSchema>;
