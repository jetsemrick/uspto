import { z } from "zod";

export const mappingStatusSchema = z.enum(["supported", "partial", "missing"]);

export const chartCellSchema = z.object({
  limitationId: z.string(),
  referenceId: z.string(),
  status: mappingStatusSchema,
  quote: z
    .string()
    .optional()
    .describe("Exact quote from the reference; empty when status is missing"),
  locator: z
    .string()
    .optional()
    .describe("Paragraph, column/line, or page in the reference"),
  readsOn: z
    .string()
    .optional()
    .describe("One or two sentences on how the reference reads on the limitation"),
});

export const claimChartSchema = z.object({
  cells: z.array(chartCellSchema),
  summary: z
    .string()
    .optional()
    .describe("High-level chart notes for the examiner"),
});

export type ClaimChart = z.infer<typeof claimChartSchema>;
export type ChartCell = z.infer<typeof chartCellSchema>;
export type MappingStatus = z.infer<typeof mappingStatusSchema>;
