import type { MatterDocuments } from "@/lib/ai/context";
import type { ChartCell } from "@/lib/schemas/chart";
import type { LimitationSplit } from "@/lib/schemas/limitations";

export type CellReview = "pending" | "agreed" | "disagreed";

export type ReviewedCell = ChartCell & {
  review: CellReview;
};

export type WorkspacePhase = "intake" | "limitations" | "chart" | "evaluation";

export type ApiMatterBody = {
  docs: MatterDocuments;
};

export type ApiChartBody = ApiMatterBody & {
  limitationSplit: LimitationSplit;
};

export type ApiEvaluateBody = ApiMatterBody & {
  limitationSplit: LimitationSplit;
  baseReferenceId: string;
  cells: ReviewedCell[];
};

export type ApiReviseBody = ApiMatterBody & {
  sectionId: string;
  heading: string;
  currentBody: string;
  instruction: string;
};
